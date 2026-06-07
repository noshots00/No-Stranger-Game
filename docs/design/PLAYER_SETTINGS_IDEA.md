# Player settings menu (idea)

Future settings screen for the live game client. Not implemented — capture for when we want a single place for account, audio, and diagnostics instead of scattered controls.

## Principles

- **Game relays stay fixed** (`relay.ditto.pub`, `relay.dreamith.to`). Do not expose relay pickers for game traffic.
- **Dev tools stay dev-only** (modifier details, unlock all quests, day simulation, etc.).
- **Never show `nsec` in settings** after signup; backup reminders only.

## Already scattered in the UI

| Setting | Today |
|--------|--------|
| Music mute | Character tab corner (`nsg:audio-muted`) |
| Log out / switch account | Character menu + title screen |
| Reset story | Dev-gated character menu |
| Relay status | Header dot + flyout |
| npub | Character sheet link |

## Proposed v1 sections

### Account

- Switch account / log out
- Copy npub + short explanation
- Backup reminder (link to key-file guidance, not raw secret)
- Edit Nostr profile (kind 0: name, avatar, bio) — not shipped yet
- One line: in-game character name vs Nostr profile

### Audio & accessibility

- Music on/off (consolidate speaker control)
- Reduce motion override (candle flicker, NPC motion, relay pulse) beyond `prefers-reduced-motion`

### Game data

- Reset character / new story (strong warning)
- Manual “refresh from game relays” (checkpoint, market, town hall) when connection is flaky

### Connection (read-only)

- Reuse header relay Status/Activity panel
- Optional: last sync / save status in plain language

### About

- App version
- Short “how saves work” (checkpoint, Eastern calendar days, kind 10031 anchor)
- Links: rules, privacy, support

## Explicitly out of scope for players

- Custom game relay lists
- Dev/debug toggles
- Guild / market / quest channel settings until those features exist
- Theme switcher (optional later; candlelit dark is the default experience)

## Suggested first implementation

Character-tab or header flyout: **mute + logout + npub + relay diagnostics**, then grow profile edit and reset story when ready.
