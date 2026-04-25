# No Stranger Game - Nostr Event Kinds

## Custom Event Kinds

This document defines the custom Nostr event kinds used by the No Stranger Game RPG.

### 3223 - Character Profile
Regular event storing a player's character data including stats, inventory, and progression.

**Tags:**
- `d` - Character identifier (unique per player)
- `class` - Character class (warrior, mage, rogue, etc.)
- `level` - Current character level
- `xp` - Current experience points

**Content:** JSON string containing:
```json
{
  "stats": {
    "strength": number,
    "dexterity": number,
    "intelligence": number,
    "constitution": number,
    "wisdom": number,
    "charisma": number
  },
  "inventory": [
    {
      "id": string,
      "name": string,
      "type": "weapon|armor|potion|quest|material",
      "quantity": number
    }
  ],
  "equipment": {
    "weapon": string|null,
    "armor": string|null,
    "accessory": string|null
  },
  "gold": number,
  "quests": {
    "active": [string], // quest IDs
    "completed": [string] // quest IDs
  },
  "location": string // Current town/area
}
```

### 7673 - Game Action Log
Regular event logging RPG actions taken by players (combat, quests, purchases, etc.)

**Tags:**
- `d` - Action type (combat, quest, purchase, craft, etc.)
- `character` - Character identifier (links to kind 3223)
- `timestamp` - Unix timestamp of action

**Content:** Description of the action taken

### 7127 - Social Interaction
Regular event converting social Nostr activity into game elements (rumors, NPC dialogues, rival challenges)

**Tags:**
- `d` - Interaction type (rumor, dialogue, challenge, etc.)
- `source` - NPUB of the user who generated the social content
- `target` - Character identifier affected by the interaction (optional)
- `event` - Original Nostr event ID that triggered this interaction (optional)

**Content:** Game interpretation of the social activity

### 1283 - World State
Replaceable event storing persistent world data (NPC positions, quest availability, town states)

**Tags:**
- `d` - World element identifier (town name, NPC ID, quest ID)
- `type` - Element type (town, npc, quest, item_shop)

**Content:** JSON string containing current state data for the world element