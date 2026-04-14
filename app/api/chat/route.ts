/**
 * app/api/chat/route.ts
 * 
 * Main API route for the AI Chatbot functionality.
 * This file handles user messages, injects the system prompt and context,
 * and defines the custom tools (searchSessions, getExhibitors, createSchedule)
 * that the LLM can use to fetch event data.
 */

import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import type { UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { shuffle, hasMatchingTag, scoreSession } from '@/lib/matching';
import { DATE_MAP, ALL_EVENT_DATES, NETWORKING_TIMES, LUNCH_SLOT_OPTIONS, END_OF_DAY_CUTOFF } from '@/lib/constants';
import type { Session, Exhibitor } from '@/lib/types';

/** Session with a computed relevance score appended */
type ScoredSession = Session & { _score: number };

/** A slot in the daily schedule — either a real Session or a fixed block (lunch/networking) */
interface ScheduleSlot {
    type?: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
    stage?: string;
    stageNumber?: string;
    presenters?: string[];
    shortDescription?: string;
    description?: string;
    track?: string;
    location?: string;
}

/** Raw message shape from the request body before conversion */
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content?: string; parts?: { type: string; text?: string }[] };

export const runtime = 'nodejs';

// Pre-load data
const sessionsPath = path.join(process.cwd(), 'data/Scheduler_2026_consolidated_sessions.json');
const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf8')).sessions as Session[];

const exhibitorsPath = path.join(process.cwd(), 'data/Scheduler_2026_exhibitors.json');
const exhibitorsData = JSON.parse(fs.readFileSync(exhibitorsPath, 'utf8')).exhibitors as Exhibitor[];

