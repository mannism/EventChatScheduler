# CLAUDE.md

> Global rules (TypeScript, security, git workflow, accessibility baseline) are in ~/.claude/CLAUDE.md

## Project Overview

AI Conference Assistant — a Next.js 16 demo built for XYZ showcasing AI-powered event assistance capabilities for XyzCon 2026. Uses OpenAI GPT-5.4-mini via Vercel AI SDK to help attendees discover sessions, get exhibitor info, and generate conflict-free personalized schedules through natural language chat.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6
- **UI**: Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Docker (multi-stage, node:20-alpine), standalone output mode, Railway-ready (health check at `/api/health`)

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Environment Variables (.env.local)

- `OPENAI_API_KEY` — Required
- `OPENAI_MODEL` — Model ID (default: gpt-5.4-mini)
- `MAX_SESSIONS_PER_DAY` — Schedule cap per day
- `MAX_EXHIBITORS_PER_DAY` — Exhibitor recommendations cap

## Project Structure

```
.github/
  dependabot.yml                               # Weekly npm dependency updates
  workflows/
    ci.yml                                     # Typecheck, lint, build + npm audit
    release.yml                                # semantic-release on merge to main
app/
  api/
    chat/route.ts                              # Main chat API — Zod-validated, cache-optimized prompt, tool definitions, streaming
    health/route.ts                            # Health check endpoint for Railway readiness probe
  page.tsx                                     # Home page entry
  schedule/page.tsx                            # Printable schedule view (reads sessionStorage)
  layout.tsx                                   # Root layout with fonts, header, SEO metadata
  globals.css                                  # Tailwind theme, CSS variables, glass-morphism styles
  favicon.ico                                  # App favicon
components/
  MainView.tsx                                 # Phase controller: onboarding → chat → schedule
  ThemeToggle.tsx                              # Dark/light theme toggle
  Footer.tsx                                   # Server component footer
  chat/
    ChatInterface.tsx                          # AI chat UI — markdown rendering, schedule interception, tool-call progress
    ViewScheduleButton.tsx                     # sessionStorage schedule handoff to /schedule route
  onboarding/
    OnboardingForm.tsx                         # 3-step wizard (name+role, location+days, interests)
  scheduler/
    ScheduleView.tsx                           # Tabbed in-app schedule display with print support
  ui/                                          # shadcn/ui primitives (button, card, command, dialog, form, input, label, popover, select, tabs)
lib/
  types.ts                                     # Core TypeScript interfaces
  data.ts                                      # Server-side session data loader (reads JSON from disk)
  data/sessions.json                           # Compiled session data (generated/cached)
  scheduler.ts                                 # Schedule generation (conflict detection, 5-step pipeline)
  matching.ts                                  # Tag matching, session scoring, Fisher-Yates shuffle
  ics.ts                                       # iCalendar (.ics) export generator
  constants.ts                                 # Event config (dates, job types, interests, networking times)
  utils.ts                                     # cn() utility (clsx + tailwind-merge)
data/
  seo.json                                     # SEO metadata — title, OG, Twitter Card
  Scheduler_2026_consolidated_sessions.json    # Event sessions dataset
  Scheduler_2026_exhibitors.json               # Exhibitor/sponsor profiles
  Scheduler_System_Prompt.txt                  # AI system prompt reference
public/                                        # Favicon variants (16/32/48/192/512px, apple-touch-icon)
```

## Architecture

**App flow**: Onboarding (multi-step form) → Chat (AI conversation) → Schedule (printable view)

**State management**: React hooks only — no global store. Cross-tab data via sessionStorage.

