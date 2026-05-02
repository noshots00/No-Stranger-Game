# Security & Privacy Audit

Snapshot taken at game version `0.5.0`. This is a planning artifact — **no code changes** are made by this report. The recommendations are inputs for future hardening batches.

## Executive summary

The game publishes a small number of nostr event kinds. Most are encrypted or scoped to a single relay; the **largest leak** today is the **public quest-state checkpoint (kind 10032)**, which contains the full `QuestState` including player name, modifiers, location, and the dialogue/world chronicle. It appears on the user's nostr profile feed on every save.

### Top 3 leaks (ranked, highest priority first)

1. **Quest state checkpoint (kind 10032) — full game state public on user profile.** Contains player name, locked race, dialogue log, world events, modifiers, location. _Recommendation:_ encrypt content to self with NIP-44 OR move to a dedicated game relay; keep the d-tag stable so replace-semantics still work.
2. **Character start timestamp (kind 10031) — public on user profile.** Reveals when each user started playing. Lower sensitivity than #1 but still profile noise. _Recommendation:_ encrypt to self with NIP-44, or drop entirely and keep the timestamp in localStorage with a hashed re-derivation on login.
3. **Profile metadata (kind 0) updated by signup — intended public, but the signup flow injects an avatar and `display_name` onto the user's main nostr profile.** Many users may not realize their main profile gets touched by the game. _Recommendation:_ make the kind-0 publish opt-in with an explicit checkbox in the signup dialog.

## Catalog: every event the game publishes

For each entry: file:line, kind, content shape, who can read, profile leak risk, recommendation.

### 1. Profile metadata (kind 0)

- File: [src/components/auth/SignupDialog.tsx:133](../../src/components/auth/SignupDialog.tsx)
- Kind: **0** (replaceable user metadata)
- Content: JSON `{ name, display_name, picture, ... }`
- Reach: published via the user's default relay pool (`nostr.event(...)` through `useNostrPublish`). Visible on every nostr client.
- Profile leak risk: **HIGH** — this IS the user's nostr profile. Any user signing up via the game has their main profile metadata overwritten without explicit consent each time.
- Recommendation: Add an opt-in checkbox at signup ("Update my nostr profile"). Default OFF. Skip the publish if unchecked.

### 2. Character start timestamp (kind 10031)

- File: [src/components/rpg/gameProfile.ts:131](../../src/components/rpg/gameProfile.ts) (`publishCharacterStartTimestamp`)
- Kind: **10031** (replaceable, custom)
- Content: plaintext JSON `{ startTimestamp: <ms> }`
- Tags: `d=character-start`, `t=no-stranger-game`, `alt=...`
- Reach: default relay pool — **appears on user profile feed**.
- Profile leak risk: **MEDIUM** — leaks "this user plays NSG" + when they started.
- Recommendation: NIP-44 encrypt the content to self (so only the user can read it). Keep the `d` tag for replace semantics; drop the `t` tag once private.

### 3. Quest state checkpoint (kind 10032)

- File: [src/components/rpg/gameProfile.ts:184](../../src/components/rpg/gameProfile.ts) (`publishQuestStateSnapshot`)
- Kind: **10032** (replaceable, custom)
- Content: plaintext JSON `{ savedAtMs, state: <full QuestState> }`
  - Includes: `playerName`, `currentLocation`, `flags`, `modifiers`, `assignedRaceSlug`, `dialogueLog`, `worldEventLog`, `questItems`, `unveiledQuestIds`, `health`, etc.
- Tags: `d=quest-state`, `t=no-stranger-game`, `alt=...`
- Reach: default relay pool — **appears on user profile feed**, frequently (every state change persists).
- Profile leak risk: **HIGH** — full game state is public, including chronicle and dialogue history. Anyone querying the relay can rebuild the player's whole save.
- Recommendation:
  - **Short-term:** encrypt content to self with NIP-44 (`signer.nip44.encrypt(user.pubkey, JSON.stringify(payload))`). Keep d-tag stable.
  - **Long-term:** consider moving to a dedicated game relay so even the encrypted blob doesn't sit on every public relay.
  - **Throttle:** debounce checkpoint publishes (today they fire on every choice). Cap at, e.g., one publish per 30 seconds + a final on tab-close.

### 4. NIP-29 chat messages (kind 9)

