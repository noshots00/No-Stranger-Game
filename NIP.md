# No Stranger Game - Nostr Event Kinds

## Active Event Usage

This document defines the Nostr events currently used by No Stranger Game.

### 30000 - Presence Opt-In
Parameterized replaceable event used for game-presence and lightweight public profile state.

**Required tags:**
- `d`: `opt-in`
- `t`: `no-stranger-game`
- `alt`: human-readable purpose

**Content:** JSON presence payload with current level, role, identity summary, and discovered locations.

### 7673 - Chapter Proof
Regular event used for canonical chapter-choice proofs (choice as temporal proof-of-work).

**Required tags:**
- `chapter` - chapter identifier
- `window` - UTC window ID for canonical choice scope
- `choice` - selected option
- `prev` - previous proof head (chain link)
- `t` - `no-stranger-game`
- `alt` - human-readable purpose

**Content:** JSON proof payload containing chapter/window IDs, selected option, consequence snapshot, and character ID.

### 30315 - Autonomous Daily Snapshot
Regular event storing deterministic daily idle simulation snapshots for a character run.

**Tags:**
- `t` - Always `no-stranger-game`
- `character` - Character identifier for this run
- `window` - UTC daily window (`YYYY-MM-DD`)
- `alt` - Human-readable description

**Content:** JSON string containing:
```json
{
  "locationId": "market_square",
  "gold": 12,
  "health": 94,
  "professionLabel": "Street Vendor",
  "visibleTraits": ["Patient"],
  "hiddenTraits": ["Night Owl"],
  "injuries": [],
  "lastSimulatedTick": "2026-04-27",
  "dailyLogs": [
    { "tick": "2026-04-27", "line": "At Market Square, you worked as Street Vendor..." }
  ],
  "exploreIntent": "Search the old road for work and shelter"
}
```

### 4 - Encrypted Direct Message
Used for in-game private messaging mechanics (Dead Letter Office / Echo Chamber), signed and encrypted through the user signer.

### 5 - Event Deletion
Used for The Forgetting mechanic to request deletion of prior proof events.

### 30101 - Player Quest Post
Regular event used for player-created bounty quest posts on the social quest board.

**Tags:**
- `d` - local quest slug
- `item` - requested item id
- `bounty` - reward per unit
- `escrow` - total escrowed reward amount
- `max` - max units derived from escrow/bounty
- `expires` - unix milliseconds expiration
- `fee` - posting fee
- `t` - `no-stranger-game`
- `t` - `quest-board`
- `alt` - human-readable description

### 30102 - Player Quest Accept
Regular event used to signal one-click acceptance/claim intent for a posted player quest.

### 30103 - Player Quest Complete
Regular event used to publish completion proof for player quests.

**Tags:**
- `e` - referenced quest event id
- `item` - submitted item id
- `quantity` - submitted quantity
- `payout` - payout computed from quantity x bounty
- `t` - `no-stranger-game`
- `t` - `quest-board`

### 30104 - Player Quest Settlement
Regular event used to mark settlement operations (currently expiration refunds), enabling deterministic reconciliation.