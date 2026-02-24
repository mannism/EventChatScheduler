/**
 * app/api/chat/route.ts
 * 
 * Main API route for the AI Chatbot functionality.
 * This file handles user messages, injects the system prompt and context,
 * and defines the custom tools (searchSessions, getExhibitors, createSchedule)
 * that the LLM can use to fetch event data.
 */

import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Pre-load data
const sessionsPath = path.join(process.cwd(), 'data/Scheduler_2026_consolidated_sessions.json');
const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf8')).sessions;

const exhibitorsPath = path.join(process.cwd(), 'data/Scheduler_2026_exhibitors.json');
const exhibitorsData = JSON.parse(fs.readFileSync(exhibitorsPath, 'utf8')).exhibitors;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages = body.messages;

        const headerProfile = req.headers.get('x-user-profile') || req.headers.get('X-User-Profile');
        console.log("Header Profile:", headerProfile);

        let rawUserProfile = body.userProfile;
        console.log("Body UserProfile:", body.userProfile);

        if (!rawUserProfile && headerProfile) {
            try {
                rawUserProfile = JSON.parse(decodeURIComponent(headerProfile));
            } catch (e) {
                console.error("Failed to parse X-User-Profile header:", e);
            }
        }

        // Final fallback: check the first message for an embedded JSON payload
        if (!rawUserProfile && messages && messages.length > 0) {
            const firstMsgContent = messages[0].content;
            if (typeof firstMsgContent === 'string' && firstMsgContent.startsWith('[INIT_CHAT] {')) {
                try {
                    const payloadStr = firstMsgContent.replace('[INIT_CHAT] ', '').trim();
                    const payload = JSON.parse(payloadStr);
                    if (payload.type === 'init' && payload.profile) {
                        rawUserProfile = payload.profile;
                        console.log("Extracted UserProfile from [INIT_CHAT] payload");
                    }
                } catch (e) {
                    console.error("Failed to parse [INIT_CHAT] payload:", e);
                }
            }
        }

        // Ensure userProfile is at least an object with default properties to prevent TypeErrors
        const userProfile = rawUserProfile || {};
        const safeName = userProfile.name || "Guest";
        const safeRole = userProfile.role || userProfile.jobType || "Attendee";
        const safeLocation = userProfile.location || "Unknown";
        const safeAttendanceDays = userProfile.attendanceDays || [];
        const safeInterests = userProfile.interests || [];

        const promptPath = path.join(process.cwd(), 'data/Scheduler_System_Prompt.txt');
        const systemPrompt = fs.readFileSync(promptPath, 'utf8');

        const validMessages = messages.map((msg: any) => {
            if (msg.role === 'user' && msg.content && !msg.parts) {
                return { ...msg, parts: [{ type: 'text', text: msg.content }] };
            }
            return msg;
        });

        const coreMessages = await convertToModelMessages(validMessages);
        const lastMessage = coreMessages[coreMessages.length - 1];

        let isInit = false;
        if (lastMessage && lastMessage.content) {
            // content can be string or array of parts
            if (typeof lastMessage.content === 'string') {
                isInit = lastMessage.content.startsWith('[INIT_CHAT]');
            } else if (Array.isArray(lastMessage.content) && lastMessage.content[0]?.type === 'text') {
                isInit = lastMessage.content[0].text.startsWith('[INIT_CHAT]');
            }
        }

        let processMessages = coreMessages;
        if (isInit) {
            processMessages = [
                ...coreMessages.slice(0, -1),
                { role: 'user', content: `System Directive: This is the start of the conversation. Please greet the user by name (${safeName}), express excitement to have them join the event, and ask if they want to know more about the event or if they would like a personalized schedule.` }
            ];
        }

        const context = `
    User Profile:
    Name: ${safeName}
    Role: ${safeRole}
    Attendance Days: ${safeAttendanceDays.join(', ')}
    Interests: ${safeInterests.join(', ')}
    Location: ${safeLocation}
    `;
        console.log("User Profile:", userProfile);

        const maxSessions = parseInt(process.env.MAX_SESSIONS_PER_DAY || "3", 10);
        const maxExhibitors = parseInt(process.env.MAX_EXHIBITORS_PER_DAY || "3", 10);

        const instructions = `
    Use the provided system prompt behavior.
    Context:
    ${context}
    
    # CRITICAL INSTRUCTIONS
    1. Keep responses human, natural and easy to read.
    2. If the user asks about the keynote, keynote session, Keynotes, Keynote Sessions or supercharged session - including speakers and topics, 
      - USE the searchSessions tool with track="Supercharge" to find keynote sessions
      - Use the returned data to respond accordingly.
      - If the presenter data is empty or "N/A", tell the user "I do not have that data in my records currently."
    3. If the user asks about sessions they should go to, USE the searchSessions tool to recommend sessions matching their interests and location. Recommend exactly a maximum of ${maxSessions} relevant sessions for each day the user is attending with session timings that do not clash.
    4. If the user asks about "Exhibitors", "Exhibitor", "Event Partners", "Sponsors" or "exhibiting partner", USE the getExhibitors tool. Recommend exactly a maximum of ${maxExhibitors} relevant Exhibitors for each day the user is attending. (NOTE: If they ask about "Partner & Community" sessions, use the searchSessions tool instead).
    5. If the user asks about presenters, speakers, or session details from a specific presenter's name, USE the getPresenters tool. Only use the "all" parameter if the user explicitly asks for ALL presenters. Otherwise, getPresenters will automatically filter by their attendance days and interests.
    6. If the user asks for a personalized schedule, USE the createSchedule tool to generate one.
    7. When displaying dates, display in this format: "Sep 9"
    8. When displaying times, display in this format: "10:00 AM"
    9. If the user speaks in a different language, respond in the same language. 
    10. ALWAYS RESPOND in HUMAN, NATURAL and EASY TO READ format. Rephrase, and summarise where possible.
    11. When responding with session details, ALWAYS ensure that the response includes the session title, stage, stage number and time.
    12. DO NOT GUESS. If you are not sure about something, ask the user for clarification.
    13. DO NOT SPEAK ABOUT POLITICS, RELIGION, OR ANY CONTROVERSIAL TOPICS.
    14. DO NOT use Markdown headers (such as # or ##). You MAY use markdown formatting for bold (**), italics (* or _), and bulleted lists. 
    15. CRITICAL OVERRIDE FOR SCHEDULES: Ignore the "human-readable/summarize" rule when the user asks for a schedule! If you are displaying the schedule from the createSchedule tool, you MUST output ONLY a JSON code block containing the exact schedule data. DO NOT summarise, DO NOT add conversational filler inside the JSON. Format it exactly like this:
\`\`\`json
{
  "type": "schedule_download",
  "data": { ...exact JSON from createSchedule... }
}
\`\`\`
    `;

        const result = await streamText({
            model: openai(process.env.OPENAI_MODEL || 'gpt-5.1'),
            system: systemPrompt + '\n\n' + instructions,
            messages: processMessages,
            tools: {
                /**
                 * TOOL: searchSessions
                 * Allows the LLM to search for specific sessions by track, tags, or date.
                 */
                searchSessions: tool({
                    description: 'Search for event sessions. Use this to find keynotes (Supercharge track) or sessions matching specific tags/interests/presenters.',
                    inputSchema: z.object({
                        track: z.string().optional().describe('The track of the session. e.g. "Supercharge" for keynotes, "App Spotlight", "Discovery" or "Partner & Community".'),
                        tags: z.array(z.string()).optional().describe('Topics or interests to filter by.'),
                        date: z.string().optional().describe('Specific date to filter sessions for, e.g. "2026-09-03" or "Sept 3".'),
                        presenter: z.string().optional().describe('Filter sessions by a specific presenter name.'),
                    }),
                    // @ts-ignore
                    execute: async (args: any) => {
                        const { track, tags, date, presenter } = args;
                        let filtered = sessionsData;

                        // Determine allowed dates based on LLM query or User Profile
                        const allowedDates: string[] = [];
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
                        filtered = filtered.filter((s: any) => allowedDates.includes(s.startDateTime.substring(0, 10)));

                        if (track) {
                            filtered = filtered.filter((s: any) => s.track?.toLowerCase().includes(track.toLowerCase()));
                        }
                        if (presenter) {
                            filtered = filtered.filter((s: any) =>
                                s.presenters?.some((p: string) => p.toLowerCase().includes(presenter.toLowerCase()))
                            );
                        }
                        if (tags && tags.length > 0) {
                            filtered = filtered.filter((s: any) =>
                                s.tags?.some((tag: string) => tags.some((t: string) => tag.toLowerCase().includes(t.toLowerCase())))
                            );
                        }

                        // Group by day and select max 5 non-clashing
                        const sessionsByDay: Record<string, any[]> = {};
                        for (const s of filtered) {
                            const day = s.startDateTime.substring(0, 10);
                            if (!sessionsByDay[day]) sessionsByDay[day] = [];
                            sessionsByDay[day].push(s);
                        }

                        const finalSessions: any[] = [];
                        for (const day in sessionsByDay) {
                            const daySessions = sessionsByDay[day].sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
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
                            shortSummary: s.shortDescription || s.description || "",
                            presenters: s.presenters?.join(", ") || "N/A"
                        }));
                    },
                }),
                /**
                 * TOOL: getExhibitors
                 * Allows the LLM to look up specific event partners or exhibitors using tags or name.
                 */
                getExhibitors: tool({
                    description: 'Look up exhibitors or event partners at the event.',
                    inputSchema: z.object({
                        name: z.string().optional().describe('Name of the exhibitor to search for.'),
                        tags: z.array(z.string()).optional().describe('Topics or services to filter by.'),
                        date: z.string().optional().describe('Specific date to filter exhibitors by, e.g. "2026-09-03" or "Sept 3".'),
                    }),
                    // @ts-ignore
                    execute: async (args: any) => {
                        const { name, tags } = args;
                        let filtered = exhibitorsData;
                        if (name) {
                            filtered = filtered.filter((e: any) => e.name?.toLowerCase().includes(name.toLowerCase()));
                        }
                        if (tags && tags.length > 0) {
                            filtered = filtered.filter((e: any) =>
                                e.tags?.some((tag: string) => tags.some((t: string) => tag.toLowerCase().includes(t.toLowerCase())))
                            );
                        }
                        const daysCount = Math.max(1, userProfile.attendanceDays?.length || 1);
                        return filtered.slice(0, maxExhibitors * daysCount).map((e: any) => ({
                            name: e.name,
                            description: e.shortDescription || e.description || "",
                            tags: e.tags
                        }));
                    },
                }),
                /**
                 * TOOL: getPresenters
                 * Allows the LLM to look up presenters at the event and see what sessions they are presenting.
                 */
                getPresenters: tool({
                    description: 'Look up presenters at the event. Can be used to list presenters or find sessions for a specific presenter.',
                    inputSchema: z.object({
                        name: z.string().optional().describe('Name of the presenter to search for.'),
                        all: z.boolean().optional().describe('If true, returns an exhaustive list of all presenters regardless of user interests. ONLY use if explicitly requested.')
                    }),
                    // @ts-ignore
                    execute: async (args: any) => {
                        const { name, all } = args;

                        if (name) {
                            // Find sessions presented by this person
                            const presenterSessions = sessionsData.filter((s: any) =>
                                s.presenters?.some((p: string) => p.toLowerCase().includes(name.toLowerCase()))
                            );

                            return presenterSessions.map((s: any) => ({
                                sessionTitle: s.title,
                                date: `${s.startDateTime.substring(0, 10)}, ${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
                                stage: s.stage || "TBA",
                                summary: s.shortDescription || s.description || "",
                                allPresenters: s.presenters?.join(", ") || "N/A"
                            }));
                        } else {
                            // Determine allowed dates based on User Profile
                            const allowedDates: string[] = [];
                            const attendingDays = userProfile?.attendanceDays || [];
                            if (attendingDays.includes("Sept 3")) allowedDates.push("2026-09-03");
                            if (attendingDays.includes("Sept 4")) allowedDates.push("2026-09-04");
                            if (allowedDates.length === 0) allowedDates.push("2026-09-03", "2026-09-04");

                            const userInterests = userProfile?.interests || [];

                            // Filter sessions by dates and interests if 'all' is not explicitly true
                            let filtered = sessionsData;
                            if (!all) {
                                filtered = filtered.filter((s: any) => allowedDates.includes(s.startDateTime.substring(0, 10)));
                                if (userInterests.length > 0) {
                                    filtered = filtered.filter((s: any) =>
                                        s.tags?.some((tag: string) => userInterests.some((ui: string) => tag.toLowerCase().includes(ui.toLowerCase())))
                                    );
                                }
                            }

                            // List all unique presenters from the filtered sessions
                            const allPresenters = new Set<string>();
                            filtered.forEach((s: any) => {
                                if (s.presenters) {
                                    s.presenters.forEach((p: string) => {
                                        if (p) allPresenters.add(p);
                                    });
                                }
                            });
                            return Array.from(allPresenters).sort();
                        }
                    },
                }),
                /**
                 * TOOL: createSchedule
                 * Automatically builds a dense, conflict-free, personalized schedule.
                 * Includes fixed networking/lunch events, mandatory keynotes, and backfill sessions based on interests.
                 */
                createSchedule: tool({
                    description: 'Generates a personalized 2-day event schedule for the user based on their attendance days and interests.',
                    inputSchema: z.object({}),
                    // @ts-ignore
                    execute: async () => {
                        const attendingDays = userProfile?.attendanceDays || [];
                        const validDates: string[] = [];
                        if (attendingDays.includes("Sept 3")) validDates.push("2026-09-03");
                        if (attendingDays.includes("Sept 4")) validDates.push("2026-09-04");
                        if (validDates.length === 0) validDates.push("2026-09-03", "2026-09-04");

                        const userInterests = userProfile?.interests || [];
                        const sessionsByDay: Record<string, any[]> = {};
                        validDates.forEach(d => sessionsByDay[d] = []);

                        sessionsData.forEach((s: any) => {
                            const d = s.startDateTime.substring(0, 10);
                            if (sessionsByDay[d]) {
                                sessionsByDay[d].push(s);
                            }
                        });

                        const schedule: any = {};

                        validDates.forEach(day => {
                            const daySessions = sessionsByDay[day].filter(s => {
                                const time = s.endDateTime.substring(11, 16);
                                return time <= "18:00";
                            });

                            const mandatory = daySessions.filter(s => s.track === "Supercharge");
                            const interested = daySessions.filter(s =>
                                s.track !== "Supercharge" &&
                                s.tags &&
                                s.tags.some((tag: string) => userInterests.some((i: string) => tag.toLowerCase().includes(i.toLowerCase())))
                            );
                            const others = daySessions.filter(s => s.track !== "Supercharge" && !interested.includes(s));
                            const mix = [...interested, ...others].sort(() => 0.5 - Math.random());

                            const daySchedule: any[] = [];

                            const fixedNetworking: any[] = [];
                            if (day === "2026-09-03") {
                                fixedNetworking.push({
                                    type: "Fixed", title: "Networking", startDateTime: `${day}T17:15:00`, endDateTime: `${day}T18:00:00`, stage: "Networking Area", stageNumber: "N/A", presenters: [], shortDescription: "End of day networking."
                                });
                            } else if (day === "2026-09-04") {
                                fixedNetworking.push({
                                    type: "Fixed", title: "Networking", startDateTime: `${day}T15:45:00`, endDateTime: `${day}T16:30:00`, stage: "Networking Area", stageNumber: "N/A", presenters: [], shortDescription: "End of day networking."
                                });
                            }

                            const isOverlap = (start1: number, end1: number, start2: number, end2: number) => {
                                return Math.max(start1, start2) < Math.min(end1, end2);
                            };

                            const tryAddSession = (s: any, ignoreGap = false) => {
                                const sStart = new Date(s.startDateTime).getTime();
                                const sEnd = new Date(s.endDateTime).getTime();

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
                                    const gap = 0; // Removed 5 minute mandatory spacing to allow back-to-back sessions

                                    if (sStart < eEnd + gap && eStart < sEnd + gap) return false;
                                }

                                daySchedule.push(s);
                                return true;
                            }

                            fixedNetworking.forEach(n => tryAddSession(n, true));
                            mandatory.forEach(m => tryAddSession(m));

                            let lunchSlots = [
                                { start: `${day}T11:30:00`, end: `${day}T12:30:00` },
                                { start: `${day}T12:00:00`, end: `${day}T13:00:00` },
                                { start: `${day}T12:30:00`, end: `${day}T13:30:00` },
                                { start: `${day}T13:00:00`, end: `${day}T14:00:00` }
                            ].sort(() => 0.5 - Math.random());

                            for (const slot of lunchSlots) {
                                const lunchSession = {
                                    type: "Fixed", title: "Lunch Break", startDateTime: slot.start, endDateTime: slot.end, stage: "Dining Area", stageNumber: "N/A", presenters: [], shortDescription: "1-Hour Lunch Break."
                                };
                                if (tryAddSession(lunchSession, true)) break;
                            }

                            mix.forEach(m => tryAddSession(m));
                            daySchedule.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

                            let dayExhibitors = exhibitorsData;
                            if (userInterests.length > 0) {
                                const matchedExhs = dayExhibitors.filter((e: any) => e.tags && e.tags.some((tag: string) => userInterests.some((i: string) => tag.toLowerCase().includes(i.toLowerCase()))));
                                const unmatchedExhs = dayExhibitors.filter((e: any) => !matchedExhs.includes(e));
                                dayExhibitors = [...matchedExhs.sort(() => 0.5 - Math.random()), ...unmatchedExhs.sort(() => 0.5 - Math.random())];
                            } else {
                                dayExhibitors = dayExhibitors.sort(() => 0.5 - Math.random());
                            }

                            schedule[day] = {
                                sessions: daySchedule.map((s: any) => {
                                    let finalStage = s.stage || s.location || "TBA";
                                    if (s.track !== "Supercharge" && s.stageNumber && s.stageNumber !== "N/A" && s.stageNumber !== "TBA") {
                                        finalStage = `${finalStage} / ${s.stageNumber}`;
                                    }
                                    return {
                                        time: `${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
                                        title: s.title,
                                        stage: finalStage,
                                        presenters: s.presenters?.join(", ") || "N/A",
                                        summary: s.shortDescription || s.description || ""
                                    };
                                }),
                                exhibitors: dayExhibitors.slice(0, 8).map((e: any) => e.name)
                            };
                        });

                        return schedule;
                    }
                }),
            },
            stopWhen: stepCountIs(5)
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("API /chat error:", error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
