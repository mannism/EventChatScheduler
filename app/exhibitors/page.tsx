/**
 * app/exhibitors/page.tsx
 *
 * Full exhibitors and partners directory. Loads exhibitor data server-side
 * and passes it to the searchable ExhibitorsView client component.
 */

import { getExhibitors } from "@/lib/data"
import { ExhibitorsView } from "@/components/ExhibitorsView"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Exhibitors & Partners | XYZCon 2026",
  description: "Browse 86 exhibitors and partners at XYZCon 2026.",
}

export default async function ExhibitorsPage() {
  const exhibitors = await getExhibitors()
  return <ExhibitorsView exhibitors={exhibitors} />
}
