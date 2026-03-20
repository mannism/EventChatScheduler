/**
 * ScheduleView.tsx
 *
 * In-app schedule display component rendered inside the main view after
 * the client-side scheduler generates a personalized itinerary. Displays
 * sessions organized by day in a tabbed layout with print support.
 *
 * Each session card is color-coded by type: keynotes get a cyan gradient,
 * breaks/lunch/networking are muted, and regular sessions use a subtle glass effect.
 *
 * Visual layer: glass-card surface, cyan accent, Framer Motion hover lift per row.
 */

"use client"

import { Schedule } from "@/lib/types"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleViewProps {
    /** The fully generated schedule produced by the scheduler */
    schedule: Schedule
}

export function ScheduleView({ schedule }: ScheduleViewProps) {

    const handlePrint = () => {
        window.print();
    }

    const formatDate = (dateStr: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    const formatTime = (dateTimeStr: string) => {
        return dateTimeStr.split('T')[1].substring(0, 5);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-4xl mx-auto"
        >
            <Card className="glass-card overflow-hidden rounded-2xl border-0">
                <CardHeader className="flex flex-row items-center justify-between border-b border-black/10 dark:border-slate-800/60 bg-white/60 dark:bg-background/40 backdrop-blur-md p-6">
                    <div>
                        <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight">Your Itinerary</CardTitle>
                        <CardDescription className="text-muted-foreground text-lg font-sans">Your customized AI Twin schedule.</CardDescription>
                    </div>
                    <Button
                        onClick={handlePrint}
                        aria-label="Print itinerary"
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 hover:scale-105 text-white shadow-lg px-6 py-6 rounded-xl transition-all font-sans border-0 focus-visible:ring-4 focus-visible:ring-cyan-500 min-h-[48px]"
                    >
                        <Download className="mr-2 h-5 w-5" /> Print Itinerary
                    </Button>
                </CardHeader>

                <CardContent className="p-6 bg-transparent min-h-[500px]">
                    <Tabs defaultValue={schedule.days[0]?.date} className="w-full">
                        <TabsList className="mb-8 w-full justify-start bg-transparent border-b border-black/10 dark:border-slate-800/60 p-0 h-auto rounded-none">
                            {schedule.days.map((day, index) => (
                                <TabsTrigger
                                    key={day.date}
                                    value={day.date}
                                    className="px-8 py-3 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-cyan-600 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:bg-cyan-400/10 dark:data-[state=active]:text-cyan-400 text-lg font-medium text-muted-foreground transition-all font-sans focus-visible:ring-4 focus-visible:ring-cyan-500"
                                >
                                    Day {index + 1} ({day.date.split('-').slice(1).join('/')})
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {schedule.days.map(day => (
                            <TabsContent key={day.date} value={day.date} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center space-x-3 text-2xl font-bold mb-6 text-foreground font-serif">
                                    <div className="p-2 bg-cyan-100 dark:bg-cyan-400/10 rounded-lg">
                                        <Calendar className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                                    </div>
                                    <span>{formatDate(day.date)}</span>
                                </div>

                                <div className="space-y-4">
                                    {day.items.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.01, x: 4 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className={cn(
                                                "flex flex-col md:flex-row p-5 rounded-xl border transition-colors duration-200",
                                                item.type === 'keynote'
                                                    ? "bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-400/30 dark:from-cyan-500/15 dark:border-cyan-400/40"
                                                    : item.type === 'break' || item.type === 'lunch' || item.type === 'networking'
                                                        ? "bg-black/[0.03] dark:bg-muted/20 border-black/10 dark:border-border/50 opacity-75"
                                                        : "bg-white/60 dark:bg-slate-900/30 border-black/10 dark:border-slate-700/40 hover:border-cyan-500/30 dark:hover:border-cyan-400/30 hover:bg-white/80 dark:hover:bg-slate-900/50"
                                            )}
                                        >
                                            <div className="md:w-40 flex-shrink-0 flex items-center mb-3 md:mb-0 text-foreground font-mono text-lg tracking-wide bg-black/[0.04] dark:bg-background/40 py-1 px-3 rounded-lg self-start border border-black/10 dark:border-white/10">
                                                <Clock className="h-4 w-4 mr-2 text-cyan-700 dark:text-cyan-400" />
                                                {formatTime(item.session.startDateTime)}
                                            </div>

                                            <div className="flex-1 md:pl-6 border-l border-black/10 dark:border-white/10 md:ml-2">
                                                <h4 className="font-bold text-xl text-foreground font-serif mb-2 leading-tight">{item.session.title}</h4>

                                                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-3 font-sans">
                                                    <span className="flex items-center bg-black/[0.04] dark:bg-white/5 px-2 py-1 rounded-md border border-black/10 dark:border-white/10">
                                                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-chart-2" />
                                                        {item.session.stage || "Main Stage"}
                                                    </span>
                                                    {item.session.track && (
                                                        <span className="bg-cyan-50 text-cyan-700 border-cyan-600/25 dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/25 px-2.5 py-1 rounded-md border font-medium">
                                                            {item.session.track}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.session.tags && item.session.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 font-sans">
                                                        {item.session.tags.slice(0, 3).map(t => (
                                                            <span key={t} className="bg-cyan-50 text-cyan-700 border-cyan-600/20 dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/20 px-2.5 py-0.5 rounded-full text-xs border">
                                                                #{t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    )
}
