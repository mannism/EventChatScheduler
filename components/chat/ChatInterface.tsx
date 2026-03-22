/**
 * ChatInterface.tsx
 *
 * Main conversational UI powered by the Vercel AI SDK's useChat hook.
 * Handles the full chat lifecycle:
 *   - Initialization: sends [INIT_CHAT] with user profile to trigger AI greeting
 *   - Message rendering: filters system directives, renders markdown with GFM support
 *   - Schedule interception: detects "schedule_download" JSON blocks in AI responses
 *     and renders ViewScheduleButton instead of raw JSON
 *   - Auto-scroll: three-tier scrolling strategy (user message → snap to bottom,
 *     AI response → gentle 120px nudge, loading → keep indicator visible)
 *   - Loading states: bouncing dots while waiting, pulsing indicator during streaming
 *
 * Visual layer: glass-card surface, cyan accent throughout, Framer Motion hover lift.
 */

"use client"

import { useChat } from '@ai-sdk/react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Send } from 'lucide-react'
import { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ViewScheduleButton } from './ViewScheduleButton'

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
    const lastUserMsgCount = useRef(0)
    const lastAssistantMsgCount = useRef(0)

    // Cast result to any to handle type mismatch with installed SDK vs expected types
    const chat = useChat({
        api: '/api/chat',
        onFinish: (message: any) => {
            // Checking both structure possibilities
            const content = message.content || (message.parts ? message.parts.map((p: any) => p.text).join('') : '');

            if (content && content.includes('[GENERATE_SCHEDULE]')) {
                onGenerateSchedule()
            }
        },
    } as any) as any;

    // Polyfill or extract available methods based on inspection
    const { messages, append, sendMessage, status, isLoading: originalIsLoading } = chat;

    useEffect(() => {
        // Debugging the actual returned object
        // console.log('useChat keys:', Object.keys(chat));
    }, [chat]);

    // Helper to extract text — handles both string content and parts-based messages
    const getMessageText = (m: any) => {
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.parts)) {
            return m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
        }
        return '';
    }

    // Derived loading state — covers both legacy isLoading flag and newer status-based API
    const isLoading = originalIsLoading || status === 'streaming' || status === 'submitted';
    const lastAssistantMsg = [...messages].reverse().find((m: any) => m.role === 'assistant');
    const isStreamingWithContent = isLoading && lastAssistantMsg && getMessageText(lastAssistantMsg).length > 0;
    const isWaitingForResponse = isLoading && !isStreamingWithContent;

    // Universal send handler — tries append() first, falls back to sendMessage()
    const doSendMessage = async (userMessage: any) => {
        if (append) {
            await append(userMessage, { body: { userProfile } });
        } else if (sendMessage) {
            await sendMessage(userMessage);
        } else {
            console.error('No send method found (append/sendMessage missing)');
        }
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
                doSendMessage({ role: 'user', content: `[INIT_CHAT] ${initPayload}` });
            }, 50);
        }
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

        const userMessage = { role: 'user', content: input };
        setInput('')

        await doSendMessage(userMessage);
    }

    // Auto-scroll when the user sends a new message
    useEffect(() => {
        const userMessages = messages.filter((m: any) => m.role === 'user')
        if (userMessages.length > lastUserMsgCount.current) {
            lastUserMsgCount.current = userMessages.length
            // A small 50ms delay gives React enough time to paint the new user message
            // bubble into the DOM before we attempt to scroll down to it.
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }
            }, 50)
        }
    }, [messages])

    // Gentle nudge scroll when the AI response first appears
    useEffect(() => {
        const assistantMessages = messages.filter((m: any) => m.role === 'assistant')
        if (assistantMessages.length > lastAssistantMsgCount.current) {
            lastAssistantMsgCount.current = assistantMessages.length
            // Nudge the view down slightly (120px) to reveal the first few lines of the
            // AI's response to signal new content without violently jumping to the bottom.
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollBy({ top: 120, behavior: 'smooth' })
                }
            }, 150)
        }
    }, [messages])

    // Keep the loading indicator visible by scrolling to bottom while loading
    useEffect(() => {
        if (isLoading && scrollRef.current) {
            const timer = setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, messages])

    // Filter out system directives ([INIT_CHAT], [GENERATE_SCHEDULE]) from user-visible messages
    const displayMessages = messages.filter((m: any) => {
        const text = getMessageText(m);
        if (!text.trim()) return false;
        return !text.includes('[GENERATE_SCHEDULE]') && !text.includes('[INIT_CHAT]');
    });

    return (
        <motion.div
            whileHover={{ scale: 1.005, y: -2 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-2xl mx-auto mt-2 md:mt-0"
        >
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
                                <h2 className="font-sans font-medium text-base text-foreground">AI Conference Assistant</h2>
                                <p className="text-xs text-muted-foreground font-normal">Ask me about the the event or the sessions at XyzCon 2026</p>
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
                                                    const msg = { role: 'user', content: suggestion };
                                                    doSendMessage(msg);
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

                        {displayMessages.map((m: any, i: number) => (
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
                                                p({ children }: any) {
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
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const content = String(children).replace(/\n$/, '');

                                                    // If the LLM returns a JSON code block, check if it's the schedule output.
                                                    // If "type" equals "schedule_download", suppress the raw JSON text and render
                                                    // the custom ViewScheduleButton component instead, passing it the payload.
                                                    if (!inline && match && match[1] === 'json') {
                                                        try {
                                                            const parsed = JSON.parse(content);
                                                            if (parsed.type === 'schedule_download') {
                                                                return <ViewScheduleButton scheduleData={parsed.data} userProfile={userProfile} />;
                                                            }
                                                        } catch (e) {
                                                            if (content.includes('"schedule_download"')) {
                                                                return (
                                                                    <div className="my-4 p-5 rounded-2xl border border-black/10 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                                                        <p className="text-sm text-muted-foreground">Generating schedule document...</p>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                    }
                                                    if (content.includes('"schedule_download"')) {
                                                        return (
                                                            <div className="my-4 p-5 rounded-2xl border border-black/10 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                                                <p className="text-sm text-muted-foreground">Generating schedule document...</p>
                                                            </div>
                                                        );
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

                        {/* State 2: Streaming paused (e.g. tool calls) — subtle pulsing indicator */}
                        {isStreamingWithContent && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 bg-cyan-600/70 dark:bg-cyan-400/60 rounded-full animate-pulse" />
                                    <span className="animate-pulse">Thinking...</span>
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
                            className="h-10 w-10 min-w-[40px] min-h-[40px] rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 hover:brightness-110 hover:scale-105 text-white shadow-lg transition-all shrink-0 border-0 focus-visible:ring-4 focus-visible:ring-cyan-500"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
