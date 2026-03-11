/**
 * app/layout.tsx
 *
 * Root layout for the application. Sets up:
 * - Three Google Fonts: Merriweather (headings), Open Sans (body), JetBrains Mono (code)
 * - Dark theme with forced "dark" class on <html>
 * - Ambient background decorations (animated blur gradients for glass-morphism aesthetic)
 * - Fixed glassmorphic header with navigation links and online/offline status badge
 * - Content area offset by header height (70px)
 */

import type { Metadata } from 'next'
import { Merriweather, Open_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'

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
    <html lang="en" className="dark scroll-smooth">
      <body className={cn(
        merriweather.variable,
        openSans.variable,
        jetbrainsMono.variable,
        "font-sans antialiased min-h-screen selection:bg-primary/30"
      )}>
        {/* Ambient background — two large, slow-pulsing blurred circles that create
            the signature dark glass-morphism aesthetic across the entire app */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[600px] h-[600px] bg-primary rounded-full blur-[100px] opacity-[0.15] -top-[150px] -right-[100px] animate-pulse" style={{ animationDuration: '14s' }} />
          <div className="absolute w-[400px] h-[400px] bg-chart-5 rounded-full blur-[100px] opacity-[0.15] -bottom-[80px] -left-[80px] animate-pulse delay-1000" style={{ animationDuration: '18s' }} />
        </div>

        {/* Fixed glassmorphic header — stays visible during scroll */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-border bg-background/70 backdrop-blur-md">
          <nav className="flex items-center gap-3.5">
            <a href="https://labs.dianaismail.me" className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Labs
            </a>
            <span className="text-border text-sm font-mono">/</span>
            <a href="https://dianaismail.me" target="_blank" rel="noreferrer" className="font-serif text-sm font-bold tracking-widest text-foreground no-underline uppercase transition-colors hover:text-primary">
              DIANA ISMAIL
            </a>
          </nav>
          <StatusBadge appName="AI Event Scheduler" />
        </header>

        {/* Main content area — offset by header height so content isn't hidden behind it */}
        <div className="relative z-10 pt-[70px]">
          {children}
        </div>
      </body>
    </html>
  )
}
