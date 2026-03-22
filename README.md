# AI Conference Assistant v2.2.8

AI Conference Assistant is a Next.js 16 demo built for XYZ, showcasing AI-powered event assistance capabilities for XyzCon 2026. It uses generative AI to help attendees navigate the event schedule, search for relevant sessions, and dynamically generate conflict-free personalized itineraries through natural language chat.

The assistant uses the JSON files in `/data` as its dataset. **The `data` folder is included in the repository as sample event data so you can test and experiment with the AI assistant out of the box.**

## Key Features

- **Conversational AI Interface**: Powered by the Vercel AI SDK and OpenAI GPT-5.1, attendees can ask questions about the event, find keynote speakers, or discover specific themes like "Partner & Community" sessions.
- **Dynamic Tool Execution**: The chatbot uses background tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`) to retrieve precise JSON event data and seamlessly integrate it into the conversation context.
- **Interactive Schedule Generation**: The AI can build a comprehensive, automated daily schedule mapping back-to-back sessions against the user's specific attendance days and thematic interests — complete with conflict detection and a 5-minute buffer between sessions.
- **Printable HTML Schedule Tab**: Generates a large JSON payload of the user's itinerary, safely passes it via `sessionStorage`, and opens an elegant Next.js `/schedule` route optimised for printing in landscape format.
- **iCalendar Export**: One-click "Add to Calendar" button generates a standards-compliant `.ics` file for import into Google Calendar, Apple Calendar, Outlook, and other calendar apps.
- **Smart Session Scoring**: Sessions are ranked by a multi-factor relevance algorithm — interest tag matches (+3), region affinity (+2), external speaker metadata (+1), and job-type tag affinity (+1).
- **Dark / Light Theme**: Persisted via `localStorage`. Defaults to dark mode. Toggled via the header button. All UI is WCAG AA compliant in both modes.
- **Responsive Lab-Console UI**: Tailwind CSS v4, glassmorphism, Framer Motion animations, and a cyan accent palette inspired by `labs.dianaismail.me`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 (strict mode) |
| **AI** | Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6 |
| **UI** | Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Framer Motion |
| **Forms** | React Hook Form + Zod validation |
| **Deployment** | Docker (multi-stage, `node:20-alpine`), standalone output mode |

## Getting Started

Install module dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root. The following variables are required:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL="gpt-5.1"         # or your preferred model
MAX_SESSIONS_PER_DAY=8
MAX_EXHIBITORS_PER_DAY=10
```

- **`OPENAI_API_KEY`**: Required to authenticate with the OpenAI API.
- **`OPENAI_MODEL`**: The model used by the Vercel AI SDK (e.g., `gpt-5.1`, `gpt-4o`).
- **`MAX_SESSIONS_PER_DAY`**: Maximum personalised sessions to recommend per attendance day.
- **`MAX_EXHIBITORS_PER_DAY`**: Maximum exhibitor recommendations per attendance day.

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

### Running with Docker

```bash
# Build image
docker build -t eventchatscheduler-poc .

# Run (pass env vars from .env.local)
docker run -p 3000:3000 --env-file .env.local eventchatscheduler-poc
```

## Architecture & Application Flow

```
Onboarding (5-step form) → Chat (AI conversation + tools) → Schedule (printable view)
```

**State management**: React hooks only — no global store. `localStorage` persists user profile and phase across reloads. `sessionStorage` transfers large schedule payloads to the print view.

### Core Modules

