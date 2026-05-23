# Game integrity, relays, and multiplayer — design notes

Reference document capturing maintainer discussions (co-test issues, anti-cheat direction, relay behavior). **Not implemented** unless called out as existing in code.

---

## 1. Problems observed in co-test

### 1.1 Split “worlds” (mayor, arena, village)

- One player saw only themselves in Mayor’s Hut; another saw everyone (including old test accounts).
- Arena: second registrant got a match; first player stayed on “Waiting for opponent…”
- **Likely cause:** clients were not reading the same relay set. `NostrSync` can replace default game relays (`ditto.pub` + `dreamith.to`) with the logged-in user’s personal NIP-65 list (kind **10002**) from another Nostr app or stale `localStorage` (`nostr:app-config`).
- **Secondary:** village panels only poll every ~20s while open; no manual “Update” button. That explains slow updates, **not** “only see myself” if relays were aligned.

### 1.2 Polling vs authority

- Mayor, arena, tavern, market use `nostr.query()` on the pool configured in `NostrProvider` (from `config.relayMetadata`).
- No in-game relay settings UI; no publish of kind 10002 from this repo.
- Chat uses `nostr.group(GAME_RELAY_URLS)` explicitly (same two URLs by default).

---

## 2. Where character data lives today

| Data | Local (`localStorage`) | Nostr relays |
|------|------------------------|--------------|
| Full save (`QuestState`) | `nsg:facsimile-quest-state:{pubkey}` | kind **10032** (`d`: `quest-state`) — **public** JSON |
| Creation date (pacing) | `nsg:character-creation-date-eastern` (+ per-pubkey key) | kind **10031** (`d`: `character-start`) |
| Display name on profile | — | kind **0** (optional merge on name submit) |
| Mayor / arena / guild / tavern / market | Escrow bookkeeping only in 10032 | kinds **30333–30339**, **10050** |
| DMs | — | relays + **IndexedDB** cache |
| App relays / theme | `nostr:app-config` | kind **10002** via `NostrSync` (overrides defaults) |
| Login | `nostr:login` | — |

**Load order for quest save:** relay 10032 (newest `created_at`) → else localStorage → else new game.

**Anti-cheat today:** almost none. Any player can edit local save and publish signed 10032. Validation is shape/normalization only (health bounds, class slug, etc.), not “did you earn this quest.”

---

## 3. `NostrSync` (why it fights multiplayer)

- On login, fetches **your** kind **10002** and, if newer than stored metadata, **replaces** `relayMetadata` in `nostr:app-config`.
- Intended for generic Nostr clients (personal relay preferences).
- **For this game:** shared village state requires **everyone** on the same read/write relays. Personal 10002 works against that.

**Conclusion:** disable or bypass `NostrSync` for game traffic; pin reads/writes to maintainer-defined game relays.

---

## 4. Planned direction: maintainer authority

### 4.1 Principles

1. **Hardcode maintainer `npub`** in the app — only trust integrity events from `authors: [MAINTAINER_NPUB]`.
2. **Publish** bans, rollbacks, relay policy, freezes, etc. to **game relays** (files or tooling maintained by maintainer, then signed events).
3. **On sign-in (and periodic refresh):** download integrity feed; build in-memory `IntegrityState`.
4. **Before player publish:** gate `useNostrPublish` / village actions — banned, freeze, version mismatch, etc.
5. **Filter feeds:** mayor, arena, market, tavern, chat display — drop banned pubkeys and invalidated event ids / cutoffs.

### 4.2 What “rollback” means on Nostr

Relays do not delete history. Rollback = **new maintainer decrees** that tell clients to:

- Ignore listing/match/quest events after timestamp `T` or by event id list.
- Clamp or override wallet/modifiers when loading 10032.
- Hide banned users in UI and refuse their writes in the official client.

Cannot rewrite another user’s kind **10032** without their private key. Economy recovery may combine **invalidating village events** + **per-pubkey overrides** on load.

### 4.3 Suggested mechanism (to implement)

- Custom kind (e.g. **30400** — assign via project kind tool), documented in `NIP.md`.
- Append-only or sequenced decrees: `seq`, `action` (`ban`, `unban`, `rollback-market`, `relay-set`, `freeze-writes`, …).
- Clients apply **latest** rules; use maintainer event time for cutoffs, not client clock.

### 4.4 Limits

- Enforcement is **in the official client** unless a relay operator blocks writes at the relay.
- Modified clients can ignore integrity; design targets honest players + maintainer-led recovery.

### 4.5 Open decisions

- [ ] Append-only decree log vs single replaceable config event.
- [ ] Rollback scope: village events only first vs also 10032 field overrides.
- [ ] Gate dev tools (Character ⋯ menu) to maintainer npub only.
- [ ] Remove `NostrSync` vs ignore 10002 when `relayMetadata` is game-default.

---

## 5. Built-in dev powers (existing)

