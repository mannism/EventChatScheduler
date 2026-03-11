/**
 * MainView.tsx
 *
 * Top-level phase controller that orchestrates the app's three main views:
 *   1. Onboarding — multi-step form to collect user profile
 *   2. Chat — AI conversation interface with tool-based session search
 *   3. Schedule — generated itinerary with print support
 *
 * Phase and profile state are persisted to localStorage so returning users
 * resume from the chat phase without re-onboarding.
 */

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

/** The three sequential phases of the application */
type Phase = 'onboarding' | 'chat' | 'schedule'

/** localStorage keys for persisting user state across page reloads */
const STORAGE_KEY_PROFILE = 'xyzcon_userProfile';
const STORAGE_KEY_PHASE = 'xyzcon_phase';

export function MainView({ sessions }: MainViewProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [phase, setPhase] = useState<Phase>('onboarding')
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [schedule, setSchedule] = useState<Schedule | null>(null)

    // Restore state from localStorage on mount
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
            const savedPhase = localStorage.getItem(STORAGE_KEY_PHASE) as Phase | null;
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                setUserProfile(profile);
                // Only restore to chat phase (not schedule, since that needs regeneration)
                if (savedPhase === 'chat') {
                    setPhase('chat');
                }
            }
        } catch {
            // Ignore localStorage errors
        }
        setIsMounted(true)
    }, [])

    // Persist state changes to localStorage
    useEffect(() => {
        if (!isMounted) return;
        try {
            if (userProfile) {
                localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
            }
            localStorage.setItem(STORAGE_KEY_PHASE, phase);
        } catch {
            // Ignore localStorage errors
        }
    }, [userProfile, phase, isMounted])

    const handleOnboardingSubmit = (profile: UserProfile) => {
        setUserProfile(profile)
        setPhase('chat')
    }

    const handleEditProfile = () => {
        setPhase('onboarding')
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
                    <OnboardingForm onSubmit={handleOnboardingSubmit} defaultValues={userProfile || undefined} />
                )}
                {phase === 'chat' && userProfile && (
                    <ChatInterface
                        userProfile={userProfile}
                        onGenerateSchedule={handleGenerateSchedule}
                        onEditProfile={handleEditProfile}
                    />
                )}
                {phase === 'schedule' && schedule && (
                    <ScheduleView schedule={schedule} />
                )}
            </div>
        </main>
    )
}
