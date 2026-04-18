# PR Comprehension Gate

Before merging any PR — especially agent-generated code — the reviewer must answer these questions. Unanswered questions block merge.

## Core Questions (required on every PR)

1. **What does this change do in one sentence?**
2. **What fails silently?** — Identify swallowed errors, empty catches, fire-and-forget patterns
3. **What's the blast radius?** — If this code has a bug, what else breaks?

## Application

- Agent-generated PRs: include answers in the PR description
- Format: numbered list matching the questions above
