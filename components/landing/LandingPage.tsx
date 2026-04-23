"use client"

/**
 * components/landing/LandingPage.tsx
 *
 * Conference landing page root component. Owns the schedule modal open state
 * and orchestrates section layout with Framer Motion stagger entrance animations.
 * Sections: HeroSection → KeynotesSection → ExhibitorsTeaser.
 *
 * Respects prefers-reduced-motion — Framer Motion reads the media query
 * and sets initial/animate to identical values when motion is reduced.
 */

import { useState } from "react"
import { motion } from "framer-motion"
import { Session, Exhibitor } from "@/lib/types"
import { HeroSection } from "./HeroSection"
import { KeynotesSection } from "./KeynotesSection"
import { ExhibitorsTeaser } from "./ExhibitorsTeaser"
import { FullScheduleModal } from "./FullScheduleModal"

interface LandingPageProps {
  sessions: Session[]
  exhibitors: Exhibitor[]
  keynotes: Session[]
}

/** Ordered section list — index drives stagger delay */
const SECTIONS = ['hero', 'keynotes', 'exhibitors'] as const

export function LandingPage({ sessions, exhibitors, keynotes }: LandingPageProps) {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

  return (
    <main className="min-h-[calc(100vh-64px)] bg-transparent text-foreground">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-20">
        {/* Hero */}
        <motion.div
          key={SECTIONS[0]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 * 0.1, duration: 0.5, ease: 'easeOut' }}
        >
          <HeroSection
            onOpenSchedule={() => setScheduleModalOpen(true)}
            sessionCount={sessions.length}
            exhibitorCount={exhibitors.length}
          />
        </motion.div>

        {/* Keynotes */}
        <motion.div
          key={SECTIONS[1]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 * 0.1, duration: 0.5, ease: 'easeOut' }}
        >
          <KeynotesSection keynotes={keynotes} />
        </motion.div>

        {/* Exhibitors teaser */}
        <motion.div
          key={SECTIONS[2]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 * 0.1, duration: 0.5, ease: 'easeOut' }}
        >
          <ExhibitorsTeaser exhibitors={exhibitors} />
        </motion.div>
      </div>

      {/* Full schedule modal — rendered outside content flow */}
      <FullScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        sessions={sessions}
      />
    </main>
  )
}
