/**
 * app/page.tsx
 *
 * Conference landing page entry point. Loads sessions, exhibitors, and keynotes
 * in parallel at request time and passes them to the client LandingPage component.
 * The AI assistant flow now lives at /assistant.
 */

import { getSessions, getExhibitors, getKeynotes } from "@/lib/data"
import { LandingPage } from "@/components/landing/LandingPage"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "XYZCon 2026 — Excel Center, Melbourne | Sep 3–4",
  description: "Join XYZCon 2026, XYZ's flagship conference for accountants and bookkeepers. 119 sessions, 86 exhibitors, Sep 3–4 at Excel Center, Melbourne.",
}

export default async function Home() {
  // Fetch all three data sets in parallel — no waterfall
  const [sessions, exhibitors, keynotes] = await Promise.all([
    getSessions(),
    getExhibitors(),
    getKeynotes(),
  ])

  return <LandingPage sessions={sessions} exhibitors={exhibitors} keynotes={keynotes} />
}