/** Shuffle items that have equal _score values while preserving score-based ordering */
function shuffleEqualScores<T extends { _score: number }>(items: T[]): T[] {
    if (items.length <= 1) return items;
    const result: T[] = [];
    let i = 0;
    while (i < items.length) {
        let j = i;
        while (j < items.length && items[j]._score === items[i]._score) j++;
        result.push(...shuffle(items.slice(i, j)));
        i = j;
    }
    return result;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages = body.messages;

        const headerProfile = req.headers.get('x-user-profile') || req.headers.get('X-User-Profile');

        let rawUserProfile = body.userProfile;

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
                        // UserProfile extracted from [INIT_CHAT] payload
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

        const validMessages = (messages as ChatMessage[]).map((msg) => {
            if (msg.role === 'user' && msg.content && !msg.parts) {
                return { ...msg, parts: [{ type: 'text', text: msg.content }] };
            }
            return msg;
        });

        const coreMessages = await convertToModelMessages(validMessages as Omit<UIMessage, 'id'>[]);
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

        const maxSessions = parseInt(process.env.MAX_SESSIONS_PER_DAY || "3", 10);
        const maxExhibitors = parseInt(process.env.MAX_EXHIBITORS_PER_DAY || "3", 10);

        // Pre-build keynote reference with full detail so the LLM can rephrase naturally.
        // Built from pre-loaded sessionsData — identical for every user, maximises cache prefix.
        const keynotes = sessionsData
            .filter((s) => s.track === "Supercharge")
            .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
            .map((s) => {
                const startTime = s.startDateTime.substring(11, 16);
                const endTime = s.endDateTime.substring(11, 16);
                const date = s.startDateTime.substring(0, 10);
                return [
                    `**${s.title}**`,
                    `Time: ${startTime} – ${endTime}, ${date} | Stage: Supercharge Stage`,
                    `Speaker: ${s.presenters?.join(", ") || "TBA"}`,
                    `Description: ${s.description || s.shortDescription || ""}`,
                ].join('\n');
            })
            .join('\n\n');

        /**
         * Static system prompt prefix — identical for every user and every request.
         * OpenAI caches the longest byte-identical prefix at a 50% input token discount.
         * All content that does not vary by user profile belongs here.
         */
        const staticPrompt = `${systemPrompt}

# KEYNOTE SESSIONS (Supercharge Track)
These are the Day 1 main stage keynotes. ALL attendees should attend. You have full details below — answer keynote questions directly without calling a tool. Rephrase the descriptions in your own words, in plain conversational language:

${keynotes}

# TOOL USAGE
- **Keynotes / Supercharge**: Answer from above. Only call searchSessions with track="Supercharge" if user wants something not covered above.
- **Session recommendations**: USE searchSessions. Max ${maxSessions} non-clashing sessions per day.
- **Exhibitors / Event Partners / Sponsors**: USE getExhibitors. Max ${maxExhibitors} per day. ("Partner & Community" is a session track — use searchSessions for those.)
- **Presenters / Speakers**: USE getPresenters. Only pass all=true if explicitly asked for ALL.
- **Personalized schedule**: USE createSchedule.

# SCHEDULE OVERRIDE
When outputting schedule data from createSchedule, output ONLY a JSON code block — no conversational text inside:
\`\`\`json
{
  "type": "schedule_download",
  "data": { ...exact JSON from createSchedule... }
}
\`\`\``;

        /**
         * Dynamic system prompt suffix — appended after the static prefix.
         * Contains only per-user data (profile). Placed last so cache prefix is maximised.
         */
        const dynamicPrompt = `
User Profile:
Name: ${safeName}
Role: ${safeRole}
Attendance Days: ${safeAttendanceDays.join(', ')}
Interests: ${safeInterests.join(', ')}
Location: ${safeLocation}`;

        const result = await streamText({
            model: openai(process.env.OPENAI_MODEL || 'gpt-5.1'),
            system: staticPrompt + '\n\n' + dynamicPrompt,
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
                    execute: async ({ track, tags, date, presenter }: {
                        track?: string;
                        tags?: string[];
                        date?: string;
                        presenter?: string;
                    }) => {
                        let filtered: Session[] = sessionsData;

                        // Determine allowed dates based on LLM query or User Profile
                        const allowedDates: string[] = [];
                        if (date) {
                            // Check if date matches any known date mapping or ISO format
                            for (const [label, iso] of Object.entries(DATE_MAP)) {
                                if (date.includes(label) || date.includes(iso)) {
                                    allowedDates.push(iso);
                                }
                            }
                            // Fallback: try matching day number
                            if (allowedDates.length === 0) {
                                if (date.includes("3") || date.includes("03")) allowedDates.push("2026-09-03");
                                if (date.includes("4") || date.includes("04")) allowedDates.push("2026-09-04");
                            }
                        } else {
                            const attendingDays = userProfile?.attendanceDays || [];
                            for (const day of attendingDays) {
                                const iso = DATE_MAP[day];
                                if (iso) allowedDates.push(iso);
                            }
                        }

                        // Default to all event days if nothing matched
                        if (allowedDates.length === 0) {
                            allowedDates.push(...ALL_EVENT_DATES);
                        }

                        // Filter by date
                        filtered = filtered.filter((s) => allowedDates.includes(s.startDateTime.substring(0, 10)));

                        if (track) {
                            filtered = filtered.filter((s) => s.track?.toLowerCase().includes(track.toLowerCase()));
                        }
                        if (presenter) {
                            filtered = filtered.filter((s) =>
                                s.presenters?.some((p) => p.toLowerCase().includes(presenter.toLowerCase()))
                            );
                        }
                        if (tags && tags.length > 0) {
                            filtered = filtered.filter((s) =>
                                hasMatchingTag(s.tags || [], tags)
                            );
                        }

                        // Group by day, score by relevance, select top non-clashing
                        const sessionsByDay: Record<string, ScoredSession[]> = {};
                        for (const s of filtered) {
                            const day = s.startDateTime.substring(0, 10);
                            if (!sessionsByDay[day]) sessionsByDay[day] = [];
                            sessionsByDay[day].push({ ...s, _score: scoreSession(s, userProfile) });
                        }

                        const finalSessions: ScoredSession[] = [];
                        for (const day in sessionsByDay) {
                            // Sort by relevance score (descending), then by time for tie-breaking
                            const daySessions = sessionsByDay[day]
                                .sort((a, b) => {
                                    if (b._score !== a._score) return b._score - a._score;
                                    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
                                });
                            const selectedForDay: ScoredSession[] = [];
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
                            track: s.track || "",
                            stage: s.stage || "",
                            stageNumber: s.stageNumber || "",
                            date: `${s.startDateTime.substring(0, 10)}, ${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
                            shortSummary: s.shortDescription || "",
                            description: s.description || "",
                            presenters: s.presenters?.join(", ") || "N/A",
                            tags: s.tags || []
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
                    execute: async ({ name, tags }: { name?: string; tags?: string[]; date?: string }) => {
                        let filtered: Exhibitor[] = exhibitorsData;
                        if (name) {
                            filtered = filtered.filter((e) => e.name?.toLowerCase().includes(name.toLowerCase()));
                        }
                        if (tags && tags.length > 0) {
                            filtered = filtered.filter((e) =>
                                hasMatchingTag(e.tags || [], tags)
                            );
                        }

                        // Score and rank exhibitors by relevance (tag matches + region)
                        const userLocation = userProfile?.location;
                        const scoredExhibitors = filtered.map((e) => {
                            let score = 0;
                            const userInterests = (userProfile?.interests || []) as string[];
                            if (userInterests.length > 0) {
                                score += (e.tags || []).filter((tag) =>
                                    userInterests.some((i) => {
                                        const t = tag.toLowerCase().trim();
                                        const interest = i.toLowerCase().trim();
                                        if (t === interest) return true;
                                        const escaped = interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        return new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i').test(tag);
                                    })
                                ).length * 3;
                            }
                            if (userLocation && e.regions?.some((r) => r.toLowerCase() === userLocation.toLowerCase())) {
                                score += 2;
                            }
                            return { ...e, _score: score };
                        }).sort((a, b) => b._score - a._score);

                        const daysCount = Math.max(1, userProfile.attendanceDays?.length || 1);
                        return scoredExhibitors.slice(0, maxExhibitors * daysCount).map((e) => ({
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
                    execute: async ({ name, all }: { name?: string; all?: boolean }) => {
                        if (name) {
                            // Find sessions presented by this person
                            const presenterSessions = sessionsData.filter((s) =>
                                s.presenters?.some((p) => p.toLowerCase().includes(name.toLowerCase()))
                            );

                            return presenterSessions.map((s) => ({
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
                            for (const day of attendingDays) {
                                const iso = DATE_MAP[day];
                                if (iso) allowedDates.push(iso);
                            }
                            if (allowedDates.length === 0) allowedDates.push(...ALL_EVENT_DATES);

                            const userInterests = userProfile?.interests || [];

                            // Filter sessions by dates and interests if 'all' is not explicitly true
                            let filtered: Session[] = sessionsData;
                            if (!all) {
                                filtered = filtered.filter((s) => allowedDates.includes(s.startDateTime.substring(0, 10)));
                                if (userInterests.length > 0) {
                                    filtered = filtered.filter((s) =>
                                        hasMatchingTag(s.tags || [], userInterests)
                                    );
                                }
                            }

                            // List all unique presenters from the filtered sessions
                            const allPresenters = new Set<string>();
                            filtered.forEach((s) => {
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
                    execute: async () => {
                        const attendingDays = userProfile?.attendanceDays || [];
                        const validDates: string[] = [];
                        for (const day of attendingDays) {
                            const iso = DATE_MAP[day];
                            if (iso) validDates.push(iso);
                        }
                        if (validDates.length === 0) validDates.push(...ALL_EVENT_DATES);

                        const userInterests = userProfile?.interests || [];
                        const sessionsByDay: Record<string, Session[]> = {};
                        validDates.forEach(d => sessionsByDay[d] = []);

                        sessionsData.forEach((s) => {
                            const d = s.startDateTime.substring(0, 10);
                            if (sessionsByDay[d]) {
                                sessionsByDay[d].push(s);
                            }
                        });

                        const schedule: Record<string, { sessions: { time: string; title: string; stage: string; presenters: string; summary: string }[]; exhibitors: string[] }> = {};

                        validDates.forEach(day => {
                            const daySessions = sessionsByDay[day].filter(s => {
                                const time = s.endDateTime.substring(11, 16);
                                return time <= END_OF_DAY_CUTOFF;
                            });

                            const mandatory = daySessions.filter(s => s.track === "Supercharge");
                            // Score and sort non-mandatory sessions by relevance
                            const nonMandatory = daySessions
                                .filter(s => s.track !== "Supercharge")
                                .map(s => ({ ...s, _score: scoreSession(s, userProfile) }))
                                .sort((a, b) => {
                                    if (b._score !== a._score) return b._score - a._score;
                                    return 0; // equal scores get shuffled below
                                });
                            // Shuffle sessions with equal scores for variety
                            const mix = shuffleEqualScores(nonMandatory);

                            const daySchedule: ScheduleSlot[] = [];

                            const fixedNetworking: ScheduleSlot[] = [];
                            const netTime = NETWORKING_TIMES[day];
                            if (netTime) {
                                fixedNetworking.push({
                                    type: "Fixed", title: "Networking", startDateTime: `${day}T${netTime.start}:00`, endDateTime: `${day}T${netTime.end}:00`, stage: "Networking Area", stageNumber: "N/A", presenters: [], shortDescription: "End of day networking."
                                });
                            }

                            const isOverlap = (start1: number, end1: number, start2: number, end2: number) => {
                                return Math.max(start1, start2) < Math.min(end1, end2);
                            };

                            const tryAddSession = (s: ScheduleSlot, _ignoreGap = false) => {
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

                            const lunchSlots = LUNCH_SLOT_OPTIONS.map(opt => ({
                                start: `${day}T${opt.start}:00`,
                                end: `${day}T${opt.end}:00`
                            }));

                            for (const slot of lunchSlots) {
                                const lunchSession = {
                                    type: "Fixed", title: "Lunch Break", startDateTime: slot.start, endDateTime: slot.end, stage: "Dining Area", stageNumber: "N/A", presenters: [], shortDescription: "1-Hour Lunch Break."
                                };
                                if (tryAddSession(lunchSession, true)) break;
                            }

                            mix.forEach(m => tryAddSession(m));
                            daySchedule.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

                            // Score and rank exhibitors by relevance
                            let dayExhibitors: Exhibitor[] = exhibitorsData;
                            if (userInterests.length > 0) {
                                const matchedExhs = dayExhibitors.filter((e) => hasMatchingTag(e.tags || [], userInterests));
                                const unmatchedExhs = dayExhibitors.filter((e) => !matchedExhs.includes(e));
                                dayExhibitors = [...shuffle(matchedExhs), ...shuffle(unmatchedExhs)];
                            } else {
                                dayExhibitors = shuffle(dayExhibitors);
                            }

                            schedule[day] = {
                                sessions: daySchedule.map((s) => {
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
                                exhibitors: dayExhibitors.slice(0, 8).map((e) => e.name)
                            };
                        });

                        return schedule;
                    }
                }),
            },
            stopWhen: stepCountIs(5)
        });

        return result.toUIMessageStreamResponse();
    } catch (error: unknown) {
        console.error("API /chat error:", error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: 'The AI assistant is temporarily unavailable. Please try again in a moment.',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
