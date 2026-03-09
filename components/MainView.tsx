"use client"

import { useState, useEffect } from "react"
import { UserProfile, Session, Schedule } from "@/lib/types"
import { OnboardingForm } from "@/components/onboarding/OnboardingForm"
import { ChatInterface } from "@/components/chat/ChatInterface"

import { generateSchedule } from "@/lib/scheduler"
import { ScheduleView } from "@/components/scheduler/ScheduleView"

interface MainViewProps {
    sessions: Session[]
}

type Phase = 'onboarding' | 'chat' | 'schedule'

export function MainView({ sessions }: MainViewProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [phase, setPhase] = useState<Phase>('onboarding')
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [schedule, setSchedule] = useState<Schedule | null>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleOnboardingSubmit = (profile: UserProfile) => {
        setUserProfile(profile)
        setPhase('chat')
    }

    const handleGenerateSchedule = async () => {
        if (!userProfile) return;
        const generated = await generateSchedule(userProfile, sessions);
        setSchedule(generated);
        setPhase('schedule');
    }

    return (
        <main className="min-h-[calc(100vh-70px)] bg-transparent text-foreground flex flex-col items-center justify-start py-4 md:py-12 px-4">
            <div className="w-full">
                {phase === 'onboarding' && (
                    <OnboardingForm onSubmit={handleOnboardingSubmit} />
                )}
                {phase === 'chat' && userProfile && (
                    <ChatInterface
                        userProfile={userProfile}
                        onGenerateSchedule={handleGenerateSchedule}
                    />
                )}
                {phase === 'schedule' && schedule && (
                    <ScheduleView schedule={schedule} />
                )}
            </div>
        </main>
    )
}
