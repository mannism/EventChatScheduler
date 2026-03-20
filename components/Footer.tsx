/**
 * Footer.tsx
 *
 * Site footer matching the labs.dianaismail.me footer aesthetic.
 * Font-mono, muted text, cyan accent on hover, subtle top border.
 * Light/dark-aware via Tailwind dark: utilities.
 */

"use client"

import { ArrowUpRight } from "lucide-react"

export function Footer() {
    return (
        <footer className="mt-20 py-10 border-t border-slate-200 dark:border-white/[0.08]">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Diana Ismail. All rights reserved.</p>

                <a
                    href="https://dianaismail.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-cyan-600 dark:hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                >
                    Return to portfolio <ArrowUpRight className="w-4 h-4" />
                </a>
            </div>
        </footer>
    )
}
