/**
 * StatusBadge.tsx
 * 
 * Client-side component that displays the online/offline connection status of the application.
 * It listens to the browser's `navigator.onLine` API and real-time events to dynamically update
 * the UI with a green pulsing dot (Online) or a solid red dot (Offline).
 */

"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  appName?: string
}

export function StatusBadge({ appName = "AI Event Scheduler" }: StatusBadgeProps) {
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
    <span className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full bg-card">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline
            ? "bg-green-500 animate-pulse shadow-[0_0_0_0_rgba(34,197,94,0.4)]"
            : "bg-red-500 shadow-[0_0_0_0_rgba(239,68,68,0.4)]"
        )}
      />
      {appName} {isOnline ? "Online" : "Offline"}
    </span>
  )
}
