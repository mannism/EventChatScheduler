/**
 * ChatInterface.tsx
 *
 * Main conversational UI powered by the Vercel AI SDK's useChat hook.
 * Handles the full chat lifecycle:
 *   - Initialization: sends [INIT_CHAT] with user profile to trigger AI greeting
 *   - Message rendering: filters system directives, renders markdown with GFM support
 *   - Schedule interception: detects "schedule_download" JSON blocks in AI responses
 *     and renders ViewScheduleButton instead of raw JSON
 *   - Auto-scroll: single scroll manager (user message → snap to bottom,
 *     new assistant content → scroll only if within 150px of bottom)
 *   - Loading states: bouncing dots while waiting, contextual tool-call labels during
 *     tool execution (searchSessions, getExhibitors, getPresenters, createSchedule)
 *
 * Visual layer: glass-card surface, cyan accent throughout.
 */

"use client"

import React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai'
import type { UIMessage, TextUIPart } from 'ai'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Send } from 'lucide-react'
import { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ViewScheduleButton } from './ViewScheduleButton'

/** Maps LLM tool names to user-facing progress labels shown during tool execution */
const TOOL_LABELS: Record<string, string> = {
    searchSessions: 'Searching sessions...',
    getExhibitors: 'Looking up exhibitors...',
    getPresenters: 'Finding speakers...',
    createSchedule: 'Building your schedule...',
}

interface ChatInterfaceProps {
    /** The authenticated user's profile used to personalise AI responses */
    userProfile: UserProfile
    /** Called when the AI triggers a schedule generation */
    onGenerateSchedule: () => void
    /** Called when the user wants to edit their profile */
    onEditProfile?: () => void
}

