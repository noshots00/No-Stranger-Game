---
name: nostr-comments
description: Implement Nostr comment systems (NIP-22 / kind 1111) — UI components were removed from this repo as unused legacy.
---

# Nostr comments

The **`CommentsSection` / `CommentForm` / related hooks were removed** from this repository as part of legacy cleanup (they were not wired into any route). NIP-22 (kind **1111**) comment behavior is still valid Nostr — re-add when a feature needs it.

## If you need comments in this project

1. **Restore from git history**: e.g. `git log --all --full-history -- src/components/comments/` and `src/hooks/useComments.ts`, `usePostComment.ts`.
2. **Or implement fresh**: follow NIP-22 for roots (`e`, `k`, `a`, `r`, `i`, `t` tags), query/publish with `useNostr` + `useNostrPublish`, and build UI with existing `@/components/ui` primitives.

## Do not assume

- Do not import `@/components/comments/CommentsSection` — paths do not exist until restored or re-added.
