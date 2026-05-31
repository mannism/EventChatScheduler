@AGENTS.md

# Claude Code notes — EventChatScheduler

Scope rule: if a session starts from this repo, work only on this project. Do not touch other repos unless the Owner explicitly says otherwise.

Fleet rules: `~/.claude/CLAUDE.md`. Orchestration scope: `/Users/mann/Documents/Claude/CLAUDE.md`.

## Persona pointers

- **Sable** — `/api/chat` route, OpenAI/Vercel-AI plumbing, security headers, deployment
- **Nix** — frontend (App Router pages, components, shadcn/ui, Framer Motion)
- **Quinn** — pre-release smoke tests, OWASP checklist
- **Reid** — system prompt content (voice, brand framing)

## Relevant skills

- `/brief` — required for any change touching more than 2 files
- `/hygiene` — periodic audit of orphans, manifest drift
