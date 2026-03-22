/**
 * app/layout.tsx
 *
 * Root layout. Sets up:
 * - Google Fonts: Merriweather (headings), Open Sans (body), JetBrains Mono (code)
 * - Dark-first theme (class="dark" on <html>, ThemeToggle manages toggle)
 * - Ambient background decorations (slow-pulsing blur gradients)
 * - Fixed glassmorphic header: "← Labs by Diana" on left, StatusBadge + ThemeToggle on right
 * - Content area offset by header height (64px)
 * - SEO metadata driven by data/seo.json for easy maintenance
 */

import type { Metadata } from 'next'
import { Merriweather, Open_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Footer } from '@/components/Footer'
import seo from '@/data/seo.json'

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
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  authors: [{ name: seo.author }],
  metadataBase: new URL(seo.siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    type: seo.openGraph.type as 'website',
    locale: seo.openGraph.locale,
    url: seo.siteUrl,
    siteName: seo.siteName,
    title: seo.title,
    description: seo.description,
    images: [{
      url: seo.openGraph.imageUrl,
      width: seo.openGraph.imageWidth,
      height: seo.openGraph.imageHeight,
      alt: seo.openGraph.imageAlt,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: seo.title,
    description: seo.description,
    creator: seo.twitterHandle,
    images: [seo.openGraph.imageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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

        {/* Fixed glassmorphic header — full-width bg, content constrained to max-w-5xl */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 md:px-8 py-3.5">
            {/* Left: Labs by Diana badge link */}
            <a
              href="https://labs.dianaismail.me/"
              target="_self"
              className="inline-flex items-center gap-1.5 font-mono text-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-full group"
              aria-label="Back to Labs by Diana"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 group-hover:border-cyan-600/50 dark:group-hover:border-cyan-400/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-all duration-200">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span className="text-slate-300 dark:text-slate-600 select-none">//</span>
                <span className="tracking-widest uppercase font-semibold">LABS</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal normal-case tracking-normal">by Diana</span>
              </span>
            </a>

            {/* Right: theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main content — offset by header height */}
        <div className="relative z-10 pt-[64px]">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}
