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

### 10031 - Character Start Timestamp
Replaceable event storing the canonical first-login timestamp used to calculate the character day counter.

**Tags:**
- `d` - Always `character-start`
- `t` - Always `no-stranger-game`
- `alt` - Human-readable description

**Content:** JSON string containing:
```json
{
  "startTimestamp": 1777545600000
}
```

### 10032 - Quest Save Checkpoint
Replaceable event storing per-player quest progression checkpoints for resume-on-login behavior.

**Tags:**
- `d` - Always `quest-state`
- `t` - Always `no-stranger-game`
- `alt` - Human-readable description

**Content:** JSON string containing:
```json
{
  "savedAtMs": 1777545660000,
  "state": {
    "activeQuestId": "quest-002-boar-ambush",
    "progressByQuestId": {},
    "modifiers": {},
    "flags": ["quest001-complete"],
    "playerName": "Ari",
    "dialogueLog": [
      {
        "id": "Narrator-1777545660000-a1b2c3",
        "speaker": "Narrator",
        "text": "The forest path opens ahead.",
        "atMs": 1777545660000
      }
    ],
    "worldEventLog": [
      { "text": "You remembered your name is Ari", "atMs": 1777545660300 },
      { "text": "Ari is exploring the Forest.", "atMs": 1777545660301 }
    ]
  }
}
```