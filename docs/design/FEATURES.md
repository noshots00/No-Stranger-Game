# Features

A running inventory of every feature in No Stranger Game. One section per feature; headers and short cross-links only — Cliff fills in design intent over time.

## Quests

- Branching, choice-driven scenes; written in TypeScript per quest file.
- Engine: [src/components/rpg/quests/engine.ts](../../src/components/rpg/quests/engine.ts).
- Registry: [src/components/rpg/quests/registry.ts](../../src/components/rpg/quests/registry.ts).
- Template: [src/components/rpg/quests/branching-quest-template.ts](../../src/components/rpg/quests/branching-quest-template.ts).

### Quest gating and pacing

- Per-quest `availability` (level, day, flags, completed-quests, race-lock state, location).
- **Daily unveil cap**: at most 2 NEW quests are revealed per day. Eligible-but-not-yet-shown quests sit in a hidden queue and unveil 2/day until drained, prioritized **highest quest number first**.
- See `getPlayerVisibleQuests` and the daily-XP `useEffect` in [src/components/rpg/RPGInterface.tsx](../../src/components/rpg/RPGInterface.tsx).

## Day cycle

- Real-time elapsed: `Date.now() - characterStartTimestamp` divided by `DAY_IN_MS`.
- Hook: [src/components/rpg/hooks/useDayCounter.ts](../../src/components/rpg/hooks/useDayCounter.ts).
- Daily skill XP grant runs on day rollover (see RPGInterface daily-XP effect).

## Skills and XP

- Three primary skill XP pools: `explorationXp`, `foragingXp`, `meleeAttackXp`.
- Level curve: `getLevelFromXp` in [engine.ts](../../src/components/rpg/quests/engine.ts).
- Daily distribution: [src/components/rpg/quests/skills-config.ts](../../src/components/rpg/quests/skills-config.ts).
- See also: [SKILLS.md](./SKILLS.md).

## Race lock

- Players accrue `*Race` modifier points across quests; locked permanently at the Silver Lake reflection (quest 018).
- Canonical races: [docs/RACES.md](../RACES.md).
- Narrative: [RACES_DESIGN.md](./RACES_DESIGN.md).

## Class points

- Players accrue `*Class` modifier points across quests; classes unlock at 5 points each.
- Canonical archetypes: [docs/CLASSES.md](../CLASSES.md).
- Narrative: [CLASSES_DESIGN.md](./CLASSES_DESIGN.md).

## Modifiers

- Traits, characteristics, blessings, and other non-race / non-class modifiers.
- See [MODIFIERS.md](./MODIFIERS.md) and [.agents/docs/character-modifiers.md](../../.agents/docs/character-modifiers.md).

## Chat (NIP-29)

- One global room (Social tab) and one room per location (Play tab).
- Hosted on a single chat relay so messages do not appear on the user's nostr profile feed.
- Implementation: [src/components/rpg/chat/](../../src/components/rpg/chat/).
- Membership gate: player must have a non-empty `playerName` (i.e. has named their character).

## Status bar (Play tab)

- Sticky-style bar under the header on the Play tab.
- Health bar (placeholder, wired to `QuestState.health`), live clock, "Reset in X.Yh" countdown to next day rollover, mute toggle for ambient audio.
- Shimmer-sweep animation on the health fill.
- Component: [src/components/rpg/PlayStatusBar.tsx](../../src/components/rpg/PlayStatusBar.tsx).

## Ambient music

- Procedural Web Audio drone that loops while at certain locations (Silver Lake today).
- Optional file override at `/music/<slug>.mp3` under `public/`.
- Hook: [src/components/rpg/audio/useAmbientPad.ts](../../src/components/rpg/audio/useAmbientPad.ts).
- Mute toggle persists in `localStorage` (`nsg:audio-muted`).

## Chronicle

- Personal story log assembled from dialogue + world events.
- Component: [src/components/rpg/ChronicleDialog.tsx](../../src/components/rpg/ChronicleDialog.tsx).

## Social signals

- "Strangers" / "Kindred" counters and recent activity feed in the Social tab.
- Hook: [src/components/rpg/hooks/useSocialQueries.ts](../../src/components/rpg/hooks/useSocialQueries.ts).

## Guilds

- See [GUILDS.md](./GUILDS.md). Not implemented yet.

## Main Quest

- See [VISION.md](./VISION.md) > _The Main Quest_. Not implemented yet.
