/**
 * app/layout.tsx
 *
 * Root layout. Sets up:
 * - Google Fonts: Merriweather (headings), Open Sans (body), JetBrains Mono (code)
 * - Dark-first theme (class="dark" on <html>, ThemeToggle manages toggle)
 * - Ambient background decorations (slow-pulsing blur gradients)
 * - Fixed glassmorphic header: "← Labs by Diana" on left, StatusBadge + ThemeToggle on right
 * - Content area offset by header height (64px)
 */

import type { Metadata } from 'next'
import { Merriweather, Open_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { ThemeToggle } from '@/components/ThemeToggle'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-heading'
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'XyzCon 2026 Event Scheduler',
  description: 'Your intelligent event companion for XyzCon 2026.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className="dark scroll-smooth"
      suppressHydrationWarning
      style={{ colorScheme: 'dark' }}
    >
      <body className={cn(
        merriweather.variable,
        openSans.variable,
        jetbrainsMono.variable,
        "font-sans antialiased min-h-screen selection:bg-cyan-400/30"
      )}>
        {/* Ambient background — two large, slow-pulsing blurred circles */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[120px] opacity-[0.06] -top-[150px] -right-[100px] animate-pulse"
            style={{ animationDuration: '14s' }}
          />
          <div
            className="absolute w-[400px] h-[400px] bg-violet-500 rounded-full blur-[100px] opacity-[0.07] -bottom-[80px] -left-[80px] animate-pulse"
            style={{ animationDuration: '18s', animationDelay: '2s' }}
          />
        </div>

        {/* Fixed glassmorphic header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-3.5 border-b transition-colors duration-300 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm border-slate-200 dark:border-slate-800">
          {/* Left: Labs by Diana link */}
          <a
            href="https://labs.dianaismail.me"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-500 dark:text-slate-400 no-underline transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Labs by Diana
          </a>

          {/* Right: status + theme toggle */}
          <div className="flex items-center gap-3">
            <StatusBadge appName="AI Event Scheduler" />
            <ThemeToggle />
          </div>
        </header>

        {/* Main content — offset by header height */}
        <div className="relative z-10 pt-[64px]">
          {children}
        </div>
      </body>
    </html>
  )
}
