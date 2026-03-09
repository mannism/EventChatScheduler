"use client"

import { useChat } from '@ai-sdk/react'
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

interface ChatInterfaceProps {
    userProfile: UserProfile
    onGenerateSchedule: () => void
}

export function ChatInterface({ userProfile, onGenerateSchedule }: ChatInterfaceProps) {
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

    // Derived state
    const isLoading = originalIsLoading || status === 'streaming' || status === 'submitted';

    // Action handler
    const doSendMessage = async (userMessage: any) => {
        if (append) {
            await append(userMessage, { body: { userProfile } });
        } else if (sendMessage) {
            await sendMessage(userMessage); // Assuming sendMessage takes the message object
        } else {
            console.error('No send method found (append/sendMessage missing)');
        }
    }

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
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollBy({ top: 120, behavior: 'smooth' })
                }
            }, 150)
        }
    }, [messages])

    // Helper to extract text from message
    const getMessageText = (m: any) => {
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.parts)) {
            return m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
        }
        return '';
    }

    const displayMessages = messages.filter((m: any) => {
        const text = getMessageText(m);
        if (!text.trim()) return false;
        return !text.includes('[GENERATE_SCHEDULE]') && !text.includes('[INIT_CHAT]');
    });

    return (
        <Card className="w-full max-w-2xl mx-auto h-[85vh] md:h-[80vh] mt-2 md:mt-0 flex flex-col shadow-2xl border-border bg-card/60 backdrop-blur-xl text-card-foreground overflow-hidden relative">
            {/* Geometric Header Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <CardHeader className="border-b border-border bg-background/50 backdrop-blur-md z-10 px-4 py-3">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                            <span className="font-serif font-bold text-lg">AI</span>
                        </div>
                        <div>
                            <h2 className="font-sans font-medium text-base text-foreground">AI Event Scheduler</h2>
                            <p className="text-xs text-muted-foreground font-normal">Ask me about the the event or the sessions at XyzCon 2026</p>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-transparent">
                <div className="h-full overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 opacity-80">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-border">
                                <Send className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-serif font-bold text-xl text-foreground">How can I help you today?</h3>
                            <p className="text-muted-foreground text-sm max-w-[280px]">
                                Ask about my experience, projects, or background.
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full mt-8">
                                {[
                                    "Tell me about your projects",
                                    "What is your background?",
                                    "Creative Tech topics",
                                    "Agentic workflows"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            if (!isLoading) {
                                                const msg = { role: 'user', content: suggestion };
                                                doSendMessage(msg);
                                            }
                                        }}
                                        className="text-sm bg-card/40 backdrop-blur-sm hover:bg-primary/20 border border-border hover:border-primary/50 text-left p-3 rounded-lg transition-colors font-sans"
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
                                        ? "bg-primary/40 text-white rounded-[16px] rounded-br-sm"
                                        : "bg-white/10 border border-white/20 backdrop-blur-md text-foreground rounded-[16px] rounded-bl-sm"
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
                                                        <div className="my-4 p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                                                                <div className="my-4 p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                                    <p className="text-sm text-muted-foreground">Generating schedule document...</p>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                }
                                                if (content.includes('"schedule_download"')) {
                                                    return (
                                                        <div className="my-4 p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-[16px] rounded-bl-sm p-3 flex gap-1 items-center w-fit">
                                <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }} />
                                <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }} />
                                <div className="w-[6px] h-[6px] bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 bg-background/50 backdrop-blur-md border-t border-border z-10 w-full">
                <form onSubmit={handleSubmit} className="flex w-full gap-2 relative bg-white/10 p-2 border border-white/20 rounded-xl backdrop-blur-sm">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-foreground placeholder:text-muted-foreground/70"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="h-10 w-10 rounded-full bg-primary/60 hover:bg-primary/80 text-white shadow-lg transition-all hover:scale-105 shrink-0 border border-white/20"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
