# Chapter Choice Proof Schema

## Goal

Define a deterministic, verifiable event model for Crucial Choices.

## Event Kind

- Use custom regular event kind `7673` for chapter-choice proof records.

## Required Tags

- `["t", "no-stranger-game"]`
- `["chapter", "<chapter-id>"]`
- `["window", "<chapter-window-id>"]`
- `["choice", "A|B|C"]`
- `["prev", "<prior-choice-event-id-or-genesis>"]`
- `["alt", "No Stranger Game crucial choice proof"]`

## Content Payload (JSON)

```json
{
  "app": "no-stranger-game",
  "chapterId": "market-money-001",
  "chapterWindowId": "season-3-day-1",
  "selectedOption": "A",
  "prompt": "You are in a crowded market...",
  "consequence": "You returned the money. Someone noticed.",
  "characterId": "npub-or-local-id",
  "recordedAt": 0
}
```

## Acceptance Rules (Client Canon)

1. Accept at most one canonical choice per author + chapterWindowId.
2. If multiple exist, canonical selection is:
   - earliest `created_at`,
   - then lowest lexical event id as tie-breaker.
3. Later duplicates remain visible as non-canonical but do not mutate character state.

## Local Snapshot

- Keep a local canonical snapshot for fast render:
  - storage key `nsg:chapter-proof:<pubkey-or-local-id>`
  - rebuilt from relays when needed.
