"use client"

/**
 * components/ExhibitorsView.tsx
 *
 * Searchable exhibitors and partners directory. Filters by name or tag
 * (case-insensitive substring match) as the user types. Each card shows
 * the exhibitor name, tag pills, and region count.
 */

import { useState, useMemo } from "react"
import Link from "next/link"
import { Exhibitor } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ExhibitorsViewProps {
  exhibitors: Exhibitor[]
}

/**
 * Tag color palette — cycles through a small set of muted tones so that
 * tags are visually distinct without requiring a per-tag color map.
 */
const TAG_COLORS = [
  'bg-cyan-400/10 text-cyan-700 dark:text-cyan-300',
  'bg-violet-400/10 text-violet-700 dark:text-violet-300',
  'bg-emerald-400/10 text-emerald-700 dark:text-emerald-300',
  'bg-amber-400/10 text-amber-700 dark:text-amber-300',
  'bg-rose-400/10 text-rose-700 dark:text-rose-300',
  'bg-sky-400/10 text-sky-700 dark:text-sky-300',
]

/** Deterministically pick a color for a given tag string */
function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length] ?? TAG_COLORS[0]
}

export function ExhibitorsView({ exhibitors }: ExhibitorsViewProps) {
  const [query, setQuery] = useState('')

  // Filter exhibitors by name or tag — case-insensitive substring
  const filtered = useMemo(() => {
    if (!query.trim()) return exhibitors
    const q = query.toLowerCase()
    return exhibitors.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [exhibitors, query])

  return (
    <main className="min-h-[calc(100vh-64px)] bg-transparent text-foreground">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
        >
          <span aria-hidden="true">←</span> Back to Conference
        </Link>

        {/* Page heading */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
          Exhibitors &amp; Partners
        </h1>
        <p className="text-muted-foreground mb-8">
          {exhibitors.length} companies at XYZCon 2026
        </p>

        {/* Search */}
        <div className="mb-8 max-w-sm">
          <label htmlFor="exhibitor-search" className="sr-only">
            Search exhibitors by name or category
          </label>
          <Input
            id="exhibitor-search"
            type="search"
            placeholder="Search by name or category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Results count when filtering */}
        {query.trim() && (
          <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
            {filtered.length === 0
              ? 'No exhibitors match your search.'
              : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
          </p>
        )}

        {/* Exhibitor cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exhibitor => (
            <article
              key={exhibitor.name}
              className="glass-card rounded-xl p-5"
            >
              {/* Name */}
              <h2 className="font-serif font-bold text-lg text-foreground mb-3 leading-snug">
                {exhibitor.name}
              </h2>

              {/* Tags */}
              {exhibitor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {exhibitor.tags.map(tag => (
                    <span
                      key={tag}
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        tagColor(tag)
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Region count — only shown when regions exist */}
              {exhibitor.regions && exhibitor.regions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {exhibitor.regions.length} region{exhibitor.regions.length === 1 ? '' : 's'}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
