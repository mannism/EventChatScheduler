/**
 * components/landing/HeroSection.tsx
 *
 * Landing page hero — event title, tagline, location pill, CTA row, and
 * stats chips. Primary CTA links to /assistant; secondary opens the full
 * schedule modal via the onOpenSchedule callback.
 */

import Link from "next/link"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onOpenSchedule: () => void
  sessionCount: number
  exhibitorCount: number
}

export function HeroSection({ onOpenSchedule, sessionCount, exhibitorCount }: HeroSectionProps) {
  return (
    <section className="text-center py-16 md:py-24">
      {/* Eyebrow — date and location in monospace */}
      <p className="text-xs font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-[0.2em] mb-4">
        Sept 3–4, 2026 | Melbourne
      </p>

      {/* Event title */}
      <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight mb-4">
        XYZCon 2026
      </h1>

      {/* Tagline */}
      <p className="text-xl md:text-2xl text-muted-foreground mb-8">
        Your business supercharged.
      </p>

      {/* Location pill */}
      <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-10">
        <MapPin className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" aria-hidden="true" />
        <span className="text-sm text-foreground">Excel Center, Melbourne</span>
      </div>

      {/* CTA row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <Link
          href="/assistant"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-700 to-blue-600 rounded-xl hover:brightness-110 hover:scale-105 transition-all shadow-[0_0_24px_rgba(34,211,238,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          Get My Schedule
        </Link>
        <Button
          variant="outline"
          size="lg"
          onClick={onOpenSchedule}
          className="px-8 py-4 text-lg h-auto"
        >
          View Full Program
        </Button>
      </div>

      {/* Stats row — three glass-card chips */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{sessionCount}</span> Sessions
        </span>
        <span className="glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{exhibitorCount}</span> Exhibitors
        </span>
        <span className="glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">4</span> Tracks
        </span>
      </div>
    </section>
  )
}
