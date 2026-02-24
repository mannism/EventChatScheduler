import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

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
    <html lang="en">
      <body className={cn(inter.variable, outfit.variable, "font-sans antialiased bg-background text-foreground min-h-screen")}>{children}</body>
    </html>
  )
}
