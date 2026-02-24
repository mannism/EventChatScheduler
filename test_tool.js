const fs = require('fs');

const exhibitorsData = JSON.parse(fs.readFileSync('data/Scheduler_2026_exhibitors.json', 'utf8')).exhibitors;

// Mock the getExhibitors logic
const getExhibitors = (args, userProfile) => {
    const { name, tags } = args;
    let filtered = exhibitorsData;
    if (name) {
        filtered = filtered.filter((e) => e.name?.toLowerCase().includes(name.toLowerCase()));
    }
    if (tags && tags.length > 0) {
        filtered = filtered.filter((e) =>
            e.tags?.some((tag) => tags.some((t) => tag.toLowerCase().includes(t.toLowerCase())))
        );
    }
    const daysCount = Math.max(1, userProfile.attendanceDays?.length || 1);
    
    // We are expecting max 3 per day
    return filtered.slice(0, 3 * daysCount).map((e) => ({
        name: e.name,
        description: e.shortDescription || e.description || "",
        tags: e.tags
    }));
};

const result = getExhibitors({}, { attendanceDays: ["Sept 3"] });
console.log("Total Exhibitors Returned:", result.length);
console.log(JSON.stringify(result, null, 2));

const result2Days = getExhibitors({}, { attendanceDays: ["Sept 3", "Sept 4"] });
console.log("Total Exhibitors Returned for 2 Days:", result2Days.length);