**API route** (`app/api/chat/route.ts`): Core logic hub — Zod-validated request body, cache-optimized system prompt (static prefix + dynamic user context suffix for OpenAI automatic prompt caching), defines 4 LLM tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`), streams responses via `streamText()`. Schedule generation delegates to `lib/scheduler.ts` (single source of truth).

**Schedule logic** (`lib/scheduler.ts`): Conflict-free session selection with mandatory keynotes, fixed networking/lunch blocks, exhibitor mixing by user interests.

**Special markers**: `[INIT_CHAT]` triggers greeting, `[GENERATE_SCHEDULE]` triggers schedule creation, `schedule_download` JSON blocks render ViewScheduleButton in chat.

## Conventions

- **Client components**: `"use client"` directive at top
- **Styling**: Tailwind utility classes, `cn()` for conditional merging; glass-morphism utilities prefixed `glass-*`
- **UI components**: shadcn/ui pattern — composable, Radix-based, in `components/ui/`
- **Path aliases**: `@/*` maps to project root
- **Fonts**: Merriweather (`font-serif` / headings), Open Sans (`font-sans` / body), JetBrains Mono (`font-mono` / code)
- **Brand colors**: `#0a0c10` background, `#0069ff` accent blue (`xyz-blue`), `#f0f2f5` primary text

## Key Patterns

- Tool definitions use Zod schemas for type-safe LLM function calling
- System prompt split into static prefix (brand, voice, formatting, keynotes, tool rules) + dynamic suffix (user context JSON) for OpenAI automatic prompt caching (~50% input token discount on cached prefix)
- `searchSessions` supports `detail` param — short summaries by default, full descriptions on demand (reduces token payload)
- Tool step limit set to 3 (`stepCountIs(3)`) to prevent runaway token consumption
- sessionStorage used for large schedule data transfer (avoids URL size limits)
- System messages/directives hidden from user-visible chat
- Tool-call progress labels shown during AI tool execution (e.g. "Searching sessions...", "Building your schedule...")
- Glass-morphism dark theme (Diana Ismail inspired) via CSS variables in globals.css

## Developer Rules

### Error Handling
- Return a graceful fallback response when the AI service fails so the app remains usable (e.g., return a 500 with a safe message rather than an unhandled crash)

### Input Validation
- Validate all incoming API payloads with Zod schemas — `/api/chat` request body is Zod-validated (messages array + optional userProfile), returns 400 on malformed input
- Do **not** bypass ReactMarkdown's XSS protection by using `dangerouslySetInnerHTML` to render AI-generated content

### Security Headers (IMPLEMENTED)
- Security headers configured in `next.config.ts` via `async headers()` on all routes (`/(.*)`):
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security` (HSTS, 2-year max-age, includeSubDomains, preload)
  - `Content-Security-Policy` (default-src self, frame-ancestors none, restricted script/style/img/font/connect sources)
  - `Permissions-Policy` (camera, microphone, geolocation disabled)
- **Rate limiting (GAP):** No rate limiting on `/api/chat`. Must add before production use.

### OWASP Security Checklist (mandatory on every release)
Full cross-project checklist: `Owner Inbox/research/security-audit-cross-project.md`

**EventChatScheduler-specific smoke tests (Quinn runs on every release):**
| Test | Expected |
|------|----------|
| Chat input validation — malformed body to `/api/chat` | Zod rejects with 400 |
| `<script>` in chat input | Rendered as text via ReactMarkdown |
| Security headers check | HSTS, X-Frame-Options, CSP, X-Content-Type-Options |
| Trigger 500 error | Safe error message, no stack traces |
| `npm audit --production` | Zero high/critical |
| View source — no OPENAI_API_KEY in client | Pass |

### CI Security (mandatory — IMPLEMENTED)
- **Dependabot** enabled (`.github/dependabot.yml`) — weekly npm updates, groups minor/patch, limit 5 open PRs
- **npm audit** step in CI (`.github/workflows/ci.yml` `security-audit` job): `npm audit --production --audit-level=high`
- **CI pipeline** (`.github/workflows/ci.yml`): typecheck (`tsc --noEmit`), lint, build, and security audit on every push/PR to main
- **semantic-release** (`.github/workflows/release.yml`): automated versioning, CHANGELOG, and GitHub Releases on merge to main
- **Quarterly review:** Sable runs OWASP ZAP against staging first Monday of each quarter

### Testing
- When a test framework is introduced, new features and bug fixes must include unit tests; the AI chat API route and schedule generation logic are the highest-priority paths to cover
