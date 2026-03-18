# CLAUDE.md

## Project Overview

XyzCon EventChatScheduler — a Next.js 16 AI-powered conference assistant POC. Uses OpenAI GPT-5.1 via Vercel AI SDK to help attendees discover sessions, get exhibitor info, and generate conflict-free personalized schedules through natural language chat.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`), OpenAI SDK v6
- **UI**: Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Docker (multi-stage, node:20-alpine), standalone output mode

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Environment Variables (.env.local)

- `OPENAI_API_KEY` — Required
- `OPENAI_MODEL` — Model ID (default: gpt-5.1)
- `MAX_SESSIONS_PER_DAY` — Schedule cap per day
- `MAX_EXHIBITORS_PER_DAY` — Exhibitor recommendations cap

## Project Structure

```
app/
  api/chat/route.ts    # Main chat API — system prompt, tool definitions, streaming
  page.tsx             # Home page entry
  schedule/page.tsx    # Printable schedule view (reads sessionStorage)
  layout.tsx           # Root layout with fonts & header
  globals.css          # Tailwind theme, CSS variables, glass-morphism styles
components/
  MainView.tsx         # Phase controller: onboarding → chat → schedule
  StatusBadge.tsx      # Online/offline indicator
  chat/               # ChatInterface.tsx, ViewScheduleButton.tsx
  onboarding/         # OnboardingForm.tsx (multi-step)
  scheduler/          # ScheduleView.tsx
  ui/                 # shadcn/ui primitives (button, card, form, tabs, etc.)
lib/
  types.ts            # Core TypeScript interfaces
  data.ts             # Session data loader
  scheduler.ts        # Schedule generation (conflict detection, lunch/networking slots)
  constants.ts        # Job types, interests, countries
  utils.ts            # cn() utility (clsx + tailwind-merge)
  openai.ts           # OpenAI SDK wrapper
data/
  Scheduler_2026_consolidated_sessions.json   # Event sessions
  Scheduler_2026_exhibitors.json              # Exhibitor/sponsor data
  Scheduler_System_Prompt.txt                 # AI system prompt
```

## Architecture

**App flow**: Onboarding (multi-step form) → Chat (AI conversation) → Schedule (printable view)

**State management**: React hooks only — no global store. Cross-tab data via sessionStorage.

**API route** (`app/api/chat/route.ts`): Core logic hub — loads system prompt, builds user context from profile, defines 4 LLM tools (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`), streams responses via `streamText()`.

**Schedule logic** (`lib/scheduler.ts`): Conflict-free session selection with mandatory keynotes, fixed networking/lunch blocks, exhibitor mixing by user interests.

**Special markers**: `[INIT_CHAT]` triggers greeting, `[GENERATE_SCHEDULE]` triggers schedule creation, `schedule_download` JSON blocks render ViewScheduleButton in chat.

## Conventions

- **Components**: PascalCase filenames and exports
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase interfaces in `lib/types.ts`
- **Client components**: `"use client"` directive at top
- **Styling**: Tailwind utility classes, `cn()` for conditional merging
- **UI components**: shadcn/ui pattern — composable, Radix-based, in `components/ui/`
- **Path aliases**: `@/*` maps to project root

## Key Patterns

- Tool definitions use Zod schemas for type-safe LLM function calling
- sessionStorage used for large schedule data transfer (avoids URL size limits)
- System messages/directives hidden from user-visible chat
- Glass-morphism dark theme (Diana Ismail inspired) via CSS variables in globals.css
- No test framework configured — manual test scripts in root (test_*.js)

## Developer Rules

### Error Handling
- Wrap every OpenAI API call (and any future external service call) in a `try/catch` block
- Log API failures with relevant metadata (timestamp, status code, endpoint) — **never log PII, user messages, or API keys**
- Return a graceful fallback response when the AI service fails so the app remains usable (e.g., return a 500 with a safe message rather than an unhandled crash)

### User-Facing Errors
- **Never expose `error.message`, stack traces, or internal details to the client** — the current `route.ts` returns `error.message` directly, which should be replaced with a generic safe message
- Use helpful, non-technical messages: e.g., `"The AI assistant is temporarily unavailable. Please try again in a moment."`

### Input Validation
- Validate all incoming API payloads with Zod schemas — Zod is already used for the onboarding form; extend this discipline to the `/api/chat` route body
- Do **not** bypass ReactMarkdown's XSS protection by using `dangerouslySetInnerHTML` to render AI-generated content

### Secrets Management
- Never hardcode `OPENAI_API_KEY` or any credentials in source files
- All secrets must come from `.env.local`, which is excluded from version control via `.gitignore`
- Do not commit `.env.local` or any file containing real API keys

### Code Quality
- Add JSDoc block comments to all complex business logic — especially in `lib/scheduler.ts`, `lib/matching.ts`, and `app/api/chat/route.ts`
- Use descriptive variable and function names; avoid single-letter identifiers outside of array `.map()` / `.filter()` loops

### Testing
- No test framework is currently configured — `test_*.js` manual scripts exist in the project root
- When a test framework is introduced, new features and bug fixes must include unit tests; the AI chat API route and schedule generation logic are the highest-priority paths to cover

### Git Workflow
- Break large tasks into small, focused subtasks and commit each as a checkpoint before moving to the next
- **Branch naming**: `<type>/<short-description>-v<version>` — e.g., `feature/ics-export-v0.1`, `bugfix/scroll-fix-v1.2`
- **Branch types**: `feature/` (new functionality), `bugfix/` (bug fixes), `refactor/` (restructuring), `chore/` (config/deps/tooling)
- **Commit message format**: `[v<version>] <type>: <what was done>` — e.g., `[v0.1] feature: add iCalendar export to schedule page`
