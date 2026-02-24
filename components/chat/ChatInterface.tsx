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

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
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
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col shadow-2xl border-border bg-card text-card-foreground overflow-hidden relative">
            {/* Geometric Header Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-xyz-blue/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <CardHeader className="border-b border-border bg-navy-blue/50 backdrop-blur-sm z-10">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-xyz-blue to-xui-blue flex items-center justify-center">
                            <span className="font-outfit font-bold text-white text-lg">X</span>
                        </div>
                        <div>
                            <h2 className="font-outfit font-bold text-xl text-white tracking-tight">XyzCon Assistant</h2>
                            <p className="text-xs text-muted-foreground font-normal">Personalized for {userProfile.name}</p>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-navy-blue/30">
                <div className="h-full overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 opacity-80">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Send className="h-8 w-8 text-xyz-blue" />
                            </div>
                            <h3 className="font-outfit font-bold text-2xl text-white">How can I help you today?</h3>
                            <p className="text-muted-foreground max-w-md">
                                Ask about sessions, speakers, networking events, or get recommendation for your schedule.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-8">
                                {[
                                    "Show me keynotes",
                                    "What's happening on Sept 3?",
                                    "Workshops for accountants",
                                    "Networking events"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            if (!isLoading) {
                                                const msg = { role: 'user', content: suggestion };
                                                doSendMessage(msg);
                                            }
                                        }}
                                        className="text-sm bg-card hover:bg-xyz-blue/20 border border-border hover:border-xyz-blue text-left p-3 rounded-lg transition-colors"
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
                                    "max-w-[85%] rounded-2xl p-4 shadow-sm relative",
                                    m.role === 'user'
                                        ? "bg-xyz-blue text-white rounded-br-sm"
                                        : "bg-card border border-border text-card-foreground rounded-bl-sm"
                                )}
                            >
                                <div className="markdown-prose text-[15px] leading-relaxed break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p({ children }: any) {
                                                const text = String(children);
                                                if (text.includes('"schedule_download"')) {
                                                    return (
                                                        <div className="my-4 p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-xyz-blue"></div>
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
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-xyz-blue"></div>
                                                                    <p className="text-sm text-muted-foreground">Generating schedule document...</p>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                }
                                                if (content.includes('"schedule_download"')) {
                                                    return (
                                                        <div className="my-4 p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-xyz-blue"></div>
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
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-card border border-border rounded-2xl rounded-bl-sm p-4 flex gap-1 items-center">
                                <div className="w-2 h-2 bg-xyz-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-xyz-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-xyz-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 bg-navy-blue/80 backdrop-blur-md border-t border-border z-10">
                <form onSubmit={handleSubmit} className="flex w-full gap-3 relative">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 bg-input/50 border-input focus:ring-xyz-blue focus:border-xyz-blue py-6 px-4 text-base rounded-xl"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="h-[52px] w-[52px] rounded-xl bg-xyz-blue hover:bg-xui-blue text-white shadow-lg transition-all hover:scale-105 shrink-0"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
