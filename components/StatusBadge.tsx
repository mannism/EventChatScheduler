/**
 * StatusBadge.tsx
 *
 * Client-side component that displays the online/offline connection status.
 * Listens to navigator.onLine and window online/offline events to dynamically
 * update the UI with a cyan pulsing dot (Online) or a solid red dot (Offline).
 *
 * Visual layer: glassmorphic pill with backdrop-blur, ARIA status role.
 */

"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  /** Name of the app shown next to the status text */
  appName?: string
}

export function StatusBadge({ appName = "AI Conference Assistant" }: StatusBadgeProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Read initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <span
      role="status"
      aria-label={isOnline ? `${appName}: Online` : `${appName}: Offline`}
      className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground border px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors duration-300 border-black/10 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/50"
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isOnline
            ? "bg-cyan-600 dark:bg-cyan-400 animate-pulse"
            : "bg-red-600 dark:bg-red-500"
        )}
      />
      <span className="hidden md:inline">{appName} </span>
      {isOnline ? "Online" : "Offline"}
    </span>
  )
}
