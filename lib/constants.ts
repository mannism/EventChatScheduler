export const COUNTRIES = [
    "Australia",
    "Malaysia",
    "Singapore",
    "South Korea",
    "Thailand",
].sort();

export const ATTENDANCE_OPTIONS = [
    { label: "Day 1 (Sept 3)", value: ["Sept 3"] },
    { label: "Day 2 (Sept 4)", value: ["Sept 4"] },
    { label: "Both Days", value: ["Sept 3", "Sept 4"] },
];

export const JOB_TYPES = [
    "Accountant",
    "Bookkeeper",
    "Firm Owner",
    "Progressive Advisor",
    "Growth-oriented Professional",
];

export const INTERESTS = [
    "AI",
    "Agentic AI",
    "Workflow automation",
    "Practice management",
    "Accountant tools",
    "Advisory services",
    "Reporting",
    "Analytics",
    "Forecasting",
    "Compliance",
    "Digital tax",
    "eInvoicing",
    "Payments",
    "Cash flow",
    "Invoicing and jobs",
    "Bills and expenses",
    "Payroll HR",
    "Inventory",
    "Ecommerce",
    "Sustainability reporting"
];

/** Maps attendance day labels to ISO date strings */
export const DATE_MAP: Record<string, string> = {
    "Sept 3": "2026-09-03",
    "Sept 4": "2026-09-04",
};

/** All valid event dates */
export const ALL_EVENT_DATES = ["2026-09-03", "2026-09-04"];

/** Maps job types to related interest tags for scoring affinity */
export const JOB_TYPE_TAG_AFFINITY: Record<string, string[]> = {
    "Accountant": ["Compliance", "Digital tax", "Practice management", "Tax", "Reporting"],
    "Bookkeeper": ["Compliance", "Digital tax", "Practice management", "Bills and expenses", "Payroll HR"],
    "Firm Owner": ["Advisory services", "Growth", "Practice management", "Analytics", "Forecasting"],
    "Progressive Advisor": ["AI", "Agentic AI", "Advisory services", "Workflow automation", "Analytics"],
    "Growth-oriented Professional": ["AI", "Agentic AI", "Advisory services", "Growth", "Workflow automation"],
};

/** Networking slot times per event day */
export const NETWORKING_TIMES: Record<string, { start: string; end: string }> = {
    "2026-09-03": { start: "17:15", end: "18:00" },
    "2026-09-04": { start: "15:45", end: "16:30" },
};

/** Lunch slot options tried in order of preference */
export const LUNCH_SLOT_OPTIONS = [
    { start: "12:30", end: "13:30" },
    { start: "11:30", end: "12:30" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
];

/** End-of-day cutoff time for sessions */
export const END_OF_DAY_CUTOFF = "18:00";
