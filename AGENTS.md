# EventChatScheduler

AI Conference Assistant — a Next.js 16 demo built for XYZ showcasing AI-powered event assistance for XyzCon 2026. Uses OpenAI via Vercel AI SDK to help attendees discover sessions, get exhibitor info, and generate conflict-free personalised schedules through natural-language chat.

For fleet-wide standards (TypeScript, security, git workflow, PR comprehension gate, language policy), see `~/AGENTS.md`.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6
- **UI:** Tailwind CSS v4, shadcn/ui (Radix), Lucide icons, Framer Motion
- **Forms:** React Hook Form + Zod
- **Deployment:** Docker (multi-stage, `node:22-alpine`), standalone output mode, Railway-ready (health check at `/api/health`)

## Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run start
npm run lint
```

## Environment variables

Names only — defaults live in `.env.example`.

- `OPENAI_API_KEY` — required
- `OPENAI_MODEL` — model ID, see `.env.example` for default
- `MAX_SESSIONS_PER_DAY` — schedule cap per day
- `MAX_EXHIBITORS_PER_DAY` — exhibitor recommendations cap

## Architecture

**App flow:** Landing (`/`) → CTA to AI Assistant (`/assistant`) → Onboarding → Chat → Schedule. Exhibitors directory at `/exhibitors`.

**State:** React hooks only — no global store. Cross-tab data via `sessionStorage`.

**API route** (`app/api/chat/route.ts`) — core logic hub:
- Zod-validated request body (messages array + optional `userProfile`).
- Module-level static system prompt (built once on cold start for OpenAI prefix-cache hit rate).
- Four LLM tools: `searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`.
- Streams via `streamText()`, `maxOutputTokens: 1024`, `stepCountIs(3)`.
- Schedule generation delegates to `lib/scheduler.ts` (single source of truth).

**Schedule logic** (`lib/scheduler.ts`): Conflict-free session selection with mandatory keynotes, fixed networking/lunch blocks, exhibitor mixing by user interests.

**Special markers:** `[INIT_CHAT]` triggers greeting, `[GENERATE_SCHEDULE]` triggers schedule creation, `schedule_download` JSON blocks render `ViewScheduleButton` in chat.

### Directory map

```
app/
  api/chat/route.ts       # Main chat API
  api/health/route.ts     # Railway readiness
  page.tsx                # Landing
  assistant/page.tsx      # AI assistant flow
  exhibitors/page.tsx     # Exhibitor directory
  schedule/page.tsx       # Printable schedule view (reads sessionStorage)
components/
  landing/                # Landing page + sub-sections
  chat/ChatInterface.tsx  # Markdown rendering, schedule interception, tool-call progress
  onboarding/             # 3-step wizard
  scheduler/ScheduleView.tsx  # In-app schedule display + print
  ui/                     # shadcn/ui primitives
lib/
  scheduler.ts            # Conflict detection, 5-step pipeline
  matching.ts             # Tag matching, session scoring, Fisher-Yates shuffle
  ics.ts                  # iCalendar export
  data.ts, data/sessions.json  # Server-side data loaders
data/
  Scheduler_2026_consolidated_sessions.json
  Scheduler_2026_exhibitors.json
  Scheduler_System_Prompt.txt
  seo.json
```

## Conventions

- Client components: `"use client"` directive at top.
- Styling: Tailwind utility classes; `cn()` for conditional merging. Glass-morphism utilities prefixed `glass-*`.
- UI components follow the shadcn/ui pattern — composable, Radix-based, in `components/ui/`.
- Path alias: `@/*` maps to project root.
- Fonts: Merriweather (serif/headings), Open Sans (sans/body), JetBrains Mono (code).
- Brand colours: `#0a0c10` background, `#0069ff` accent (`xyz-blue`), `#f0f2f5` primary text.

## Key patterns

- Tool definitions use Zod schemas for type-safe LLM function calling.
- System prompt split into static prefix (brand, voice, formatting, keynotes, tool rules) + dynamic suffix (user context JSON) — ~50% input-token discount via OpenAI prompt caching.
- `searchSessions` supports `detail` param — short summaries by default, full descriptions on demand (reduces token payload).
- `sessionStorage` used for large schedule data transfer (avoids URL size limits).
- System messages/directives hidden from user-visible chat.
- Tool-call progress labels shown during AI tool execution (e.g. "Searching sessions...", "Building your schedule...").

## Repo-specific gotchas

- **Static system prompt is built at module load.** Editing the prompt requires a redeploy/cold start to apply. Don't try to wire dynamic prompt rebuilds without measuring the prefix-cache loss.
- **Tool step limit is `stepCountIs(3)`.** Raising this allows runaway token consumption — keep the cap unless you've added a separate budget guard.
- **`schedule_download` JSON block in chat is a contract with `ChatInterface.tsx`.** Both sides must change together; renaming on one side breaks the schedule handoff silently.
- **Rate limiting gap.** `/api/chat` has no rate limiting. Add before production use (was an explicit known gap as of the v0 demo build).

## Security

Headers configured in `next.config.ts` via `async headers()` on all routes (`/(.*)`):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS, 2-year max-age, includeSubDomains, preload)
- `Content-Security-Policy` (default-src self, frame-ancestors none, restricted script/style/img/font/connect sources)
- `Permissions-Policy` (camera, microphone, geolocation disabled)

### Pre-release smoke tests (Tier 2)

Full cross-project OWASP checklist: `/Users/mann/Documents/Claude/proj-plan/research/security-audit-cross-project.md`.

| Test | Expected |
|---|---|
| Malformed body to `/api/chat` | Zod rejects with 400 |
| `<script>` in chat input | Rendered as text via ReactMarkdown (no `dangerouslySetInnerHTML`) |
| Security headers check | HSTS, X-Frame-Options, CSP, X-Content-Type-Options present |
| Trigger 500 error | Safe error message, no stack traces |
| `npm audit --production` | Zero high/critical |
| View source | No `OPENAI_API_KEY` in client bundle |

Quarterly: OWASP ZAP against staging (first Monday of each quarter).

## Testing

Tier 2 — no test framework currently in place. See `/Users/mann/Documents/Claude/testing-policy.md` for the fleet's Tier 2 baseline.

## Deployment

Docker (multi-stage, `node:22-alpine`), standalone output mode, Railway-ready. Health check at `/api/health`. Merging to `main` triggers `.github/workflows/release.yml` (semantic-release).

## See also

- `~/AGENTS.md` — fleet-wide standards
- `CLAUDE.md` — Claude-Code-specific layers
- `README.md` — human-facing overview
- `SECURITY.md` — security policy
- `MODULES.md` — module manifest index
