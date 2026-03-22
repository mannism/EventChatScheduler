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
 *
 * Visual layer:
 * - Hero section (visible only during onboarding) fades in with Framer Motion
 * - Phase transitions use AnimatePresence for smooth fade + slide
 *
 * Hydration note:
 * AnimatePresence uses useId() internally. To prevent SSR/client ID mismatches
 * (which break shadcn FormItem's aria attributes), AnimatePresence is only
 * rendered after mount (isMounted). During SSR and initial hydration, phase
 * panels render as plain divs so both trees are identical.
 */

"use client"

import { useState, useEffect, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

/** Framer Motion variants shared across phase panels */
const phaseVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' as const } },
}

export function MainView({ sessions }: MainViewProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [phase, setPhase] = useState<Phase>('onboarding')
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [schedule, setSchedule] = useState<Schedule | null>(null)

    // Restore state from localStorage on mount
    useEffect(() => {
        startTransition(() => {
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
            setIsMounted(true);
        });
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

    const heroContent = phase === 'onboarding' && (
        <div className="text-center mb-8 md:mb-10 w-full max-w-2xl mx-auto">
            <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-[0.2em] mb-3">
                XyzCon 2026
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                AI Conference Assistant (Demo)
            </h1>
        </div>
    )

    const phasePanel = (
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
    )

    // After hydration: wrap with AnimatePresence for transitions.
    // AnimatePresence uses useId() internally — rendering it only post-mount
    // ensures server and client produce identical trees during hydration,
    // preventing aria ID mismatches in shadcn FormItem.
    if (isMounted) {
        return (
            <main className="min-h-[calc(100vh-64px)] bg-transparent text-foreground flex flex-col items-center justify-start py-4 md:py-10 px-4">
                <AnimatePresence>
                    {phase === 'onboarding' && (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
                            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                            className="text-center mb-8 md:mb-10 w-full max-w-2xl mx-auto"
                        >
                            <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-[0.2em] mb-3">
                                XyzCon 2026
                            </p>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                                AI Conference Assistant (Demo)
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="w-full">
                    <AnimatePresence mode="wait">
                        {phase === 'onboarding' && (
                            <motion.div key="onboarding" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
                                <OnboardingForm onSubmit={handleOnboardingSubmit} defaultValues={userProfile || undefined} />
                            </motion.div>
                        )}
                        {phase === 'chat' && userProfile && (
                            <motion.div key="chat" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
                                <ChatInterface
                                    userProfile={userProfile}
                                    onGenerateSchedule={handleGenerateSchedule}
                                    onEditProfile={handleEditProfile}
                                />
                            </motion.div>
                        )}
                        {phase === 'schedule' && schedule && (
                            <motion.div key="schedule" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
                                <ScheduleView schedule={schedule} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        )
    }

    // SSR / hydration pass — plain structure with no AnimatePresence so the
    // component tree is identical on server and client, avoiding useId() drift.
    return (
        <main className="min-h-[calc(100vh-64px)] bg-transparent text-foreground flex flex-col items-center justify-start py-4 md:py-10 px-4">
            {heroContent}
            {phasePanel}
        </main>
    )
}
