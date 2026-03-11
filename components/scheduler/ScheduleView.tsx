/**
 * ScheduleView.tsx
 *
 * In-app schedule display component rendered inside the main view after
 * the client-side scheduler generates a personalized itinerary. Displays
 * sessions organized by day in a tabbed layout with print support.
 *
 * Each session card is color-coded by type: keynotes get a primary gradient,
 * breaks/lunch/networking are muted, and regular sessions use a subtle glass effect.
 */

"use client"

import { Schedule, ScheduleItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleViewProps {
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
        <Card className="w-full max-w-4xl mx-auto shadow-2xl border-border bg-card/60 backdrop-blur-xl text-card-foreground overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-background/50 backdrop-blur-md p-6">
                <div>
                    <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight">Your Itinerary</CardTitle>
                    <CardDescription className="text-muted-foreground text-lg font-sans">Your customized AI Twin schedule.</CardDescription>
                </div>
                <Button
                    onClick={handlePrint}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-6 py-6 rounded-xl transition-all hover:scale-105 font-sans"
                >
                    <Download className="mr-2 h-5 w-5" /> Print Itinerary
                </Button>
            </CardHeader>
            <CardContent className="p-6 bg-transparent min-h-[500px]">
                <Tabs defaultValue={schedule.days[0]?.date} className="w-full">
                    <TabsList className="mb-8 w-full justify-start bg-transparent border-b border-border p-0 h-auto rounded-none">
                        {schedule.days.map((day, index) => (
                            <TabsTrigger
                                key={day.date}
                                value={day.date}
                                className="px-8 py-3 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-lg font-medium text-muted-foreground transition-all font-sans"
                            >
                                Day {index + 1} ({day.date.split('-').slice(1).join('/')})
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {schedule.days.map(day => (
                        <TabsContent key={day.date} value={day.date} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center space-x-3 text-2xl font-bold mb-6 text-foreground font-serif">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Calendar className="h-6 w-6 text-primary" />
                                </div>
                                <span>{formatDate(day.date)}</span>
                            </div>

                            <div className="space-y-4">
                                {day.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex flex-col md:flex-row p-5 rounded-xl border transition-all hover:translate-x-1 duration-200",
                                            item.type === 'keynote'
                                                ? "bg-gradient-to-r from-primary/20 to-transparent border-primary/50"
                                                : item.type === 'break' || item.type === 'lunch' || item.type === 'networking'
                                                    ? "bg-muted/30 border-border opacity-80"
                                                    : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="md:w-40 flex-shrink-0 flex items-center mb-3 md:mb-0 text-foreground font-mono text-lg tracking-wide bg-background/50 py-1 px-3 rounded-lg self-start border border-white/10">
                                            <Clock className="h-4 w-4 mr-2 text-primary" />
                                            {formatTime(item.session.startDateTime)}
                                        </div>

                                        <div className="flex-1 md:pl-6 border-l border-white/10 md:ml-2">
                                            <h4 className="font-bold text-xl text-foreground font-serif mb-2 leading-tight">{item.session.title}</h4>

                                            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-3 font-sans">
                                                <span className="flex items-center bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-chart-2" />
                                                    {item.session.stage || "Main Stage"}
                                                </span>
                                                {item.session.track && (
                                                    <span className="bg-primary/20 text-blue-200 px-2.5 py-1 rounded-md border border-primary/30 font-medium">
                                                        {item.session.track}
                                                    </span>
                                                )}
                                            </div>

                                            {item.session.tags && item.session.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 font-sans">
                                                    {item.session.tags.slice(0, 3).map(t => (
                                                        <span key={t} className="bg-primary/10 px-2.5 py-0.5 rounded-full text-xs text-primary border border-primary/20">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
