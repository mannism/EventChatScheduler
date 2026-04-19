# AI Conference Assistant

![version](https://img.shields.io/github/package-json/v/mannism/EventChatScheduler)

AI Conference Assistant is a Next.js 16 demo built for XYZ, showcasing AI-powered event assistance capabilities for XyzCon 2026. It uses generative AI to help attendees navigate the event schedule, search for relevant sessions, and dynamically generate conflict-free personalized itineraries through natural language chat.

The assistant uses the JSON files in `/data` as its dataset. **The `data` folder is included in the repository as sample event data so you can test and experiment with the AI assistant out of the box.**

## Features

- **Conversational AI Interface**: Powered by the Vercel AI SDK and OpenAI GPT-5.4-mini, attendees can ask questions about the event, find keynote speakers, or discover specific themes like "Partner & Community" sessions.
- **Dynamic Tool Execution**: The chatbot uses background tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`) to retrieve precise JSON event data and seamlessly integrate it into the conversation context.
- **Interactive Schedule Generation**: The AI builds a comprehensive, automated daily schedule mapping back-to-back sessions against the user's specific attendance days and thematic interests -- complete with conflict detection and a 5-minute buffer between sessions.
- **Printable HTML Schedule**: Generates a large JSON payload of the user's itinerary, safely passes it via `sessionStorage`, and opens an elegant Next.js `/schedule` route optimized for printing in landscape format.
- **iCalendar Export**: One-click "Add to Calendar" button generates a standards-compliant `.ics` file for import into Google Calendar, Apple Calendar, Outlook, and other calendar apps.
- **Smart Session Scoring**: Sessions are ranked by a multi-factor relevance algorithm -- interest tag matches (+3), region affinity (+2), external speaker metadata (+1), and job-type tag affinity (+1).
- **Dark / Light Theme**: Persisted via `localStorage`. Defaults to dark mode. Toggled via the header button. All UI is WCAG AA compliant in both modes.
- **Responsive Lab-Console UI**: Tailwind CSS v4, glassmorphism, Framer Motion animations, and a cyan accent palette.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 (strict mode) |
| **AI** | Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6 |
| **UI** | Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Framer Motion |
| **Forms** | React Hook Form + Zod validation |
| **Deployment** | Docker (multi-stage, `node:20-alpine`), standalone output mode |
| **CI/CD** | GitHub Actions (typecheck, lint, build, security audit), semantic-release |

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- An OpenAI API key

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL="gpt-5.4-mini"    # or your preferred model
MAX_SESSIONS_PER_DAY=8
MAX_EXHIBITORS_PER_DAY=10
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Authenticates with the OpenAI API |
| `OPENAI_MODEL` | No | Model ID used by the Vercel AI SDK (default: `gpt-5.4-mini`) |
| `MAX_SESSIONS_PER_DAY` | No | Maximum personalized sessions to recommend per attendance day |
| `MAX_EXHIBITORS_PER_DAY` | No | Maximum exhibitor recommendations per attendance day |

### Development

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running with Docker

```bash
# Build image
docker build -t eventchatscheduler .

# Run (pass env vars from .env.local)
docker run -p 3000:3000 --env-file .env.local eventchatscheduler
```

The Docker image uses a multi-stage build with `node:20-alpine` and Next.js standalone output for minimal image size. A non-root `nextjs` user runs the production process.

## Architecture

```
Onboarding (3-step form)  -->  Chat (AI conversation + tools)  -->  Schedule (printable view)
```

**State management**: React hooks only -- no global store. `localStorage` persists user profile and phase across reloads. `sessionStorage` transfers large schedule payloads to the print view.

### Core Modules

| Module | Description |
|--------|-------------|
| `app/api/chat/route.ts` | Core API route with Zod-validated request body. Cache-optimized system prompt (static prefix + dynamic user context). Defines 4 tools, delegates schedule generation to `lib/scheduler.ts`, and streams responses via the Vercel AI SDK. |
| `components/MainView.tsx` | Phase controller orchestrating onboarding, chat, and schedule. Persists user profile and current phase to `localStorage` so returning users skip onboarding. |
| `components/chat/ChatInterface.tsx` | Renders the conversation UI. Intercepts Markdown payloads (JSON code blocks marked `schedule_download`) to dynamically spawn the `ViewScheduleButton`. Shows contextual tool-call progress labels. Single scroll manager with near-bottom detection. |
| `components/onboarding/OnboardingForm.tsx` | 3-step wizard collecting user profile: (1) name + role, (2) location + attendance days, (3) interests. Per-step Zod validation. |
| `components/scheduler/ScheduleView.tsx` | In-app tabbed schedule display with print support. Session cards are color-coded by type (keynotes, breaks, regular sessions). |
| `lib/scheduler.ts` | Client-side schedule generation engine: 5-step pipeline (mandatory keynotes, fixed networking, lunch, App Spotlight, personalized backfill by interest score). |
| `lib/matching.ts` | Shared tag matching (exact + word-boundary regex), multi-factor session scoring, Fisher-Yates shuffle. |
| `lib/ics.ts` | Generates standards-compliant iCalendar (`.ics`) files from the schedule format. |

### LLM Tools

| Tool | Description |
|------|-------------|
| `searchSessions` | Search sessions by track, tags, date, or presenter. Returns scored, non-clashing results. Supports `detail` param for full vs. short descriptions. |
| `getExhibitors` | Look up exhibitors/sponsors by name or interest tags. Ranked by relevance to user profile. |
| `getPresenters` | Find presenters and their sessions. Supports filtered or exhaustive listing. |
| `createSchedule` | Generates a complete personalized 2-day schedule with keynotes, breaks, and exhibitor recommendations. |

### Special Markers

| Marker | Purpose |
|--------|---------|
| `[INIT_CHAT]` | Sent on first load to trigger the AI greeting with user profile context |
| `[GENERATE_SCHEDULE]` | Triggers client-side schedule generation when detected in AI response |
| `schedule_download` JSON blocks | Intercepted by ChatInterface and rendered as `ViewScheduleButton` |

## Project Structure

```
.github/
  dependabot.yml                               # Weekly npm dependency updates
  workflows/
    ci.yml                                     # Typecheck, lint, build + security audit
    release.yml                                # semantic-release on merge to main
app/
  api/
    chat/route.ts                              # Chat API -- Zod-validated, cache-optimized prompt, tool definitions, streaming
    health/route.ts                            # Health check endpoint for Railway readiness probe
  page.tsx                                     # Home page -- server-side session loading
  schedule/page.tsx                            # Printable schedule view (reads sessionStorage)
  layout.tsx                                   # Root layout -- fonts, ambient bg, header, SEO metadata
  globals.css                                  # Tailwind theme, CSS variables, glass-morphism styles
components/
  MainView.tsx                                 # Phase controller: onboarding -> chat -> schedule
  ThemeToggle.tsx                              # Dark/light toggle -- localStorage-persisted, hydration-safe
  Footer.tsx                                   # Server component footer
  chat/
    ChatInterface.tsx                          # AI chat UI -- markdown rendering, schedule interception, tool-call progress
    ViewScheduleButton.tsx                     # sessionStorage schedule handoff to /schedule route
  onboarding/
    OnboardingForm.tsx                         # 3-step wizard (name+role, location+days, interests)
  scheduler/
    ScheduleView.tsx                           # Tabbed in-app schedule display with print support
  ui/                                          # shadcn/ui primitives (button, card, command, dialog, form, input, label, popover, select, tabs)
lib/
  types.ts                                     # Core TypeScript interfaces (Session, UserProfile, Schedule)
  data.ts                                      # Server-side session data loader (reads JSON from disk)
  scheduler.ts                                 # Schedule generation engine (conflict detection, 5-step pipeline)
  matching.ts                                  # Tag matching, session scoring, Fisher-Yates shuffle
  ics.ts                                       # iCalendar (.ics) export generator
  constants.ts                                 # Event config (dates, job types, interests, networking times)
  utils.ts                                     # cn() utility -- clsx + tailwind-merge
data/
  seo.json                                     # SEO metadata -- title, OG, Twitter Card
  Scheduler_2026_consolidated_sessions.json    # Event sessions dataset
  Scheduler_2026_exhibitors.json               # Exhibitor/sponsor profiles
  Scheduler_System_Prompt.txt                  # AI system prompt reference
public/                                        # Favicon variants (16/32/48/192/512px, apple-touch-icon)
```

## Security

### Headers

All routes are served with the following security headers (configured in `next.config.ts`):

- `X-Frame-Options: DENY` -- prevents clickjacking
- `X-Content-Type-Options: nosniff` -- prevents MIME-type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` -- HSTS with 2-year max-age, includeSubDomains, preload
- `Content-Security-Policy` -- restricts resource loading sources, frame-ancestors none
- `Permissions-Policy` -- disables camera, microphone, geolocation

### Application Security

- AI-generated content rendered via ReactMarkdown (XSS-safe) -- no `dangerouslySetInnerHTML`
- Zod validation on the onboarding form and `/api/chat` request body (returns 400 on malformed input)
- API keys server-side only -- never exposed to the client bundle
- Graceful error handling on AI service failures (safe 500 messages, no stack traces)

### Known Gaps

- **Rate limiting** on `/api/chat` is not yet implemented. Required before production use.

## CI/CD

### GitHub Actions

**CI Pipeline** (`.github/workflows/ci.yml`) -- runs on push and PRs to `main`:
- Typecheck (`tsc --noEmit`)
- Lint (`eslint`)
- Production build (`next build`)
- Security audit (`npm audit --production --audit-level=high`)

**Release Pipeline** (`.github/workflows/release.yml`) -- runs on push to `main`:
- Automated versioning via [semantic-release](https://github.com/semantic-release/semantic-release)
- Generates CHANGELOG.md
- Creates GitHub Releases with tags
- Commits updated `package.json`, `CHANGELOG.md`, and `README.md` version

### Dependabot

Configured in `.github/dependabot.yml`:
- Weekly npm dependency checks (Mondays)
- Groups minor and patch updates
- Limit of 5 open PRs

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:      new feature (minor release)
fix:       bug fix (patch release)
refactor:  code refactoring (patch release)
perf:      performance improvement (patch release)
chore:     maintenance (no release)
docs:      documentation (no release)
ci:        CI changes (no release)
test:      tests (no release)
```

## Datasets

Static JSON files in `/data` serve as the AI's backend -- no database required:

| File | Description |
|------|-------------|
| `seo.json` | SEO metadata (title, description, keywords, OpenGraph, Twitter Card). Imported by `app/layout.tsx`. |
| `Scheduler_System_Prompt.txt` | Core system prompt that dictates the AI's persona, instructions, and behavioral guidelines. |
| `Scheduler_2026_consolidated_sessions.json` | Master schedule database -- sessions with `startDateTime`, `title`, `stage`, `presenters`, `track`, and `tags`. |
| `Scheduler_2026_exhibitors.json` | Exhibitor and sponsor profiles with names, logos, and categorized tags. |

## License

Private project. Not licensed for redistribution.
