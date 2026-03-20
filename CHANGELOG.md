# Changelog

All notable changes to XyzCon EventChatScheduler are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — future updates start from `2.0.0`.

---

## [Unreleased]

---

## [2.1.2] - 2026-03-20

### Changed
- `components/chat/ChatInterface.tsx` — replaced icon-only Restart button with plain text "Restart"; removed unused `UserPen` import

---

## [2.1.1] - 2026-03-20

### Changed
- `components/chat/ChatInterface.tsx` — renamed "Edit Profile" button tooltip and aria-label to "Restart"

---

## [2.1.0] - 2026-03-20

### Added
- `components/ThemeToggle.tsx` — client-side dark/light toggle; reads/writes `localStorage`, toggles `.dark`/`.light` class on `<html>`, moon/sun icons, `focus-visible:ring-4` for keyboard accessibility

### Changed
- `app/globals.css` — replaced `#0069ff` accent with `#22d3ee` (cyan-400); background updated to `slate-950`/`slate-900`; added `.light` class override block (white-glass bg, black-opacity borders matching labs.dianaismail.me); added `.glass-card` utility; `--color-xyz-blue` remapped to cyan
- `app/layout.tsx` — simplified header to single `"← Labs by Diana"` link; added `ThemeToggle`; header uses `bg-slate-50/80 dark:bg-slate-950/80` conditional classes; ambient blobs updated to cyan/violet
- `components/MainView.tsx` — added hero section ("AI-powered conference assistant") with Framer Motion fade-in; phase transitions wrapped in `AnimatePresence mode="wait"`
- `components/chat/ChatInterface.tsx` — `glass-card` surface, `motion.div whileHover`, cyan accent throughout, gradient send button, light/dark-aware borders and bubbles
- `components/onboarding/OnboardingForm.tsx` — `glass-card` surface, Framer Motion entry, gradient CTA button (`from-cyan-500 to-blue-500`), all `xyz-blue` refs replaced with cyan
- `components/scheduler/ScheduleView.tsx` — `glass-card` surface, Framer Motion entry + `whileHover` per session row, cyan tabs/tags/icons
- `components/StatusBadge.tsx` — glassmorphic pill (`bg-white/80 dark:bg-slate-900/50`), `role="status"` ARIA label, online dot updated to cyan

### Fixed
- WCAG AA contrast: all `text-cyan-400` (1.73:1 on white) replaced with `text-cyan-700 dark:text-cyan-400` (5.13:1) across MainView, ChatInterface, OnboardingForm, ScheduleView
- Track badge `text-cyan-300` (1.25:1) → `text-cyan-700` in light mode
- ThemeToggle placeholder icon `text-slate-400` (2.51:1) → `text-slate-500` (4.69:1)
- StatusBadge dots: `bg-cyan-600`/`bg-red-600` in light for WCAG 1.4.11 non-text contrast (≥3:1)

---

## [2.0.0] - 2026-03-20

This is the baseline release. All work prior to this version is captured below as project history.

### Added
- `lib/matching.ts` — shared tag matching (exact + word-boundary regex), multi-factor session scoring (+3 interest, +2 region, +1 metadata, +1 job affinity), and Fisher-Yates shuffle
- `lib/ics.ts` — standards-compliant iCalendar (`.ics`) export generator; "Add to Calendar" button on the schedule print page
- `lib/constants.ts` — centralised event config: dates, networking times, lunch slot options, job type tag affinity map
- `getPresenters` LLM tool in `app/api/chat/route.ts` — look up presenters and their sessions by name or interest filter
- `components/StatusBadge.tsx` — real-time online/offline status indicator via `navigator.onLine` API
- `Dockerfile` + `.dockerignore` — multi-stage Docker build (`node:20-alpine`) with Next.js standalone output
- `CLAUDE.md` — full project instructions with tech stack, architecture, conventions, key patterns, and developer rules
- Developer rules covering error handling, user-facing errors, input validation, secrets management, code quality, testing, and git workflow
- `CHANGELOG.md` — this file

### Changed
- `app/api/chat/route.ts` — modular 4-tool architecture (`searchSessions`, `getExhibitors`, `getPresenters`, `createSchedule`), keynote pre-loading into system prompt, `shuffleEqualScores()` for result variety, improved date/relevance filtering
- `lib/scheduler.ts` — refactored to use `matching.ts` utilities; 5-step generation pipeline with JSDoc; improved lunch slot fallback and conflict detection
- `app/schedule/page.tsx` — unique timestamped `sessionStorage` keys to support multiple open schedule tabs; legacy key fallback for backwards compatibility
- `components/chat/ViewScheduleButton.tsx` — updated to use timestamped unique storage keys
- `components/chat/ChatInterface.tsx` — three-tier auto-scroll strategy, improved loading states (bouncing dots / pulsing indicator), `[INIT_CHAT]` / `[GENERATE_SCHEDULE]` directive filtering
- `app/layout.tsx` — glass-morphism dark theme; fixed glassmorphic header; animated ambient background gradients; three Google Fonts (Merriweather, Open Sans, JetBrains Mono)
- `app/globals.css` — full dark theme: brand colour CSS variables (`#0a0c10`, `#0069ff`, `#f0f2f5`), glass-morphism utility classes, grid overlay pattern
- `data/Scheduler_2026_consolidated_sessions.json` — session data refresh
- `data/Scheduler_System_Prompt.txt` — expanded with updated persona, voice, audience, and scheduling behavioural rules
- `README.md` — full rewrite: tech stack table, LLM tools table, special markers table, iCal export, project structure with per-file descriptions
- JSDoc file-level and inline comments added across all source files (`lib/types.ts`, `lib/data.ts`, `lib/openai.ts`, `lib/utils.ts`, `lib/scheduler.ts`, `lib/matching.ts`, `components/MainView.tsx`, `components/onboarding/OnboardingForm.tsx`, `components/scheduler/ScheduleView.tsx`, `components/chat/ChatInterface.tsx`, `app/layout.tsx`, `app/page.tsx`)

### Project History (pre-2.0.0)
| Version | Date | Summary |
|---|---|---|
| `0.0.1` | 2026-02-24 | Initial working POC — onboarding, chat, schedule generation, print view |
| `0.0.2` | 2026-02-27 | Inline comment updates |
| `0.0.3` | 2026-03-08 | StatusBadge, Dockerfile, glass-morphism theme |
| `0.0.4` | 2026-03-09 | JSDoc comments, README rewrite, data refresh |
| `0.0.5` | 2026-03-11 | Refactor v2.0 — matching.ts, ics.ts, getPresenters, iCal export |
| `0.0.6` | 2026-03-18 | CLAUDE.md developer rules (initial) |
| `0.1.0` | 2026-03-20 | CLAUDE.md developer rules expanded (conventions, git workflow) |
