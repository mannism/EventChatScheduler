/**
 * components/landing/ExhibitorsTeaser.tsx
 *
 * Landing page section showing a horizontal scroll pill row of the first 12
 * exhibitors, with a link to the full /exhibitors page.
 */

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Exhibitor } from "@/lib/types"

interface ExhibitorsTeaserProps {
  exhibitors: Exhibitor[]
}

export function ExhibitorsTeaser({ exhibitors }: ExhibitorsTeaserProps) {
  // Show the first 12 exhibitors as a horizontal scroll row
  const preview = exhibitors.slice(0, 12)

  return (
    <section className="mb-20">
      <h2 className="text-3xl font-serif font-bold text-foreground mb-6">
        Exhibitors &amp; Partners
      </h2>

      {/* Horizontal scroll pill row — scrollbar hidden for cleaner look */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-label="Featured exhibitors"
      >
        {preview.map(exhibitor => (
          <span
            key={exhibitor.name}
            className="glass-card rounded-full px-4 py-2 text-sm whitespace-nowrap text-foreground shrink-0"
          >
            {exhibitor.name}
          </span>
        ))}
      </div>

      {/* Link to full exhibitors page */}
      <Link
        href="/exhibitors"
        className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-400 hover:underline mt-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
      >
        View All {exhibitors.length} Exhibitors
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
