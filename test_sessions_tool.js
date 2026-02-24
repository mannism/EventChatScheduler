const fs = require('fs');

const sessionsData = JSON.parse(fs.readFileSync('data/Scheduler_2026_consolidated_sessions.json', 'utf8')).sessions;

// Mock searchSessions execution logic
const getSessions = (args, userProfile) => {
    const { track, tags, date } = args;
    let filtered = sessionsData;
    
    // Determine allowed dates based on LLM query or User Profile
    const allowedDates = [];
    if (date) {
        if (date.includes("3") || date.includes("03")) allowedDates.push("2026-09-03");
        if (date.includes("4") || date.includes("04")) allowedDates.push("2026-09-04");
    } else {
        const attendingDays = userProfile?.attendanceDays || [];
        if (attendingDays.includes("Sept 3")) allowedDates.push("2026-09-03");
        if (attendingDays.includes("Sept 4")) allowedDates.push("2026-09-04");
    }
    
    // Default to both days if nothing is specified or matched
    if (allowedDates.length === 0) {
        allowedDates.push("2026-09-03", "2026-09-04");
    }
    
    // Filter by date
    filtered = filtered.filter((s) => allowedDates.includes(s.startDateTime.substring(0, 10)));

    if (track) {
        filtered = filtered.filter((s) => s.track?.toLowerCase().includes(track.toLowerCase()));
    }
    if (tags && tags.length > 0) {
        filtered = filtered.filter((s) =>
            s.tags?.some((tag) => tags.some((t) => tag.toLowerCase().includes(t.toLowerCase())))
        );
    }

    const maxSessions = 3;

    // Group by day and select max non-clashing
    const sessionsByDay = {};
    for (const s of filtered) {
        const day = s.startDateTime.substring(0, 10);
        if (!sessionsByDay[day]) sessionsByDay[day] = [];
        sessionsByDay[day].push(s);
    }

    const finalSessions = [];
    for (const day in sessionsByDay) {
        const daySessions = sessionsByDay[day].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        let selectedForDay = [];
        let lastEndTime = 0;

        for (const s of daySessions) {
            if (selectedForDay.length >= maxSessions) break;
            const sStart = new Date(s.startDateTime).getTime();
            const sEnd = new Date(s.endDateTime).getTime();

            if (sStart >= lastEndTime) {
                selectedForDay.push(s);
                lastEndTime = sEnd;
            }
        }
        finalSessions.push(...selectedForDay);
    }
    
    return finalSessions.map(s => ({
        name: s.title,
        date: `${s.startDateTime.substring(0, 10)}, ${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
    }));
};

console.log("TEST 1: No date, UI attendance=Sept 3 (Should be only 2026-09-03)");
console.log(getSessions({}, { attendanceDays: ["Sept 3"] }));

console.log("\nTEST 2: No date, UI attendance=Sept 3, Sept 4 (Should be both days)");
console.log(getSessions({}, { attendanceDays: ["Sept 3", "Sept 4"] }));

console.log("\nTEST 3: Date requested=Sept 4, UI attendance=Sept 3 (Override)");
console.log(getSessions({ date: "Sept 4" }, { attendanceDays: ["Sept 3"] }));
