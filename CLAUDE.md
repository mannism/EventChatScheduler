# CLAUDE.md

## Project Overview

AI Conference Assistant — a Next.js 16 demo built for XYZ showcasing AI-powered event assistance capabilities for XyzCon 2026. Uses OpenAI GPT-5.1 via Vercel AI SDK to help attendees discover sessions, get exhibitor info, and generate conflict-free personalized schedules through natural language chat.

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
  api/
    chat/route.ts      # Main chat API — system prompt, tool definitions, streaming
    health/route.ts    # Health check endpoint for Railway readiness probe
  page.tsx             # Home page entry
  schedule/page.tsx    # Printable schedule view (reads sessionStorage)
  layout.tsx           # Root layout with fonts & header
  globals.css          # Tailwind theme, CSS variables, glass-morphism styles
components/
  MainView.tsx         # Phase controller: onboarding → chat → schedule
  ThemeToggle.tsx      # Dark/light theme toggle
  Footer.tsx           # Server component footer
  chat/               # ChatInterface.tsx, ViewScheduleButton.tsx
  onboarding/         # OnboardingForm.tsx (multi-step)
  scheduler/          # ScheduleView.tsx
  ui/                 # shadcn/ui primitives (button, card, form, tabs, etc.)
lib/
  types.ts            # Core TypeScript interfaces
  data.ts             # Session data loader
  scheduler.ts        # Schedule generation (conflict detection, lunch/networking slots)
  matching.ts         # Tag matching, session scoring
  ics.ts              # iCalendar (.ics) export generator
  constants.ts        # Job types, interests, countries
  utils.ts            # cn() utility (clsx + tailwind-merge)
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

- **Components**: PascalCase filenames and exports; props defined as TypeScript interfaces with JSDoc `/** */` descriptions
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase interfaces in `lib/types.ts`
- **Client components**: `"use client"` directive at top
- **Styling**: Tailwind utility classes, `cn()` for conditional merging; glass-morphism utilities prefixed `glass-*`
- **UI components**: shadcn/ui pattern — composable, Radix-based, in `components/ui/`
- **Path aliases**: `@/*` maps to project root
- **Fonts**: Merriweather (`font-serif` / headings), Open Sans (`font-sans` / body), JetBrains Mono (`font-mono` / code)
- **Brand colors**: `#0a0c10` background, `#0069ff` accent blue (`xyz-blue`), `#f0f2f5` primary text
- **TypeScript**: strict mode — no `any` types, no unused locals or params

## Key Patterns

- Tool definitions use Zod schemas for type-safe LLM function calling
- sessionStorage used for large schedule data transfer (avoids URL size limits)
- System messages/directives hidden from user-visible chat
- Glass-morphism dark theme (Diana Ismail inspired) via CSS variables in globals.css

## Developer Rules

### Break Down Large Tasks
- Split large tasks into small, focused subtasks
- Complete and verify each subtask before moving to the next to avoid cascading breakage

### Error Handling
- Wrap every OpenAI API call (and any future external service call) in a `try/catch` block
- Log API failures with relevant metadata (timestamp, status code, endpoint) — **never log PII, user messages, or API keys**
- Return a graceful fallback response when the AI service fails so the app remains usable (e.g., return a 500 with a safe message rather than an unhandled crash)

### User-Facing Errors
- **Never expose `error.message`, stack traces, or internal details to the client**
- Use helpful, non-technical messages: e.g., `"The AI assistant is temporarily unavailable. Please try again in a moment."`

### Input Validation
- Validate all incoming API payloads with Zod schemas — Zod is already used for the onboarding form; extend this discipline to the `/api/chat` route body
- Do **not** bypass ReactMarkdown's XSS protection by using `dangerouslySetInnerHTML` to render AI-generated content

### Secrets Management
- Never hardcode `OPENAI_API_KEY` or any credentials in source files
- All secrets must come from `.env.local`, which is excluded from version control via `.gitignore`
- Do not commit `.env.local` or any file containing real API keys

### Code Quality
- Use descriptive variable and function names; add JSDoc for any non-obvious logic
- Props interfaces must have JSDoc `/** */` descriptions (already enforced in existing components)
- TypeScript strict mode is on — no `any` types, no unused locals or params
- Auth, payment, and data deletion paths require integration tests before merge
- Avoid N+1 queries: audit history must be fetched with a single paginated query

### Testing
- When a test framework is introduced, new features and bug fixes must include unit tests; the AI chat API route and schedule generation logic are the highest-priority paths to cover

### Git Workflow
- **ALWAYS commit to a new branch. NEVER commit directly to `main`.** Only merge to `main` when the user explicitly requests it.
- **Branch naming**: `<type>/<short-description>-v<new-version>` — e.g., `feature/ics-export-v0.1`, `bugfix/scroll-fix-v1.2`
- **Commit message format**: `[v<new-version>] <type>: <what was done>` — e.g., `[v0.1] feature: add iCalendar export to schedule page`

| Type | When to use | Version bump |
|---|---|---|
| `feature/` | New functionality | Minor: `1.0.0 → 1.1.0` |
| `bugfix/` | Bug fixes | Patch: `1.0.0 → 1.0.1` |
| `refactor/` | Code restructuring | Patch: `1.0.0 → 1.0.1` |
| `chore/` | Config, deps, tooling | Patch: `1.0.0 → 1.0.1` |

**Commit after every update (default, unless specifically instructed otherwise):**
1. Bump `package.json` version to the new version number
2. Add an entry to `CHANGELOG.md` under `## [x.y.z] - YYYY-MM-DD`
3. Tag the commit: `git tag v<version>`
4. Update code comments in any changed files to reflect new behaviour
5. Update `README.md` if the change affects usage, setup, features, or configuration

**Examples**
- Branch: `feature/add-dark-mode-v0.1`
- Commit: `[v0.1] feature: add dark mode toggle to settings panel`
---
- Branch: `bugfix/fix-login-redirect-v1.2`
- Commit: `[v1.2] bugfix: fix redirect loop after OAuth login`
