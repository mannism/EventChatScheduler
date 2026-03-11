/**
 * app/page.tsx
 *
 * Home page entry point. This is a Server Component that pre-loads all
 * session data from disk at request time, then passes it to the client-side
 * MainView component which manages the onboarding/chat/schedule flow.
 */

import { getSessions } from "@/lib/data"
import { MainView } from "@/components/MainView"

export default async function Home() {
  // Load sessions server-side so the client has immediate access without an API call
  const sessions = await getSessions()

  return (
    <MainView sessions={sessions} />
  )
}
