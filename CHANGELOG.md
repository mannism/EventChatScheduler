## [2.3.5](https://github.com/mannism/EventChatScheduler/compare/v2.3.4...v2.3.5) (2026-04-13)

### Bug Fixes

* add security headers to Next.js config ([83931f7](https://github.com/mannism/EventChatScheduler/commit/83931f7e655e9cd39e49aad82957145d061d6944))

## [2.3.4](https://github.com/mannism/EventChatScheduler/compare/v2.3.3...v2.3.4) (2026-03-22)

### Bug Fixes

* merge bugfix/eslint-ajv-conflict — resolve all ESLint/TypeScript errors ([a9b28f8](https://github.com/mannism/EventChatScheduler/commit/a9b28f8f468e024bfcc032fd3907e0334b4b5e76))
* resolve all ESLint and TypeScript strict-mode errors ([bc1c809](https://github.com/mannism/EventChatScheduler/commit/bc1c809e9cea6e21f5acab2e38e48ecd1be4fbc0))

# Changelog

All notable changes to AI Conference Assistant are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — future updates start from `2.0.0`.

---

## [Unreleased]

---

## [2.3.3] - 2026-03-22

### Changed
- Wired up `semantic-release` with full plugin chain (`commit-analyzer`, `release-notes-generator`, `changelog`, `npm`, `git`, `github`)
- Custom commit parser handles `[vX.Y.Z] type:` prefix — compatible with project commit convention
- Updated `.github/workflows/release.yml` to use Node 22 and run `npx semantic-release` on push to `main`
- Added `--ignore-engines` to Dockerfile `npm ci` to suppress EBADENGINE warnings from semantic-release devDependencies
- Updated `CLAUDE.md` git workflow: always use a branch, never commit directly to `main`

---

## [2.3.2] - 2026-03-22

### Changed
- `CLAUDE.md` — updated Developer Rules: added "Break Down Large Tasks" section; updated Code Quality rules (JSDoc, no `any`, integration test requirement, N+1 query rule); updated Git Workflow to use `<new-version>` in branch/commit naming; removed stale note about manual test scripts

---

## [2.3.1] - 2026-03-22

### Added
- `.github/workflows/ci.yml` — CI workflow: runs typecheck, lint, and production build on every push to `main` and every pull request
- `.github/workflows/release.yml` — Release workflow: automatically creates a GitHub Release with CHANGELOG notes whenever a `v*` tag is pushed

---

## [2.3.0] - 2026-03-22

### Fixed
- `Dockerfile` — updated all `ENV key value` to `ENV key=value` format (resolves 5× `LegacyKeyValueFormat` build warnings); removed stale comment on builder stage
- `package.json` — removed unused `semantic-release`, `@semantic-release/changelog`, `@semantic-release/git`, `@semantic-release/github` devDependencies (required Node 22+, caused `EBADENGINE` warnings on Node 20)
- `package.json` — downgraded `eslint` from `^10` to `^9` to match peer requirements of `eslint-config-next` and bundled plugins (resolves 4× `ERESOLVE` peer conflict warnings)

---

## [2.2.9] - 2026-03-22

### Added
- `app/api/health/route.ts` — GET `/api/health` endpoint returning `{ status: "ok" }` for Railway readiness probes
- `package.json` — `engines` field specifying `node >=20.0.0` to match Dockerfile base image

### Fixed
- `app/api/chat/route.ts` — error handler no longer returns `error.message` to clients; replaced with safe generic message per security guidelines
- `Dockerfile` — `mkdir .next` → `mkdir -p .next` (idempotent, safe if directory exists)
- `README.md`, `CLAUDE.md` — removed stale references to deleted files (`StatusBadge.tsx`, `lib/openai.ts`); added `app/api/health/route.ts` to project structure; updated version to v2.2.8

---

## [2.2.8] - 2026-03-22

### Removed
- `app/favicon-16x16.png`, `app/favicon-32x32.png`, `app/favicon-48x48.png`, `app/favicon-512x512.png`, `app/apple-touch-icon.png.png`, `app/android-chrome-192x192.png` — duplicate files not auto-served by Next.js App Router; canonical copies live in `public/`

---

## [2.2.7] - 2026-03-22

### Removed
- `components/StatusBadge.tsx` — component was removed from layout in v2.2.5 but file remained
- `components/ui/checkbox.tsx`, `components/ui/scroll-area.tsx` — unused shadcn primitives
- `lib/openai.ts` — redundant OpenAI wrapper; chat route uses `@ai-sdk/openai` directly
- `lib/data.ts` — removed unused `getSessionById()` and `getUniqueTags()` exports
- `data/Scheduler_2026_consolidated_sessions-old.json` — stale backup data file
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` — Next.js boilerplate SVGs never referenced
- 26 root-level test and simulation scripts (`test_*.js`, `test_*.ts`, `simulate_usechat.js`) — manual scripts with no test runner configured

### Fixed
- `app/layout.tsx` — corrected stale JSDoc comment referencing removed StatusBadge

---

## [2.2.6] - 2026-03-22

### Fixed
- `app/layout.tsx` — added `icons` metadata field declaring all favicon sizes (16×16, 32×32, 48×48, 512×512, apple-touch-icon, android-chrome-192×192)
- `public/` — copied all PNG favicon files from `app/` to `public/` so they are URL-accessible; fixed `apple-touch-icon.png.png` double extension → `apple-touch-icon.png`

### Changed
- `data/seo.json` — updated title, description, and keywords for better SEO

---

## [2.2.5] - 2026-03-22

### Changed
- `app/layout.tsx` — removed `StatusBadge` ("AI Conference Assistant online"); header inner content now constrained to `max-w-5xl mx-auto` (1024px) matching footer; badge font `text-xs` → `text-sm`
- `components/Footer.tsx` — `container mx-auto px-4` → `max-w-5xl mx-auto px-6 md:px-8` to align with header; removed `mt-20` margin

---

## [2.2.4] - 2026-03-22

### Changed
- `app/layout.tsx` — "← Labs by Diana" plain link replaced with pill badge `← // LABS by Diana`; rounded-full border, font-mono, hover cyan accent, links to `https://labs.dianaismail.me/`
- `components/Footer.tsx` — removed "Return to portfolio" link and `ArrowUpRight` import; copyright moved to right-aligned

---

## [2.2.3] - 2026-03-22

### Fixed
- `components/chat/ChatInterface.tsx` — send button gradient `from-cyan-600 to-blue-600` → `from-cyan-700 to-blue-700`; white icon on cyan-600 = 3.68:1 (marginal) → cyan-700 = 5.36:1 ✅, blue-700 = 6.70:1 ✅; focus ring tightened with `ring-offset-2` for clear keyboard visibility

---

## [2.2.2] - 2026-03-22

### Fixed (WCAG AA — 7 failures)
- `globals.css` (.light) — `--primary`, `--accent`, `--ring`, `--sidebar-primary`, `--diana-accent` bumped from cyan-600 (#0891b2) to cyan-700 (#0e7490); white-on-cyan-600 = 3.68:1 ❌ → white-on-cyan-700 = 5.36:1 ✅; fixes `ViewScheduleButton` `bg-primary` button in light mode
- `OnboardingForm.tsx` — CTA button `from-cyan-600` → `from-cyan-700`; white text contrast 3.68:1 ❌ → 5.36:1 ✅
- `ScheduleView.tsx` — Print button `from-cyan-600` → `from-cyan-700`; same fix
- `schedule/page.tsx` — date heading `text-sky-600` → `text-sky-700`; sky-600 on white = 4.10:1 ❌ → sky-700 = 5.93:1 ✅
- `schedule/page.tsx` — "Add to Calendar" `bg-sky-600` → `bg-sky-700`; white on sky-600 = 4.10:1 ❌ → sky-700 = 5.93:1 ✅
- `schedule/page.tsx` — Print button focus ring `ring-blue-100` → `ring-blue-700 ring-offset-2`; ring-blue-100 on slate-50 = 1.1:1 ❌ (invisible) → visible ✅
- `schedule/page.tsx` — Calendar button focus ring `ring-sky-100` → `ring-sky-700 ring-offset-2`; same invisible ring fix ✅

---

## [2.2.1] - 2026-03-22

### Changed
- `components/MainView.tsx` — hero heading updated to "AI Conference Assistant (Demo)"
- `components/chat/ChatInterface.tsx` — chat header updated to "AI Conference Assistant (demo)"; fixed typo "Converence" → "Conference"

### Added
- App icon assets: `app/favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-512x512.png`, `android-chrome-192x192.png`, `apple-touch-icon.png.png`

---

## [2.2.0] - 2026-03-22

### Added
- `data/seo.json` — centralised SEO configuration file: title, description, keywords, author, siteUrl, siteName, twitterHandle, and full OpenGraph + Twitter Card fields; single source of truth for all metadata
- `app/layout.tsx` — full Next.js `Metadata` object now driven by `seo.json`: openGraph type/locale/url/siteName/images, Twitter `summary_large_image` card, robots index+follow, `metadataBase`, `alternates.canonical`
- `README.md` — updated to v2.2: added ThemeToggle, Footer, and dark/light theme sections; added `seo.json` to datasets; updated project structure tree; WCAG AA note; brand colour update

### Validated
- TypeScript strict-mode check (`tsc --noEmit`) passes with zero errors across all source files
- All components (`MainView`, `ChatInterface`, `OnboardingForm`, `ScheduleView`, `ThemeToggle`, `StatusBadge`, `Footer`) carry JSDoc file-level comments

---

## [2.1.5] - 2026-03-20

### Added
- `components/Footer.tsx` — site footer matching `labs.dianaismail.me`: copyright line left, "Return to portfolio" link with `ArrowUpRight` icon right; `font-mono`, `text-muted-foreground`, `hover:text-cyan-600 dark:hover:text-cyan-400`, `border-t border-slate-200 dark:border-white/[0.08]`
- `app/layout.tsx` — imported and rendered `<Footer />` below `{children}`

---

## [2.1.4] - 2026-03-20

### Fixed
- `components/scheduler/ScheduleView.tsx` — Print button gradient `from-cyan-500→from-cyan-600`; white text on cyan-500 = 2.43:1 (❌ WCAG 1.4.11) → 3.68:1 (✅)
- `components/onboarding/OnboardingForm.tsx` — CTA "Continue/Start" button gradient `from-cyan-500→from-cyan-600` (same fix); active step dot `bg-cyan-500→bg-cyan-600` (2.43:1→3.68:1 ✅); progress bar `from-cyan-500→from-cyan-600`; tag remove × button hover `red-400→red-600` in light mode (2.66:1→4.64:1 ✅)

---

## [2.1.3] - 2026-03-20

### Fixed
- `components/chat/ChatInterface.tsx` — send button gradient stepped up from `from-cyan-500 to-blue-500` to `from-cyan-600 to-blue-600`; white icon on cyan-500 averaged ~2.92:1 (failed WCAG 1.4.11 non-text 3:1), now averages ~4.3:1 (✅)

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
