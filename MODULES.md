# Module Manifests

Modules with clear boundaries and 2+ consumers. Each manifest documents purpose, dependencies, consumers, and public exports.

| Module | Manifest | Purpose |
|---|---|---|
| `lib/types` | [lib/types.manifest.yaml](lib/types.manifest.yaml) | Core TypeScript interfaces for all data shapes (Session, UserProfile, Schedule, APISchedule) |
| `lib/constants` | [lib/constants.manifest.yaml](lib/constants.manifest.yaml) | Event configuration — dates, taxonomies, timing rules, job-to-tag affinity weights |
| `lib/matching` | [lib/matching.manifest.yaml](lib/matching.manifest.yaml) | Tag-based session scoring and Fisher-Yates shuffle used by scheduler and chat API |
| `lib/scheduler` | [lib/scheduler.manifest.yaml](lib/scheduler.manifest.yaml) | Conflict-free personalized schedule generator — keynotes, networking, lunch, and interest-scored backfill |
| `lib/utils` | [lib/utils.manifest.yaml](lib/utils.manifest.yaml) | `cn()` helper — merges Tailwind classes with conflict resolution |
| `components/ui` | [components/ui/manifest.yaml](components/ui/manifest.yaml) | shadcn/ui Radix-based primitives (Button, Card, Input, Select, Tabs, Command, etc.) |

## What did not qualify

Modules excluded because they have fewer than 2 consumers:

| Path | Consumers | Reason |
|---|---|---|
| `lib/ics.ts` | 1 (`app/schedule/page.tsx`) | Single consumer |
| `lib/data.ts` | 0 (reads `lib/data/sessions.json` directly; not imported) | Unused import surface — `app/api/chat/route.ts` reads JSON directly |
| `data/` JSON files | 1–2 (file-system reads, not ES imports) | Read via `fs.readFileSync`, not importable modules |
| `components/chat/` | 1 (`components/MainView.tsx`) | Single consumer |
| `components/onboarding/` | 1 (`components/MainView.tsx`) | Single consumer |
| `components/scheduler/` | 1 (`components/MainView.tsx`) | Single consumer |
