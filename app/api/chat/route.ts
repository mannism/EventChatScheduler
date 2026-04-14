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
import { DATE_MAP, ALL_EVENT_DATES } from '@/lib/constants';
import type { Session, Exhibitor, UserProfile } from '@/lib/types';
import { generateSchedule } from '@/lib/scheduler';

/** Session with a computed relevance score appended */
type ScoredSession = Session & { _score: number };

/** Raw message shape from the request body before conversion */
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content?: string; parts?: { type: string; text?: string }[] };

/**
 * Zod schema for the /api/chat request body.
 * Validates the messages array shape and optional userProfile object.
 * Returns 400 with a safe error message on failure — never exposes internal details.
 */
const chatRequestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant']),
            // content and parts are both optional — the handler normalises both shapes
            content: z.string().optional(),
            parts: z.array(
                z.object({
                    type: z.string(),
                    text: z.string().optional(),
                })
            ).optional(),
        })
    ),
    // passthrough() preserves the full object without constraining individual fields —
    // the handler uses safe fallbacks for every property, so we don't over-constrain here.
    userProfile: z.object({}).passthrough().optional(),
});

export const runtime = 'nodejs';

// Pre-load data
const sessionsPath = path.join(process.cwd(), 'data/Scheduler_2026_consolidated_sessions.json');
const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf8')).sessions as Session[];

const exhibitorsPath = path.join(process.cwd(), 'data/Scheduler_2026_exhibitors.json');
const exhibitorsData = JSON.parse(fs.readFileSync(exhibitorsPath, 'utf8')).exhibitors as Exhibitor[];