| Feature | Where | Gated? |
|---------|--------|--------|
| Story checkpoints, mark quest complete | Header (version label panel) | `import.meta.env.DEV` **or** `localStorage` `nsg:dev-header-tools=1` |
| Advance day, 5-min days, rapid day sim, show all quests, modifier details | Character tab ⋯ menu | **Always on** in production today (`showDevTools`) |
| Reset progress | Character tab ⋯ | Everyone |
| Mandatory reset for saves &lt; app `0.5.36` | Block screen | Automatic |

No ban list, no admin pubkey, no remote rollback.

---

## 6. Two game relays — how the client handles disagreement

### 6.1 Configuration (implemented v0.5.148+)

- **Primary:** `wss://relay.ditto.pub` · **Backup:** `wss://relay.dreamith.to` ([`src/lib/gameRelays.ts`](../../src/lib/gameRelays.ts)).
- **Reads:** `nostr.query()` uses [`queryGameRelays`](../../src/lib/queryGameRelays.ts) — parallel query per relay (3s timeout), merge with primary winning replaceable rows ([`mergeRelayQueryResults`](../../src/lib/mergeRelayQueryResults.ts)).
- **Writes:** `eventRouter` still publishes to **every** relay with `write: true`.
- **Chat:** `useChatRoom` polls every **2s** via merged `nostr.query`; sends with `nostr.event` (both writes).
- **Village panels:** Mayor, Arena, Market have manual **Update** (still **20s** auto-poll while open).

### 6.2 Query merge (typical Nostr pool behavior)

When multiple read relays are used:

1. The same `REQ` is sent to each relay.
2. Events are usually **deduplicated by event id** (same note → one row).
3. The pool waits for **EOSE** from relays or hits **`eoseTimeout`** (200 ms here).

**If relays disagree because one is slow:** the client may return results from only the fast relay(s) within 200 ms → missing players/events on that query until a later poll/refresh.

**If relays disagree because one never got the write:** the merged result is the **union** of what each relay returned (by id). Players only on relay B appear after B’s events arrive in time for the query.

There is **no** custom “relay A wins” rule in game code — only pool merge + app logic below.

### 6.3 Application rules after merge

| Feature | Conflict rule |
|---------|----------------|
| Mayor / guild replaceable rows | **Newest `created_at` per pubkey** (per `d` tag semantics) |
| Arena open queue | **Newest per pubkey**; matches (10050) consume registration ids |
| Arena matches | Immutable; union of both relays (by event id) |
| Quest checkpoint 10032 | **Newest `created_at`** among author’s events |
| Market / tavern listings | Latest replaceable state per listing id (pattern in listing parsers) |

If two relays store **different replaceable versions** (same author, different event ids), the client keeps the **newer timestamp**, not “majority relay.”

### 6.4 Writes to two relays

`nostr.event()` publishes to **all** write relays. If one relay fails silently or is down:

- Relays **diverge** until the event is republished or relay syncs.
- Players reading mostly the empty relay see a **split world** (same root cause as co-test).

**Social smoothness:** both relays should receive the same writes; monitor publish errors; consider retry; maintainer integrity feed cannot fix relay replication lag by itself.

### 6.5 Recommendations for social + village

1. **Single authoritative relay list** (maintainer + disable per-user 10002 override).
2. **Increase `eoseTimeout`** or query until all configured relays EOSE (trade latency for completeness).
3. **Manual refresh** on village panels (Update button) — UX backstop, not a substitute for aligned relays.
4. **Integrity feed** to ignore toxic pubkeys/events regardless of which relay still holds them.

---

## 7. Conclusions (summary)

| Topic | Conclusion |
|-------|------------|
| Co-test desync | Different read relays per account is the primary hypothesis; fix by shared game relays + drop `NostrSync` override. |
| Arena “didn’t look” | 20s poll + no refresh button; secondary to relay split. |
| Cheating | Client can forge 10032; no server validation; dev menu exposes cheat-like powers to all users. |
| Maintainer model | Hardcoded maintainer npub + signed integrity events on game relays + client apply/filter/gate. |
| Rollback | Publish decrees; clients ignore/override; cannot delete others’ events on Nostr. |
| Two relays | Union + dedupe by id; 200 ms EOSE timeout can drop slow relay; replaceable = newest wins; writes must reach both. |

---

## 8. Related files

- [`src/components/NostrProvider.tsx`](../../src/components/NostrProvider.tsx) — pool, read/write routing, `eoseTimeout`
- [`src/components/NostrSync.tsx`](../../src/components/NostrSync.tsx) — kind 10002 sync
- [`src/lib/gameRelays.ts`](../../src/lib/gameRelays.ts) — default URLs
- [`src/components/rpg/hooks/useQuestState.ts`](../../src/components/rpg/hooks/useQuestState.ts) — save load/persist
- [`src/components/rpg/gameProfile.ts`](../../src/components/rpg/gameProfile.ts) — kinds 10031, 10032, 0
- [`NIP.md`](../../NIP.md) — village kinds 30333–30339, 10050
- [`docs/reports/SECURITY_AUDIT.md`](../reports/SECURITY_AUDIT.md) — public 10032 exposure

---

*Last updated from design conversation; implementation status may drift — check code for source of truth.*
