---
name: ai-chat
description: Build AI-powered chat interfaces or integrate with Shakespeare AI (hook not currently in repo).
---

# AI / Shakespeare integration

The **`useShakespeare` hook was removed** from this repository as part of legacy cleanup (it was unused). The patterns below are **reference only** until a hook or client is reintroduced.

## If you need Shakespeare AI in this project

1. **Restore from git history**: `git log --all --full-history -- src/hooks/useShakespeare.ts` then check out the file from a commit before removal.
2. **Or implement fresh**: use `fetch` (or TanStack Query) against the Shakespeare API with whatever auth headers the API expects, and wire it to React state. Prefer colocating types next to the new module.

## When this skill applies

- User asks for AI chat UI, streaming completions, or Shakespeare AI specifically.
- After restoring or adding a client, update this skill with the real import paths and API surface.

## Do not assume

- Do not import `@/hooks/useShakespeare` — it does not exist until restored or re-added.