export function ChatInterface({ userProfile, onGenerateSchedule, onEditProfile }: ChatInterfaceProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const hasInitialized = useRef(false)
    const [input, setInput] = useState('')
    // Track user message count to detect new user messages for scroll snapping
    const lastUserMsgCount = useRef(0)

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onFinish: ({ message }) => {
            const text = message.parts
                .filter((p): p is TextUIPart => p.type === 'text')
                .map((p) => p.text)
                .join('');
            if (text.includes('[GENERATE_SCHEDULE]')) {
                onGenerateSchedule();
            }
        },
    });

    // Helper to extract text content from a message's parts array
    const getMessageText = (m: UIMessage): string => {
        return m.parts
            .filter((p): p is TextUIPart => p.type === 'text')
            .map((p) => p.text)
            .join('');
    }

    // Derived loading state from status
    const isLoading = status === 'streaming' || status === 'submitted';
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    const isStreamingWithContent = isLoading && lastAssistantMsg && getMessageText(lastAssistantMsg).length > 0;
    const isWaitingForResponse = isLoading && !isStreamingWithContent;

    /**
     * Detect active tool invocations in the last assistant message.
     * Returns the first active tool's user-friendly label, or null if none.
     *
     * The Vercel AI SDK surfaces tool calls as UIMessageParts with type 'tool-{name}'
     * (static tools) or 'dynamic-tool' (dynamic tools). isToolUIPart() guards both.
     * We check for state 'input-streaming' or 'input-available' — the tool call has
     * been dispatched but has not yet returned a result.
     */
    const activeToolLabel: string | null = (() => {
        if (!isLoading || !lastAssistantMsg) return null;
        for (const part of lastAssistantMsg.parts) {
            if (
                isToolUIPart(part) &&
                (part.state === 'input-streaming' || part.state === 'input-available')
            ) {
                const name = getToolName(part);
                return TOOL_LABELS[name] ?? `Running ${name}...`;
            }
        }
        return null;
    })();

    // Send a text message via the useChat sendMessage method
    const doSendMessage = async (text: string) => {
        await sendMessage({ text }, { body: { userProfile } });
    }

    // On first render, send [INIT_CHAT] with profile to trigger the AI greeting.
    // The 50ms delay ensures the useChat hook is fully mounted before sending.
    useEffect(() => {
        if (!hasInitialized.current && messages.length === 0) {
            hasInitialized.current = true;
            setTimeout(() => {
                const initPayload = JSON.stringify({
                    type: "init",
                    profile: userProfile
                });
                doSendMessage(`[INIT_CHAT] ${initPayload}`);
            }, 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, userProfile]);

    useEffect(() => {
        if (!isLoading && inputRef.current) {
            // Adding a small timeout ensures the input isn't disabled when focus happens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const text = input;
        setInput('')

        await doSendMessage(text);
    }

    /**
     * Single scroll manager — replaces three separate useEffect scroll hooks that
     * were fighting each other (user snap, assistant nudge, loading scroll).
     *
     * Rules:
     *   - New user message → snap to bottom immediately so the user's own bubble is visible
     *   - New assistant content → scroll only if the user is within 150px of the bottom.
     *     If they've scrolled up to read history, we leave them alone.
     */
    useEffect(() => {
        const userMessages = messages.filter((m) => m.role === 'user');
        const isNewUserMessage = userMessages.length > lastUserMsgCount.current;

        if (isNewUserMessage) {
            // Snap to bottom on user send — 50ms delay lets React paint the new bubble first
            lastUserMsgCount.current = userMessages.length;
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 50);
        } else {
            // New assistant content — only scroll if user is near the bottom (within 150px)
            if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                if (distanceFromBottom < 150) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        }
    }, [messages]);

    // Filter out system directives ([INIT_CHAT], [GENERATE_SCHEDULE]) from user-visible messages
    const displayMessages = messages.filter((m) => {
        const text = getMessageText(m);
        if (!text.trim()) return false;
        return !text.includes('[GENERATE_SCHEDULE]') && !text.includes('[INIT_CHAT]');
    });

    return (
        <div className="w-full max-w-2xl mx-auto mt-2 md:mt-0">
            <Card className="glass-card w-full h-[85vh] md:h-[80vh] flex flex-col overflow-hidden relative rounded-2xl border-0">
                {/* Subtle geometric decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl -z-10 pointer-events-none" />

                <CardHeader className="border-b border-black/10 dark:border-slate-800/60 bg-white/60 dark:bg-background/40 backdrop-blur-md z-10 px-4 py-3">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-400/10 flex items-center justify-center border border-cyan-600/30 dark:border-cyan-400/30 text-cyan-700 dark:text-cyan-400 shrink-0">
                                <span className="font-serif font-bold text-lg">AI</span>
                            </div>
                            <div>
                                <h2 className="font-sans font-medium text-base text-foreground">AI Conference Assistant (demo)</h2>
                                <p className="text-xs text-muted-foreground font-normal">Ask me about the event or the sessions at XyzCon 2026</p>
                            </div>
                        </div>
                        {onEditProfile && (
                            <Button
                                variant="ghost"
                                onClick={onEditProfile}
                                className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-cyan-500"
                            >
                                Restart
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative bg-transparent">
                    <div className="h-full overflow-y-auto p-4 pb-6 space-y-6" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 opacity-80">
                                <div className="w-20 h-20 rounded-full bg-cyan-100 dark:bg-cyan-400/10 flex items-center justify-center mb-4 border border-black/10 dark:border-slate-700">
                                    <Send className="h-8 w-8 text-cyan-700 dark:text-cyan-400" />
                                </div>
                                <h3 className="font-serif font-bold text-xl text-foreground">How can I help you today?</h3>
                                <p className="text-muted-foreground text-sm max-w-[280px]">
                                    Ask about sessions, exhibitors, or get a personalized schedule.
                                </p>
                                <div className="grid grid-cols-1 gap-2 w-full mt-8">
                                    {[
                                        "Create my personalized schedule",
                                        "What keynotes are happening?",
                                        "Which exhibitors should I visit?",
                                        "Find sessions about AI"
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                if (!isLoading) {
                                                    doSendMessage(suggestion);
                                                }
                                            }}
                                            className="text-sm bg-black/[0.04] hover:bg-cyan-500/10 border border-black/10 hover:border-cyan-500/30 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-cyan-500/10 dark:hover:border-cyan-400/40 text-left p-3 rounded-lg transition-all duration-200 font-sans focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500 min-h-[48px]"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {displayMessages.map((m: UIMessage, i: number) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div
                                    className={cn(
                                        "max-w-[85%] p-3 shadow-sm relative text-[0.95em]",
                                        m.role === 'user'
                                            ? "bg-cyan-100 border border-cyan-300/60 text-slate-900 dark:bg-cyan-500/30 dark:border-cyan-400/20 dark:text-foreground rounded-[16px] rounded-br-sm"
                                            : "bg-white/80 border border-black/10 backdrop-blur-md text-slate-900 dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-foreground rounded-[16px] rounded-bl-sm"
                                    )}
                                >
                                    <div className="markdown-prose leading-relaxed break-word font-sans">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p({ children }: { children?: React.ReactNode }) {
                                                    const text = String(children);
                                                    if (text.includes('"schedule_download"')) {
                                                        return (
                                                            <div className="my-4 p-5 rounded-2xl border border-black/10 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                                                <p className="text-sm text-muted-foreground">Formatting schedule...</p>
                                                            </div>
                                                        );
                                                    }
                                                    return <p className="mb-4 last:mb-0">{children}</p>;
                                                },
                                                code({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown }) {
                                                    const content = String(children).replace(/\n$/, '');

                                                    /**
                                                     * Single schedule_download detection path for code blocks.
                                                     *
                                                     * 1. Try to parse — if valid JSON with type === 'schedule_download', render the button.
                                                     * 2. Parse failed but content mentions schedule_download — streaming partial JSON,
                                                     *    show loading spinner until the block completes.
                                                     * 3. Otherwise render a normal <code> element.
                                                     *
                                                     * The <p> handler above is the separate streaming fallback for when the LLM
                                                     * emits schedule JSON outside a fenced code block during streaming.
                                                     */
                                                    try {
                                                        const parsed = JSON.parse(content);
                                                        if (parsed.type === 'schedule_download') {
                                                            return <ViewScheduleButton scheduleData={parsed.data} userProfile={userProfile} />;
                                                        }
                                                    } catch {
                                                        if (content.includes('"schedule_download"')) {
                                                            return (
                                                                <div className="my-4 p-5 rounded-2xl border border-black/10 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                                                    <p className="text-sm text-muted-foreground">Generating schedule document...</p>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                    return <code className={className} {...props}>{children}</code>;
                                                }
                                            }}
                                        >
                                            {getMessageText(m)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* State 1: Waiting for first response — bouncing dots */}
                        {isWaitingForResponse && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-white/80 border border-black/10 dark:bg-slate-900/50 dark:border-slate-700/50 backdrop-blur-md rounded-[16px] rounded-bl-sm p-3 flex gap-1 items-center w-fit">
                                    <div className="w-[6px] h-[6px] bg-cyan-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }} />
                                    <div className="w-[6px] h-[6px] bg-cyan-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }} />
                                    <div className="w-[6px] h-[6px] bg-cyan-600 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                </div>
                            </div>
                        )}

                        {/*
                         * State 2: Streaming with content (tool calls in progress or between tokens).
                         * Shows a contextual label when an active tool invocation is detected
                         * (e.g. "Searching sessions..."), falling back to "Thinking..." otherwise.
                         */}
                        {isStreamingWithContent && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 bg-cyan-600/70 dark:bg-cyan-400/60 rounded-full animate-pulse" />
                                    <span className="animate-pulse">
                                        {activeToolLabel ?? 'Thinking...'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-4 bg-white/60 dark:bg-background/40 backdrop-blur-md border-t border-black/10 dark:border-slate-800/60 z-10 w-full">
                    <form onSubmit={handleSubmit} className="flex w-full gap-2 relative bg-white/70 dark:bg-slate-900/40 p-2 border border-black/10 dark:border-slate-700/50 rounded-xl backdrop-blur-sm">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-foreground placeholder:text-muted-foreground/80"
                            disabled={isLoading}
                            aria-label="Chat message input"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            aria-label="Send message"
                            className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-cyan-700 to-blue-700 hover:brightness-110 hover:scale-105 text-white shadow-lg transition-all shrink-0 border-0 focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-cyan-600"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
