# XyzCon EventChatScheduler-poc v2.0

XyzCon EventChatScheduler-poc is a Next.js 16 web application designed to act as a highly intelligent, personalized AI companion for conference attendees. It leverages generative AI to help users navigate their event schedule, search for relevant sessions, and dynamically generate conflict-free customized itineraries through natural language chat.

The AI Chat scheduler uses the json files as dataset. **The `data` folder is included in the repository to serve as sample event data so you can test and experiment with the AI scheduler out of the box.**

## Key Features

- **Conversational AI Interface**: Powered by the Vercel AI SDK and OpenAI GPT-5.1, attendees can ask questions about the event, find keynote speakers, or discover specific themes like "Partner & Community" sessions.
- **Dynamic Tool Execution**: The chatbot uses background tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`) to retrieve precise JSON event data and seamlessly integrate it into the conversation context.
- **Interactive Schedule Generation**: The AI can build a comprehensive, automated daily schedule mapping back-to-back sessions against the user's specific attendance days and thematic interests — complete with conflict detection and a 5-minute buffer between sessions.
- **Printable HTML Schedule Tab**: Generates a massive JSON payload of the user's itinerary, safely passes it via `sessionStorage`, and opens an elegant Next.js `/schedule` route optimized for printing in landscape format (without arbitrary API sizing limits).
- **iCalendar Export**: One-click "Add to Calendar" button generates a standards-compliant `.ics` file for import into Google Calendar, Apple Calendar, Outlook, and other calendar apps.
- **Smart Session Scoring**: Sessions are ranked by a multi-factor relevance algorithm — interest tag matches (+3), region affinity (+2), external speaker metadata (+1), and job-type tag affinity (+1).
- **Responsive Branding UI**: The interface uses Tailwind CSS, Lucide icons, and modern glass-morphism techniques to reflect a **sleek, dark-theme aesthetic** inspired by the Diana Ismail Digital Twin project. Includes dynamic ambient backgrounds, grid overlays, and responsive mobile layouts for an "agent-first" experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 (strict mode) |
| **AI** | Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6 |
| **UI** | Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Framer Motion |
| **Forms** | React Hook Form + Zod validation |
| **Deployment** | Docker (multi-stage, `node:20-alpine`), standalone output mode |

## Getting Started

First, install the module dependencies:

```bash
npm install
```

### Environment Configuration
Create a `.env.local` file in the root directory of the project. You must include the following variables for the application to function correctly:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL="gpt-5.1" # or your preferred model
MAX_SESSIONS_PER_DAY=8
MAX_EXHIBITORS_PER_DAY=10
```
- **`OPENAI_API_KEY`**: Required to authenticate with the OpenAI API for the conversational interface.
- **`OPENAI_MODEL`**: The specific model to be used by the Vercel AI SDK (e.g., `gpt-5.1`, `gpt-4o`).
- **`MAX_SESSIONS_PER_DAY`**: The maximum number of personalized sessions to recommend per user attendance day in the automated schedule.
- **`MAX_EXHIBITORS_PER_DAY`**: The maximum number of relevant exhibitors to recommend per user attendance day in the automated schedule.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.

### Available Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

### Running with Docker

The application includes an optimized multi-stage `Dockerfile` to build a lightweight Next.js standalone image.

Build the Docker image:

```bash
docker build -t eventchatscheduler-poc .
```

Run the Docker container (ensuring you pass the required environment variables):

```bash
docker run -p 3000:3000 --env-file .env.local eventchatscheduler-poc
```

## Architecture & Application Flow

```
Onboarding (5-step form) → Chat (AI conversation + tools) → Schedule (printable view)
```

**State management**: React hooks only — no global store. `localStorage` persists user profile and phase across reloads. `sessionStorage` transfers large schedule payloads to the print view.

### Core Modules

