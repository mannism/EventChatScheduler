/**
 * lib/scheduler.ts
 *
 * Client-side schedule generation engine. Builds a conflict-free, personalized
 * multi-day itinerary for a user based on their attendance days and interests.
 *
 * Schedule generation pipeline (per day):
 *   1. Mandatory keynotes (Supercharge track) — always included
 *   2. Fixed networking slot — end-of-day social event
 *   3. Lunch break — placed in first available slot (12:30, 11:30, 12:00, or 13:00)
 *   4. App Spotlight sessions — up to 5 randomized demos per day
 *   5. Personalized backfill — remaining sessions scored by interest tag matches
 *
 * All sessions are checked for time conflicts with a 5-minute buffer between items.
 */

import { Session, UserProfile, Schedule, DaySchedule, ScheduleItem } from './types';
import { shuffle, hasMatchingTag, countTagMatches } from './matching';
import { DATE_MAP, ALL_EVENT_DATES, NETWORKING_TIMES, LUNCH_SLOT_OPTIONS, END_OF_DAY_CUTOFF } from './constants';

/** Track name for mandatory keynote sessions that all attendees should attend */
const MANDATORY_TRACK = "Supercharge";

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

    // Conflict if sessions overlap with a mandatory 5-minute gap between them.
    // Safe zone: EndA + 5 <= StartB OR EndB + 5 <= StartA
    // Conflict: NOT safe zone → (EndA + 5 > StartB) AND (EndB + 5 > StartA)
    return (itemEnd + 5 > newStart) && (newEnd + 5 > itemStart);
}

/**
 * Generate a complete, conflict-free schedule for the given user.
 * Iterates over the user's selected attendance days and fills each day
 * with keynotes, networking, lunch, App Spotlight demos, and personalized sessions.
 */
export async function generateSchedule(userProfile: UserProfile, allSessions: Session[]): Promise<Schedule> {
    const days: string[] = ALL_EVENT_DATES;
    const scheduleDays: DaySchedule[] = [];

    const userDates: string[] = userProfile.attendanceDays
        .map(d => DATE_MAP[d])
        .filter(Boolean);

    for (const date of days) {
        if (!userDates.includes(date)) continue;

        const dailyItems: ScheduleItem[] = [];
        const daySessions = allSessions.filter(s => s.startDateTime.startsWith(date));

        // 1. Mandatory Sessions (Keynotes)
        const keynotes = daySessions.filter(s => s.track === MANDATORY_TRACK);
        keynotes.forEach(s => dailyItems.push({ session: s, type: 'keynote' }));

        // 2. Networking (Fixed)
        const networkingTime = NETWORKING_TIMES[date] || NETWORKING_TIMES["2026-09-03"];
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

        // 3. Lunch Break (1 hour) — tries preferred slots in order: 12:30, 11:30, 12:00, 13:00
        // Skips any slot that conflicts with already-placed keynotes or networking
        let lunchPlaced = false;
        const lunchOptions = LUNCH_SLOT_OPTIONS;

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

        // If all lunch slots conflict with keynotes, lunch is omitted (rare edge case).
        // Keynotes are fixed and take priority; the event schedule normally has a gap.

        // 4. App Spotlight sessions (up to 5 per day, randomized for variety)
        const appSpotlights = daySessions.filter(s => s.track === "App Spotlight" && !dailyItems.some(i => i.session.id === s.id));
        const shuffledApps = shuffle(appSpotlights);
        let appsAdded = 0;

        for (const app of shuffledApps) {
            if (appsAdded >= 5) break;
            if (!dailyItems.some(i => hasConflict(i, app))) {
                if (timeToMinutes(app.endDateTime.split('T')[1]) > timeToMinutes(END_OF_DAY_CUTOFF)) continue;
                dailyItems.push({ session: app, type: 'session' });
                appsAdded++;
            }
        }

        // 5. Personalized backfill — score remaining sessions by interest relevance
        // and fill gaps in the schedule with the highest-scoring non-conflicting sessions
        const otherSessions = daySessions.filter(s =>
            s.track !== "App Spotlight" &&
            s.track !== MANDATORY_TRACK &&
            !dailyItems.some(i => i.session.id === s.id)
        );

        // Score by interest tag matches (2 points per matching tag)
        const scoredSessions = otherSessions.map(s => {
            const matchCount = countTagMatches(s.tags, userProfile.interests);
            return { session: s, score: matchCount * 2 };
        }).sort((a, b) => b.score - a.score);

        for (const { session } of scoredSessions) {
            if (timeToMinutes(session.endDateTime.split('T')[1]) > timeToMinutes(END_OF_DAY_CUTOFF)) continue;
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
