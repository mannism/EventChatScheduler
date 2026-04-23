/**
 * app/assistant/page.tsx
 *
 * AI Conference Assistant route. Hosts the full onboarding → chat → schedule
 * flow previously at the root. Session data is loaded server-side so the
 * client has immediate access without a secondary API call.
 */

import { getSessions } from "@/lib/data"
import { MainView } from "@/components/MainView"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "AI Conference Assistant | XYZCon 2026",
  description: "Chat with the AI assistant to discover sessions, get personalized recommendations, and build your XYZCon 2026 schedule.",
}

export default async function AssistantPage() {
  // Pre-load sessions server-side — avoids a client-side fetch on mount
  const sessions = await getSessions()
  return <MainView sessions={sessions} />
}