- **`app/api/chat/route.ts`** — The core API router driving stream completions and OpenAI tool calling. Contains a highly engineered system prompt that orchestrates LLM behavior, defines 4 tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`), and enforces strict JSON formatting rules so the AI behaves predictably as a digital concierge.

- **`components/chat/ChatInterface.tsx`** — Renders the conversation UI. Intelligently intercepts Markdown payloads (specifically JSON code blocks marked as `schedule_download`) to dynamically spawn the `ViewScheduleButton` component instead of rendering raw text. Implements a three-tier auto-scrolling system: snap-to-bottom on user messages, gentle 120px nudge on AI responses, and continuous scroll during loading.

- **`components/MainView.tsx`** — Phase controller that orchestrates the three main views (onboarding → chat → schedule). Persists user profile and current phase to `localStorage` so returning users skip onboarding.

- **`components/onboarding/OnboardingForm.tsx`** — Multi-step wizard collecting user profile data across 5 steps (name, role, location, attendance days, interests) with per-step Zod validation.

- **`components/StatusBadge.tsx`** — Client-side component leveraging the `navigator.onLine` API to provide real-time connection status feedback in the persistent glassmorphic header.

- **`app/schedule/page.tsx`** — Dedicated standalone route that reads cached schedule data from `sessionStorage` and renders a landscape-oriented HTML table for printing. Includes an iCalendar export button for adding sessions to calendar apps.

- **`lib/scheduler.ts`** — Client-side schedule generation engine with a 5-step pipeline: mandatory keynotes → fixed networking → lunch placement → App Spotlight demos → personalized backfill by interest score.

- **`lib/matching.ts`** — Shared utilities for tag matching (exact + word-boundary regex), multi-factor session scoring, and Fisher-Yates shuffling. Used by both the API route and the client-side scheduler.

- **`lib/ics.ts`** — Generates standards-compliant iCalendar (`.ics`) files from the API schedule format for import into calendar applications.

### LLM Tools

| Tool | Description |
|------|-------------|
| `searchSessions` | Search sessions by track, tags, date, or presenter. Returns scored, non-clashing results. |
| `getExhibitors` | Look up exhibitors/sponsors by name or interest tags. Ranked by relevance to user profile. |
| `getPresenters` | Find presenters and their sessions. Supports filtered or exhaustive listing. |
| `createSchedule` | Generates a complete personalized 2-day schedule with keynotes, breaks, and exhibitor recommendations. |

### Special Markers

| Marker | Purpose |
|--------|---------|
| `[INIT_CHAT]` | Sent on first load to trigger the AI greeting with user profile context |
| `[GENERATE_SCHEDULE]` | Triggers client-side schedule generation when detected in AI response |
| `schedule_download` JSON blocks | Intercepted by ChatInterface and rendered as `ViewScheduleButton` |

### Datasets (`/data` directory)
The application avoids traditional relational databases by using static JSON files to feed the LLM's background tools. These are included as sample data in the repository:
- **`Scheduler_System_Prompt.txt`**: A plaintext copy of the core system prompt that dictates the persona, strict instructions, conversational flow, and behavioral guidelines for the AI assistant. While the operational prompt is located in `route.ts`, this file serves as an accessible reference document.
- **`Scheduler_2026_consolidated_sessions.json`**: Acts as the master schedule database. It contains hundreds of pre-configured event sessions, complete with properties like `startDateTime`, `title`, `stage`, `presenters`, `track`, and `tags`. The AI queries this dataset heavily to build its personalized itineraries.
- **`Scheduler_2026_exhibitors.json`**: An array of exhibitor and sponsor profiles containing names, logos, and relevant categorized tags. It is utilized by the `getExhibitors` tool when the AI needs to recommend specific vendor booths aligned to the user's interests.

## Project Structure

```
app/
  api/chat/route.ts    # Main chat API — system prompt, tool definitions, streaming
  page.tsx             # Home page — server-side session loading
  schedule/page.tsx    # Printable schedule view (reads sessionStorage)
  layout.tsx           # Root layout — fonts, ambient background, glassmorphic header
  globals.css          # Tailwind theme, CSS variables, glass-morphism styles
components/
  MainView.tsx         # Phase controller: onboarding → chat → schedule
  StatusBadge.tsx      # Online/offline status indicator (navigator.onLine)
  chat/
    ChatInterface.tsx  # AI chat UI with markdown rendering and schedule interception
    ViewScheduleButton.tsx  # sessionStorage-based schedule handoff to /schedule route
  onboarding/
    OnboardingForm.tsx # 5-step wizard (name, role, location, days, interests)
  scheduler/
    ScheduleView.tsx   # In-app tabbed schedule display with print support
  ui/                  # shadcn/ui primitives (button, card, form, tabs, etc.)
lib/
  types.ts             # Core TypeScript interfaces (Session, UserProfile, Schedule, etc.)
  data.ts              # Server-side session data loader (reads JSON from disk)
  scheduler.ts         # Schedule generation engine (conflict detection, 5-step pipeline)
  matching.ts          # Tag matching, session scoring, Fisher-Yates shuffle
  ics.ts               # iCalendar (.ics) export generator
  constants.ts         # Event config (dates, job types, interests, networking times)
  utils.ts             # cn() utility — clsx + tailwind-merge
  openai.ts            # OpenAI SDK v6 singleton wrapper
data/
  Scheduler_2026_consolidated_sessions.json   # Event sessions dataset
  Scheduler_2026_exhibitors.json              # Exhibitor/sponsor profiles
  Scheduler_System_Prompt.txt                 # AI system prompt reference
```

## Conventions

- **Components**: PascalCase filenames and exports
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase interfaces in `lib/types.ts`
- **Client components**: `"use client"` directive at top
- **Styling**: Tailwind utility classes, `cn()` for conditional merging
- **UI components**: shadcn/ui pattern — composable, Radix-based, in `components/ui/`
- **Path aliases**: `@/*` maps to project root
