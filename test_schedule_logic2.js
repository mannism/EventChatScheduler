const fs = require('fs');

const sessionsData = JSON.parse(fs.readFileSync('data/Scheduler_2026_consolidated_sessions.json', 'utf8')).sessions;
const exhibitorsData = JSON.parse(fs.readFileSync('data/Scheduler_2026_exhibitors.json', 'utf8')).exhibitors;

const defaultProfile = {
    attendanceDays: ["Sept 3", "Sept 4"],
    interests: ["AI", "Tech"]
};

function createSchedule(userProfile = defaultProfile) {
    const attendingDays = userProfile.attendanceDays || [];
    const validDates = [];
    if (attendingDays.includes("Sept 3")) validDates.push("2026-09-03");
    if (attendingDays.includes("Sept 4")) validDates.push("2026-09-04");
    if (validDates.length === 0) validDates.push("2026-09-03", "2026-09-04");

    const userInterests = userProfile.interests || [];
    const sessionsByDay = {};
    validDates.forEach(d => sessionsByDay[d] = []);
    
    sessionsData.forEach(s => {
        const d = s.startDateTime.substring(0, 10);
        if (sessionsByDay[d]) {
            sessionsByDay[d].push(s);
        }
    });

    const schedule = {};

    validDates.forEach(day => {
        const daySessions = sessionsByDay[day].filter(s => {
            const time = s.endDateTime.substring(11, 16);
            return time <= "18:00";
        });

        const mandatory = daySessions.filter(s => s.track === "Supercharge");
        const interested = daySessions.filter(s => 
            s.track !== "Supercharge" && 
            s.tags && 
            s.tags.some(tag => userInterests.some(i => tag.toLowerCase().includes(i.toLowerCase())))
        );
        const others = daySessions.filter(s => s.track !== "Supercharge" && !interested.includes(s));
        const mix = [...interested, ...others].sort(() => 0.5 - Math.random());

        const daySchedule = [];

        const fixedNetworking = [];
        if (day === "2026-09-03") {
            fixedNetworking.push({
                type: "Fixed",
                title: "Networking",
                startDateTime: `${day}T17:15:00`,
                endDateTime: `${day}T18:00:00`,
                stage: "Networking Area",
                stageNumber: "N/A",
                presenters: [],
                shortDescription: "End of day networking."
            });
        } else if (day === "2026-09-04") {
            fixedNetworking.push({
                type: "Fixed",
                title: "Networking",
                startDateTime: `${day}T15:45:00`,
                endDateTime: `${day}T16:30:00`,
                stage: "Networking Area",
                stageNumber: "N/A",
                presenters: [],
                shortDescription: "End of day networking."
            });
        }

        const isOverlap = (start1, end1, start2, end2) => {
            return Math.max(start1, start2) < Math.min(end1, end2);
        };

        const tryAddSession = (s, ignoreGap = false) => {
            const sStart = new Date(s.startDateTime).getTime();
            const sEnd = new Date(s.endDateTime).getTime();
            
            // Check fixed networking
            if (s.type !== "Fixed") {
                for (const n of fixedNetworking) {
                    if (isOverlap(sStart, sEnd, new Date(n.startDateTime).getTime(), new Date(n.endDateTime).getTime())) {
                        return false;
                    }
                }
            }
            
            for (const e of daySchedule) {
                const eStart = new Date(e.startDateTime).getTime();
                const eEnd = new Date(e.endDateTime).getTime();
                const gap = ignoreGap || e.type === "Fixed" ? 0 : 5 * 60 * 1000;
                
                if (sStart < eEnd + gap && eStart < sEnd + gap) return false;
            }
            
            daySchedule.push(s);
            return true;
        }

        // Add fixed networking first so nothing overlaps it
        fixedNetworking.forEach(n => tryAddSession(n, true));

        // Add mandatory first
        mandatory.forEach(m => tryAddSession(m));

        let lunchSlots = [
            { start: `${day}T11:30:00`, end: `${day}T12:30:00` },
            { start: `${day}T12:00:00`, end: `${day}T13:00:00` },
            { start: `${day}T12:30:00`, end: `${day}T13:30:00` },
            { start: `${day}T13:00:00`, end: `${day}T14:00:00` }
        ].sort(() => 0.5 - Math.random());
        
        for (const slot of lunchSlots) {
            const lunchSession = {
                type: "Fixed",
                title: "Lunch Break",
                startDateTime: slot.start,
                endDateTime: slot.end,
                stage: "Dining Area",
                stageNumber: "N/A",
                presenters: [],
                shortDescription: "1-Hour Lunch Break."
            };
            if (tryAddSession(lunchSession, true)) {
                break;
            }
        }
        
        mix.forEach(m => tryAddSession(m));
        
        daySchedule.sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

        let dayExhibitors = exhibitorsData;
        if (userInterests.length > 0) {
            const matchedExhs = dayExhibitors.filter(e => e.tags && e.tags.some(tag => userInterests.some(i => tag.toLowerCase().includes(i.toLowerCase()))));
            const unmatchedExhs = dayExhibitors.filter(e => !matchedExhs.includes(e));
            dayExhibitors = [...matchedExhs.sort(() => 0.5 - Math.random()), ...unmatchedExhs.sort(() => 0.5 - Math.random())];
        } else {
            dayExhibitors = dayExhibitors.sort(() => 0.5 - Math.random());
        }
        
        schedule[day] = {
            sessions: daySchedule.map(s => ({
                time: `${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
                title: s.title,
                stage: s.stage || s.location || "TBA",
                stageNumber: s.stageNumber || "TBA",
                presenters: s.presenters?.map(p => p.name).join(", ") || "N/A",
                summary: s.shortDescription || s.description || ""
            })),
            exhibitors: dayExhibitors.slice(0, 8).map(e => e.name)
        };
    });

    return schedule;
}

console.log(JSON.stringify(createSchedule(), null, 2));

