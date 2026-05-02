# Vision

The artistic and philosophical north star for No Stranger Game. This document is curated by Cliff over time; the headers below are the agreed structure.

## Premise

_TBD — Cliff to author._

## Tone & Mood

_TBD — Cliff to author._

## World shape: Districts and Locations

The world is organized into **districts**. Each district contains one or more **locations**.

Today, every in-game location lives inside a single district called the **Forest**. Sub-locations include:

- Forest (the district's home / open ground)
- Silver Lake
- Waterfall
- (more to come)

Future districts (Village, etc.) will be authored as Cliff designs them.

Cross-references:

- Code: [src/components/rpg/constants.ts](../../src/components/rpg/constants.ts) (`locationActions`)
- Quests are tied to locations via `availability.requiresLocation` in [src/components/rpg/quests/branching-quest-template.ts](../../src/components/rpg/quests/branching-quest-template.ts).

## Idle Options — what to do when you have nothing to do

When a player has no active quest and no new content to consume, the game must still feel alive. This section enumerates the idle activities the game offers (and aspires to offer):

- **Chat** — talk in your district's room (Play tab) or the global lobby (Social tab). See _Chat Defaults_ below.
- **Walk the world** — visit other locations within your district to trigger ambient scene actions.
- **Read the chronicle** — open the chronicle dialog from the Character tab to revisit your story.
- **Wait for the next day** — daily skill XP and queued quests unveil at the day rollover.
- _More to come — Cliff to author._

## The Main Quest

The game has (or will have) a special **Main Quest** that is treated and presented differently from side content. It is the spine of the player's journey through No Stranger Game.

Treatment notes (placeholder, Cliff to author):

- Always pinned and visible in the UI when active.
- Distinct visual treatment in the Quests tab.
- Cannot be dismissed or queued behind side quests.
- Drives major world-state and unlock gates.

_Premise / acts / hand-offs from the Forest district — TBD, Cliff to author._

## Chat Defaults

- **Play tab** chat defaults to your **current district** room. Today the only district is the Forest, so this is effectively the Forest room. (Implementation detail: the Play tab actually scopes to your current _location_'s room — see _Future_ below.)
- **Social tab** chat defaults to the **global** room (everyone in the game).
- Both tabs draw from NIP-29 group rooms hosted on a single chat relay so messages do **not** appear on the player's nostr profile feed.
- See: [src/components/rpg/chat/nip29Client.ts](../../src/components/rpg/chat/nip29Client.ts).

### Future

When more districts exist (Village, etc.), the Play tab room should resolve to your **district** room, not your sub-location. Sub-location chat may return as a layered option later.

## Privacy stance

No Stranger Game treats player privacy as a first-class concern.

- Chat must not leak to players' regular nostr profile feeds.
- The game prefers minimum network footprint over rich social telemetry.
- Sensitive future data (DMs, private inventory, friend graphs) should use end-to-end encryption (NIP-44 or NIP-17) wherever feasible.
- See [docs/reports/SECURITY_AUDIT.md](../reports/SECURITY_AUDIT.md) for the standing audit.
