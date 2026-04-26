# Echoes Functional Spec (Kind 1 Absorption)

## Purpose

Turn a player's recent kind 1 notes into in-game rumor flavor so the world feels personally reflective without requiring new posting behavior.

## Product Promise

- No extra UI action required by player.
- No auto-posting or external publication.
- Personalization appears in Events and Main Quest flavor text only.

## Inputs

- Current user pubkey.
- Recent kind 1 notes authored by that pubkey.

## Query Scope

- Kind: `1`
- Authors: `[currentUserPubkey]`
- Time window: last 7 days
- Hard cap: 50 notes

## Processing Pipeline

1. Normalize text:
   - trim whitespace
   - remove URLs
   - split into sentences and phrases
2. Candidate extraction:
   - noun-like tokens (capitalized words, multi-word phrases)
   - hashtag terms (`#library`, `#oasis`)
   - quoted phrases
3. Safety filters:
   - remove obvious secrets (nsec-like strings, bech32 secrets)
   - remove likely PII patterns (emails, phone-like patterns)
   - remove tokens < 3 chars and common stop words
4. Scoring:
   - recency weight (newer text gets higher weight)
   - frequency weight (repeat mentions increase score)
   - diversity bonus (terms from multiple notes favored)
5. Rumor seed generation:
   - top 3 scored candidates become rumor seeds
   - each seed mapped to one short narrative line

## Outputs

- `echoes.rumorSeeds: string[]`
- `echoes.eventsFlavorLines: string[]`
- `echoes.mainQuestFlavorLine?: string`

## UI Insertion Points

1. Events tab (`/game` Home -> Events):
   - Insert 1-2 lines under daily events text:
     - "A trader whispers about <seed>."
2. Main Quest tab:
   - Add one contextual flavor line before choice options:
     - "The crowd murmurs a familiar word: <seed>."

## Data Storage

Local first:

- Persist in local storage with TTL:
  - key: `nsg:echoes:<pubkey>`
  - payload:
    - generatedAt
    - seeds
    - flavorLines

TTL:

- Regenerate every 24h or when player has posted new notes since `generatedAt`.

## Failure Behavior

- If no notes found:
  - render default generic rumor lines.
- If extraction yields no safe tokens:
  - render default generic rumor lines.

## Telemetry (local counters for now)

- `echoes_generated_count`
- `echoes_seed_count`
- `echoes_used_in_events`
- `echoes_used_in_main_quest`

## Non-Goals (v1)

- No LLM generation required.
- No cross-player note ingestion.
- No irreversible state effects from echoes in v1.
