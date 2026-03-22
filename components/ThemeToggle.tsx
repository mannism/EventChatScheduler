/**
 * ThemeToggle.tsx
 *
 * Client-side dark/light theme toggle button.
 * Reads the saved preference from localStorage on mount, applies the appropriate
 * class (.dark) to <html>, and persists every toggle back to localStorage.
 *
 * Default: dark mode (matches SSR html class="dark").
 */

"use client"

import { useState, useEffect, startTransition } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }

  // Read persisted preference on mount and sync class to <html>
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = saved ? saved === 'dark' : true
    applyTheme(prefersDark)
    startTransition(() => {
      setIsDark(prefersDark)
      setMounted(true)
    })
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    applyTheme(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // Render a static placeholder before mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="h-9 w-9 rounded-lg border border-black/10 dark:border-slate-800 bg-white/80 dark:bg-transparent flex items-center justify-center"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        "h-9 w-9 rounded-lg border flex items-center justify-center transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500 focus-visible:ring-offset-2",
        isDark
          ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400"
          : "border-black/10 bg-white/80 text-slate-500 hover:border-cyan-500/50 hover:text-cyan-600"
      )}
    >
      {isDark
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  )
}
