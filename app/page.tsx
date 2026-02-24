import { getSessions } from "@/lib/data"
import { MainView } from "@/components/MainView"

export default async function Home() {
  const sessions = await getSessions()

  return (
    <MainView sessions={sessions} />
  )
}