export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.json();
        const parseResult = chatRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return new Response(JSON.stringify({
                error: 'Bad Request',
                message: 'Invalid request format.',
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const body = parseResult.data;
        const messages = body.messages;

        const headerProfile = req.headers.get('x-user-profile') || req.headers.get('X-User-Profile');

        let rawUserProfile: Record<string, unknown> | undefined = body.userProfile as Record<string, unknown> | undefined;

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

        // Normalise the raw (untyped) profile into typed safe values, then into a UserProfile.
        // userProfile is Record<string, unknown> from the parsed JSON — we never trust its field types.
        const userProfile: Record<string, unknown> = rawUserProfile ?? {};
        const safeName = (userProfile.name as string | undefined) || "Guest";
        const safeRole = (userProfile.role as string | undefined) || (userProfile.jobType as string | undefined) || "Attendee";
        const safeLocation = (userProfile.location as string | undefined) || "Unknown";
        const safeAttendanceDays = (userProfile.attendanceDays as string[] | undefined) || [];
        const safeInterests = (userProfile.interests as string[] | undefined) || [];

        /**
         * Typed UserProfile built from safe fallback values.
         * Used wherever strict UserProfile typing is required (scoreSession, generateSchedule).
         */
        const typedProfile: UserProfile = {
            name: safeName,
            jobType: safeRole,
            attendanceDays: safeAttendanceDays,
            interests: safeInterests,
            location: safeLocation,
        };

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
         * Compact JSON to minimise per-request token cost. Placed last so cache prefix is maximised.
         */
        const userContextJson = JSON.stringify({
            name: safeName,
            role: safeRole,
            days: safeAttendanceDays,
            interests: safeInterests,
            location: safeLocation,
            maxSessions,
            maxExhibitors,
        });
        const dynamicPrompt = `User context: ${userContextJson}`;

        const result = await streamText({
            model: openai(process.env.OPENAI_MODEL || 'gpt-5.4-mini'),
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
                        detail: z.boolean().optional().describe('When true, include full session descriptions. Default false — returns short summaries only.'),
                    }),
                    execute: async ({ track, tags, date, presenter, detail }: {
                        track?: string;
                        tags?: string[];
                        date?: string;
                        presenter?: string;
                        detail?: boolean;
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
                            for (const day of safeAttendanceDays) {
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
                            sessionsByDay[day].push({ ...s, _score: scoreSession(s, typedProfile) });
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
                        // Return full description only when detail=true — reduces token payload
                        // for list queries where the LLM just needs short summaries.
                        return finalSessions.map(s => ({
                            name: s.title,
                            track: s.track || "",
                            stage: s.stage || "",
                            stageNumber: s.stageNumber || "",
                            date: `${s.startDateTime.substring(0, 10)}, ${s.startDateTime.substring(11, 16)} - ${s.endDateTime.substring(11, 16)}`,
                            shortSummary: s.shortDescription || "",
                            ...(detail ? { description: s.description || "" } : {}),
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
                        const scoredExhibitors = filtered.map((e) => {
                            let score = 0;
                            if (safeInterests.length > 0) {
                                score += (e.tags || []).filter((tag) =>
                                    safeInterests.some((i) => {
                                        const t = tag.toLowerCase().trim();
                                        const interest = i.toLowerCase().trim();
                                        if (t === interest) return true;
                                        const escaped = interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        return new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i').test(tag);
                                    })
                                ).length * 3;
                            }
                            if (safeLocation && e.regions?.some((r) => r.toLowerCase() === safeLocation.toLowerCase())) {
                                score += 2;
                            }
                            return { ...e, _score: score };
                        }).sort((a, b) => b._score - a._score);

                        const daysCount = Math.max(1, safeAttendanceDays.length || 1);
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
                            for (const day of safeAttendanceDays) {
                                const iso = DATE_MAP[day];
                                if (iso) allowedDates.push(iso);
                            }
                            if (allowedDates.length === 0) allowedDates.push(...ALL_EVENT_DATES);

                            const userInterests = safeInterests;

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
                 * Delegates to generateSchedule() in lib/scheduler.ts — the single authoritative
                 * schedule-building algorithm with 5-minute gap buffering and conflict detection.
                 * This execute function adapts the Schedule output into the shape the LLM prompt
                 * expects: { [date]: { sessions: [...], exhibitors: [...] } }
                 */
                createSchedule: tool({
                    description: 'Generates a personalized 2-day event schedule for the user based on their attendance days and interests.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        // typedProfile is built at the top of the handler from safe fallback values.
                        // safeInterests (from outer closure) is used directly below — no local alias needed.
                        const { days } = await generateSchedule(typedProfile, sessionsData);

                        /**
                         * Adapter: transform DaySchedule[] → APISchedule
                         * lib/scheduler returns { days: DaySchedule[] } where each item has
                         * { session: Session, type: string }. The LLM prompt expects a flat
                         * object keyed by date with sessions mapped to { time, title, stage,
                         * presenters, summary } and exhibitor names.
                         */
                        const schedule: Record<string, { sessions: { time: string; title: string; stage: string; presenters: string; summary: string }[]; exhibitors: string[] }> = {};

                        for (const daySchedule of days) {
                            const { date, items } = daySchedule;

                            // Rank exhibitors by interest tag matches, then by region proximity.
                            // Matched exhibitors are shuffled separately from unmatched so interest
                            // relevance is preserved while adding variety within each tier.
                            let dayExhibitors: Exhibitor[] = exhibitorsData;
                            if (safeInterests.length > 0) {
                                const matchedExhs = dayExhibitors.filter((e) => hasMatchingTag(e.tags || [], safeInterests));
                                const unmatchedExhs = dayExhibitors.filter((e) => !matchedExhs.includes(e));
                                dayExhibitors = [...shuffle(matchedExhs), ...shuffle(unmatchedExhs)];
                            } else {
                                dayExhibitors = shuffle(dayExhibitors);
                            }

                            schedule[date] = {
                                sessions: items.map(({ session: s }) => {
                                    let finalStage = s.stage || "TBA";
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
                        }

                        return schedule;
                    }
                }),
            },
            stopWhen: stepCountIs(3)
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
