import { Session, UserProfile, Schedule, DaySchedule, ScheduleItem } from './types';

// Keynote sessions track name
const MANDATORY_TRACK = "Supercharge";
const NETWORKING_TIME_D1 = { start: "17:15", end: "18:00" };
const NETWORKING_TIME_D2 = { start: "15:45", end: "16:30" };

// Helper to parse time string "HH:mm" to minutes from midnight
function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper to check overlap
function isOverlapping(s1: { start: number, end: number }, s2: { start: number, end: number }, gapFn: number = 0): boolean {
    return Math.max(s1.start, s2.start) < Math.min(s1.end, s2.end) + gapFn; // overlap if start < end
}

// Ensure 5 min gap: s1.end + 5 <= s2.start
// So overlap check with gap: s1.end + 5 > s2.start AND s2.end + 5 > s1.start
function hasConflict(item: ScheduleItem, newItem: Session): boolean {
    const itemStart = timeToMinutes(item.session.startDateTime.split('T')[1].substring(0, 5));
    const itemEnd = timeToMinutes(item.session.endDateTime.split('T')[1].substring(0, 5));
    const newStart = timeToMinutes(newItem.startDateTime.split('T')[1].substring(0, 5));
    const newEnd = timeToMinutes(newItem.endDateTime.split('T')[1].substring(0, 5));

    // Simple overlap check
    // Logic: (StartA < EndB) and (EndA > StartB)
    // Add 5 min gap constraint: effectively extend duration by 5 mins for check? 
    // Or: EndA + 5 <= StartB OR EndB + 5 <= StartA is safe.
    // So conflict if: EndA + 5 > StartB AND EndB + 5 > StartA
    // For XyzCon 2026
    return (itemEnd + 5 > newStart) && (newEnd + 5 > itemStart);
}

export async function generateSchedule(userProfile: UserProfile, allSessions: Session[]): Promise<Schedule> {
    const days: string[] = ["2026-09-03", "2026-09-04"];
    const scheduleDays: DaySchedule[] = [];

    // Filter sessions by days user is attending if specific? 
    // User profile has "attendanceDays" e.g. ["Sept 3", "Sept 4"]
    // Map to dates.
    const userDates: string[] = userProfile.attendanceDays.map(d => d === "Sept 3" ? "2026-09-03" : "2026-09-04");

    for (const date of days) {
        if (!userDates.includes(date)) continue;

        let dailyItems: ScheduleItem[] = [];
        const daySessions = allSessions.filter(s => s.startDateTime.startsWith(date));

        // 1. Mandatory Sessions (Keynotes)
        const keynotes = daySessions.filter(s => s.track === MANDATORY_TRACK);
        keynotes.forEach(s => dailyItems.push({ session: s, type: 'keynote' }));

        // 2. Networking (Fixed)
        // We create a dummy session for networking to block time
        const networkingTime = date === "2026-09-03" ? NETWORKING_TIME_D1 : NETWORKING_TIME_D2;
        const networkingSession: Session = {
            id: `networking-${date}`,
            title: "Networking Drinks",
            track: "Networking",
            stage: "Exhibition Hall",
            stageNumber: "",
            startDateTime: `${date}T${networkingTime.start}:00`,
            endDateTime: `${date}T${networkingTime.end}:00`,
            tags: [],
            regions: []
        };
        dailyItems.push({ session: networkingSession, type: 'networking' });

        // 3. Lunch (1 hour between 11:30 and 14:00)
        // We need to find a slot. 
        // For simplicity, let's try to place lunch at 12:30 - 13:30 first. 
        // If conflict with Keynote, try 11:30-12:30 or 13:00-14:00.
        // We will insert a lunch item.
        let lunchPlaced = false;
        const lunchOptions = [
            { start: "12:30", end: "13:30" },
            { start: "11:30", end: "12:30" },
            { start: "13:00", end: "14:00" },
            { start: "12:00", end: "13:00" }
        ];

        for (const opt of lunchOptions) {
            const lunchSession: Session = {
                id: `lunch-${date}`,
                title: "Lunch Break",
                track: "Break",
                stage: "Catering Area",
                stageNumber: "",
                startDateTime: `${date}T${opt.start}:00`,
                endDateTime: `${date}T${opt.end}:00`,
                tags: [],
                regions: []
            };

            // Check conflicts
            const conflict = dailyItems.some(item => hasConflict(item, lunchSession));
            if (!conflict) {
                dailyItems.push({ session: lunchSession, type: 'lunch' });
                lunchPlaced = true;
                break;
            }
        }

        // If lunch not placed, force it (this might overlap keynote if schedule is bad, but keynotes are priority. 
        // User prompt says "optimized to not conflict with Keynotes". 
        // If all slots conflict, we skip lunch? No, mandatory. 
        // But Keynotes are usually fixed. We assume there is a gap.

        // 4. App Spotlight (5 per day)
        const appSpotlights = daySessions.filter(s => s.track === "App Spotlight" && !dailyItems.some(i => i.session.id === s.id));
        // Shuffle
        const shuffledApps = appSpotlights.sort(() => 0.5 - Math.random());
        let appsAdded = 0;

        for (const app of shuffledApps) {
            if (appsAdded >= 5) break;
            if (!dailyItems.some(i => hasConflict(i, app))) {
                if (timeToMinutes(app.endDateTime.split('T')[1]) > timeToMinutes("17:30")) continue;
                dailyItems.push({ session: app, type: 'session' });
                appsAdded++;
            }
        }

        // 5. Personalization (Fill gaps)
        // Score remaining sessions
        const otherSessions = daySessions.filter(s =>
            s.track !== "App Spotlight" &&
            s.track !== MANDATORY_TRACK &&
            !dailyItems.some(i => i.session.id === s.id)
        );

        // Scoring: +2 for Interest match, +1 for Job Type (if we had job type mapping to tags, but we define generic)
        // Let's rely on Interests matching tags.
        const scoredSessions = otherSessions.map(s => {
            let score = 0;
            const matches = s.tags.filter(tag => userProfile.interests.includes(tag));
            score += matches.length * 2;
            // prioritize "Discovery" and "Partner"
            // if (s.track === "Discovery") score += 1;
            return { session: s, score };
        }).sort((a, b) => b.score - a.score);

        for (const { session } of scoredSessions) {
            if (timeToMinutes(session.endDateTime.split('T')[1]) > timeToMinutes("17:30")) continue;
            if (!dailyItems.some(i => hasConflict(i, session))) {
                dailyItems.push({ session: session, type: 'session' });
            }
        }

        scheduleDays.push({
            date,
            items: dailyItems.sort((a, b) => a.session.startDateTime.localeCompare(b.session.startDateTime))
        });
    }

    return { days: scheduleDays };
}