- **`app/api/chat/route.ts`** — Core API route driving stream completions and OpenAI tool calling. Defines 4 tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`), enforces strict JSON formatting, and streams responses via the Vercel AI SDK.

- **`components/chat/ChatInterface.tsx`** — Renders the conversation UI. Intercepts Markdown payloads (JSON code blocks marked `schedule_download`) to dynamically spawn the `ViewScheduleButton` instead of raw text. Three-tier auto-scroll: snap-to-bottom on user messages, gentle 120px nudge on AI responses, continuous scroll during loading.

- **`components/MainView.tsx`** — Phase controller orchestrating onboarding → chat → schedule. Persists user profile and current phase to `localStorage` so returning users skip onboarding.

- **`components/onboarding/OnboardingForm.tsx`** — Multi-step wizard collecting user profile (name, role, location, attendance days, interests) with per-step Zod validation.

- **`components/scheduler/ScheduleView.tsx`** — In-app tabbed schedule display with print support. Session cards are colour-coded by type (keynotes, breaks, regular sessions).

- **`components/ThemeToggle.tsx`** — Dark/light theme toggle button. Reads and writes `localStorage('theme')`, toggles `.dark`/`.light` on `<html>`. Pre-mount placeholder prevents hydration mismatch. WCAG AA contrast in both modes.

- **`components/Footer.tsx`** — Server component footer: copyright right-aligned, font-mono, muted, border-top separator.

- **`app/schedule/page.tsx`** — Standalone route that reads schedule data from `sessionStorage` and renders a landscape-oriented HTML table for printing. Includes iCalendar export.

- **`lib/scheduler.ts`** — Client-side schedule generation engine: 5-step pipeline (mandatory keynotes → fixed networking → lunch → App Spotlight → personalized backfill by interest score).

- **`lib/matching.ts`** — Shared tag matching (exact + word-boundary regex), multi-factor session scoring, Fisher-Yates shuffle.

- **`lib/ics.ts`** — Generates standards-compliant iCalendar (`.ics`) files from the schedule format.

### LLM Tools

| Tool | Description |
|------|-------------|
| `searchSessions` | Search sessions by track, tags, date, or presenter. Returns scored, non-clashing results. |
| `getExhibitors` | Look up exhibitors/sponsors by name or interest tags. Ranked by relevance to user profile. |
| `getPresenters` | Find presenters and their sessions. Supports filtered or exhaustive listing. |
| `createSchedule` | Generates a complete personalised 2-day schedule with keynotes, breaks, and exhibitor recommendations. |

### Special Markers

| Marker | Purpose |
|--------|---------|
| `[INIT_CHAT]` | Sent on first load to trigger the AI greeting with user profile context |
| `[GENERATE_SCHEDULE]` | Triggers client-side schedule generation when detected in AI response |
| `schedule_download` JSON blocks | Intercepted by ChatInterface and rendered as `ViewScheduleButton` |

### Datasets (`/data` directory)

Static JSON files used as the AI's backend — no database required:

- **`seo.json`**: SEO metadata (title, description, keywords, OpenGraph, Twitter Card). Imported by `app/layout.tsx` so all fields are maintained in one place without touching layout code.
- **`Scheduler_System_Prompt.txt`**: Plaintext copy of the core system prompt that dictates the AI's persona, instructions, and behavioural guidelines.
- **`Scheduler_2026_consolidated_sessions.json`**: Master schedule database — hundreds of sessions with `startDateTime`, `title`, `stage`, `presenters`, `track`, and `tags`.
- **`Scheduler_2026_exhibitors.json`**: Exhibitor and sponsor profiles with names, logos, and categorised tags.

## Project Structure

```
app/
  api/
    chat/route.ts      # Chat API — system prompt, tool definitions, streaming
    health/route.ts    # Health check endpoint for Railway readiness probe
  page.tsx             # Home page — server-side session loading
  schedule/page.tsx    # Printable schedule view (reads sessionStorage)
  layout.tsx           # Root layout — fonts, ambient bg, header, SEO metadata
  globals.css          # Tailwind theme, CSS variables, glass-morphism styles
components/
  MainView.tsx         # Phase controller: onboarding → chat → schedule
  ThemeToggle.tsx      # Dark/light toggle — localStorage-persisted, hydration-safe
  Footer.tsx           # Server component footer
  chat/
    ChatInterface.tsx  # AI chat UI — markdown rendering, schedule interception
    ViewScheduleButton.tsx  # sessionStorage schedule handoff to /schedule route
  onboarding/
    OnboardingForm.tsx # 5-step wizard (name, role, location, days, interests)
  scheduler/
    ScheduleView.tsx   # Tabbed in-app schedule display with print support
  ui/                  # shadcn/ui primitives (button, card, form, tabs, etc.)
lib/
  types.ts             # Core TypeScript interfaces (Session, UserProfile, Schedule…)
  data.ts              # Server-side session data loader (reads JSON from disk)
  scheduler.ts         # Schedule generation engine (conflict detection, 5-step pipeline)
  matching.ts          # Tag matching, session scoring, Fisher-Yates shuffle
  ics.ts               # iCalendar (.ics) export generator
  constants.ts         # Event config (dates, job types, interests, networking times)
  utils.ts             # cn() utility — clsx + tailwind-merge
data/
  seo.json                                    # SEO metadata — title, OG, Twitter Card
  Scheduler_2026_consolidated_sessions.json   # Event sessions dataset
  Scheduler_2026_exhibitors.json              # Exhibitor/sponsor profiles
  Scheduler_System_Prompt.txt                 # AI system prompt reference
```

## Conventions

- **Components**: PascalCase filenames and exports; props as TypeScript interfaces with JSDoc `/** */` descriptions
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase interfaces in `lib/types.ts`
- **Client components**: `"use client"` directive at top (omit for server components)
- **Styling**: Tailwind utility classes, `cn()` for conditional merging; glass-morphism utilities prefixed `glass-*`
- **UI components**: shadcn/ui pattern — composable, Radix-based, in `components/ui/`
- **Path aliases**: `@/*` maps to project root
- **Fonts**: Merriweather (`font-serif` / headings), Open Sans (`font-sans` / body), JetBrains Mono (`font-mono` / code)
- **Brand colours**: `#020617` background (dark), `#22d3ee` accent cyan, `#f0f2f5` primary text
