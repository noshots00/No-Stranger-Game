# RPG Reintroduction Slices

This document defines the exact order for layering systems back onto the static facsimile without reintroducing bloat.

## Rules

- One slice per commit.
- Each slice must keep `RPGInterface` focused on composition, not business logic.
- New behavior must be local-first before any network wiring.
- If a slice needs more than 2-3 new files, split it.

## Slice 1: Local UI State

Scope:
- Add a single interaction in `RPGInterface` (for example: selecting one chapter choice).
- Keep data in component state or a tiny local hook in `src/components/rpg/hooks/`.

Definition of done:
- User can click a choice and see deterministic visual feedback.
- No persistence or network calls.

## Slice 2: Local Persistence

Scope:
- Persist one minimal player profile object in local storage.
- Add a small adapter in `src/components/rpg/storage/` with strict types.

Definition of done:
- Refreshing the page restores the profile and selected choice.
- No Nostr events or relay traffic.

## Slice 3: One Gameplay Loop

Scope:
- Add one complete loop: prompt -> choice -> consequence.
- Keep consequence resolution pure and isolated in `src/components/rpg/domain/`.

Definition of done:
- One loop can be completed end-to-end with predictable results.
- Logic covered by existing project checks (`npm test`).

## Slice 4: Optional Nostr Sync

Scope:
- Wire a single publish/query path for the same loop.
- Keep all network behavior in adapters (`src/components/rpg/network/`), not in view components.

Definition of done:
- UI remains fully usable offline/local when Nostr is unavailable.
- Network failures do not block local progression.

