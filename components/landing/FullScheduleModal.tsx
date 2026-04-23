"use client"

/**
 * components/landing/FullScheduleModal.tsx
 *
 * Full program modal — splits all sessions into Day 1 (Sep 3) and Day 2 (Sep 4),
 * sorted chronologically. Renders a scrollable table per day inside shadcn Tabs.
 * Track badges use per-track color tokens for quick visual scanning.
 */

import { useMemo } from "react"
import { Session } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

interface FullScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: Session[]
}

/** Per-track badge color classes — background + text */
const TRACK_COLORS: Record<string, string> = {
  'Supercharge': 'bg-cyan-400/15 text-cyan-700 dark:text-cyan-300',
  'Discovery': 'bg-violet-400/15 text-violet-700 dark:text-violet-300',
  'App Spotlight': 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300',
  'Partner & Community': 'bg-amber-400/15 text-amber-700 dark:text-amber-300',
}

/** Fallback badge style for tracks not in the map */
const TRACK_DEFAULT = 'bg-slate-400/15 text-slate-600 dark:text-slate-300'

/** Format ISO datetime to 12-hour time, e.g. "9:20 AM" */
function formatSessionTime(isoTime: string): string {
  const date = new Date(isoTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

interface SessionTableProps {
  sessions: Session[]
}

/** Reusable table body — renders one day's sessions */
function SessionTable({ sessions }: SessionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium whitespace-nowrap">Time</th>
            <th className="py-3 pr-4 font-medium">Track</th>
            <th className="py-3 pr-4 font-medium hidden sm:table-cell">Stage</th>
            <th className="py-3 pr-4 font-medium">Session</th>
            <th className="py-3 font-medium hidden md:table-cell">Speakers</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, index) => {
            const isKeynote = session.track === 'Supercharge'
            const trackColor = TRACK_COLORS[session.track] ?? TRACK_DEFAULT
            const rowBg = index % 2 === 0
              ? ''
              : 'bg-white/[0.02] dark:bg-slate-900/20'

            return (
              <tr
                key={session.id}
                className={`border-b border-border/40 last:border-0 ${rowBg} ${
                  isKeynote ? 'border-l-2 border-l-cyan-400' : ''
                }`}
              >
                {/* Time */}
                <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground font-mono text-xs align-top">
                  {formatSessionTime(session.startDateTime)}
                </td>

                {/* Track badge */}
                <td className="py-3 pr-4 align-top">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${trackColor}`}>
                    {session.track}
                  </span>
                </td>

                {/* Stage — hidden on mobile */}
                <td className="py-3 pr-4 text-muted-foreground text-xs align-top hidden sm:table-cell whitespace-nowrap">
                  {session.stage}
                </td>

                {/* Session title */}
                <td className="py-3 pr-4 text-foreground align-top">
                  {session.title}
                </td>

                {/* Speakers — hidden on tablet and below */}
                <td className="py-3 text-muted-foreground text-xs align-top hidden md:table-cell">
                  {session.presenters?.join(', ') || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function FullScheduleModal({ open, onOpenChange, sessions }: FullScheduleModalProps) {
  // Split sessions into day 1 and day 2 by date prefix, sorted chronologically
  const { day1, day2 } = useMemo(() => {
    const sorted = [...sessions].sort((a, b) =>
      a.startDateTime.localeCompare(b.startDateTime)
    )
    return {
      day1: sorted.filter(s => s.startDateTime.startsWith('2026-09-03')),
      day2: sorted.filter(s => s.startDateTime.startsWith('2026-09-04')),
    }
  }, [sessions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-0 gap-0"
      >
        {/* Modal header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-serif font-bold">
            Full Conference Program
          </DialogTitle>
          <DialogDescription>
            XYZCon 2026 · Sep 3–4 · Excel Center, Melbourne
          </DialogDescription>
        </DialogHeader>

        {/* Day tabs — fill remaining modal height */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="day1" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 pt-4 shrink-0">
              <TabsList>
                <TabsTrigger value="day1">
                  Day 1 · Sep 3
                </TabsTrigger>
                <TabsTrigger value="day2">
                  Day 2 · Sep 4
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="day1" className="overflow-y-auto px-6 py-4 flex-1">
              <SessionTable sessions={day1} />
            </TabsContent>

            <TabsContent value="day2" className="overflow-y-auto px-6 py-4 flex-1">
              <SessionTable sessions={day2} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
