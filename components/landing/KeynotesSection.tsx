/**
 * components/landing/KeynotesSection.tsx
 *
 * Displays the keynote (Supercharge track) sessions in a two-column card grid.
 * Each card shows the formatted time range, session title, and first presenter.
 * Time formatting is done client-side using the user's locale.
 */

import { Session } from "@/lib/types"

interface KeynotesSectionProps {
  keynotes: Session[]
}

/** Format a single ISO datetime to 12-hour time, e.g. "9:20 AM" */
function formatTime(isoTime: string): string {
  const date = new Date(isoTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/**
 * Format the keynote time range with date label.
 * Output: "9:20 AM – 9:30 AM, Sep 3"
 */
function formatKeynoteTime(session: Session): string {
  const start = formatTime(session.startDateTime)
  const end = formatTime(session.endDateTime)
  const day = session.startDateTime.substring(8, 10).replace(/^0/, '')
  return `${start} – ${end}, Sep ${day}`
}

export function KeynotesSection({ keynotes }: KeynotesSectionProps) {
  return (
    <section className="mb-20">
      <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
        Keynote Speakers
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {keynotes.map(session => (
          <article
            key={session.id}
            className="glass-card rounded-xl p-6 relative"
          >
            {/* Top accent gradient line */}
            <div className="h-0.5 bg-gradient-to-r from-cyan-600 to-transparent mb-4" aria-hidden="true" />

            {/* Keynote badge */}
            <span className="absolute top-4 right-4 text-xs font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-wider bg-cyan-400/10 px-2 py-0.5 rounded-full">
              Keynote
            </span>

            {/* Time */}
            <p className="text-xs font-mono text-muted-foreground mb-2">
              {formatKeynoteTime(session)}
            </p>

            {/* Title */}
            <h3 className="font-serif font-bold text-xl text-foreground mb-2 leading-snug pr-16">
              {session.title}
            </h3>

            {/* Speaker */}
            <p className="text-muted-foreground text-sm">
              {session.presenters?.[0] ?? 'TBA'}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