- File: [src/components/rpg/chat/useChatRoom.ts:67-68](../../src/components/rpg/chat/useChatRoom.ts) (`relay.event(event, ...)`)
- Kind: **9** (NIP-29 group chat message)
- Content: plaintext user input (max 4000 chars).
- Tags: `h=<group-id>` where group-id is `no-stranger-game-global` or `no-stranger-game-loc-<slug>`.
- Reach: published **only to the chat relay** (default `wss://relay.0xchat.com`), NOT to the user's regular relays. Does not appear on the user's nostr profile feed.
- Profile leak risk: **LOW** for nostr profile leak. **MEDIUM** for content privacy: the chat relay operator and any client connected to the relay can read the room.
- Recommendation:
  - Acceptable for now per the design decision (see [VISION.md](../design/VISION.md) > _Chat Defaults_).
  - Future: evaluate upgrading to NIP-17 gift-wrapped group chat for true E2EE, accepting the higher network cost.
  - Allow users to swap the chat relay via `AppConfig`.

### 5. NIP-04 direct messages (kind 4)

- File: [src/components/DMProvider.tsx:240](../../src/components/DMProvider.tsx) (`createEvent({ kind: 4, ... })`)
- Kind: **4** (legacy NIP-04 DM)
- Content: AES-encrypted to recipient's pubkey.
- Reach: default relay pool.
- Profile leak risk: **LOW** for content (encrypted). **MEDIUM** for metadata: DM events leak who is talking to whom and when. NIP-04 is also considered legacy/deprecated by the wider ecosystem.
- Recommendation: prefer NIP-17 (already implemented alongside) and phase out NIP-04 sends. Reading-side compatibility can stay.

### 6. NIP-17 gift-wrapped DMs (kind 1059)

- File: [src/components/DMProvider.tsx:340-358](../../src/components/DMProvider.tsx) (twin gift-wraps to recipient and self)
- Kind: **1059** (gift wrap, sealed sender)
- Content: NIP-44 encrypted; sender identity hidden by random ephemeral signing key.
- Created_at: randomized to hide real send time.
- Reach: default relay pool.
- Profile leak risk: **VERY LOW** — true E2EE, sender identity hidden, time fuzzed.
- Recommendation: keep as the preferred DM path. Document this as the privacy reference implementation in [MODIFIERS.md](../design/MODIFIERS.md) or a future `DM.md`.

### 7. NIP-42 AUTH (kind 22242)

- File: [src/components/NostrProvider.tsx:76](../../src/components/NostrProvider.tsx) (`signer.signEvent({ kind: 22242, ... })`)
- Kind: **22242** (relay auth challenge response)
- Content: empty.
- Reach: ephemeral, returned to one specific relay, never broadcast.
- Profile leak risk: **NONE** — required for relay auth, not stored.
- Recommendation: no change.

### 8. NIP-57 zap request

- File: [src/hooks/useZaps.ts:216](../../src/hooks/useZaps.ts) (`user.signer.signEvent(zapRequest)`)
- Kind: zap request (kind 9734).
- Content: plaintext per spec.
- Reach: signed and POSTed to the recipient's LNURL callback. Eventually shows up as a zap receipt (kind 9735) on relays.
- Profile leak risk: **MEDIUM** — zap activity is publicly attributed to the user's pubkey by design.
- Recommendation: surface a tooltip/note in the Zap UI that zap activity is public. Already standard nostr behavior.

## What is NOT a leak (queries-only, no publish)

These hooks query nostr but do not publish:

- [src/components/rpg/hooks/useSocialQueries.ts](../../src/components/rpg/hooks/useSocialQueries.ts) — queries kinds 10031, 10032, 3.
- [src/hooks/useAuthor.ts](../../src/hooks/useAuthor.ts) — queries kind 0.

Queries don't leak content from the user, but the `enabled` flags + query frequency reveal "this user is online and playing." Future hardening could batch and rate-limit these.

## Changed in v0.5.0 (this batch)

- **Removed** the kind-1 lobby chat (`t=no-stranger-game-lobby`). Chat is now NIP-29 on a dedicated relay (item #4 above). This removed one HIGH-severity leak: every lobby message previously appeared on the user's nostr profile.

## Suggested next batches

In rough priority order:

1. **Encrypt quest-state checkpoint (item #3) with NIP-44 and throttle publishes.** Single biggest privacy win.
2. **Encrypt character-start timestamp (item #2) or drop it entirely.**
3. **Make signup profile-publish opt-in (item #1).**
4. **Add a Settings panel `Privacy` toggle** that disables non-essential publishes (presence, optional social telemetry) for high-privacy users.
5. **Move quest-state and start-ts to a dedicated game relay** (config in `AppConfig`) so even encrypted blobs don't sit on every public relay.
6. **Phase out NIP-04 DM sends** in favor of NIP-17.
