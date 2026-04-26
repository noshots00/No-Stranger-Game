# Scrying Pool Spec (Followers as Glimmers)

## Purpose

Expose social discovery without forced multiplayer:

- players see hints of locations found by their network,
- but inaccessible locations remain grayed and locked.

## Inputs

- Current user pubkey.
- Follow graph (kind 3 `p` tags).
- Opt-in players in network (existing presence mechanic).
- Each player's discovered location set.

## Data Requirements

Each opted-in player should expose discovered locations via a lightweight event payload:

- Kind: `30000`
- `d`: `discoveries`
- Content: `{ locations: string[], updatedAt: number }`

## Processing

1. Build `networkPlayers` from follows (and followers if enabled in mode).
2. Filter to opted-in players.
3. Fetch each player's discovered locations.
4. Compute glimmer set:
   - `glimmers = union(networkLocations) - myLocations`
5. Rank glimmers:
   - by frequency across network players
   - by recency (if available)

## Outputs

- `glimmerLocations: Array<{ locationId: string; seenByCount: number; sourcePlayers: string[] }>`

## UI Behavior

Map rendering rules:

- My discovered location:
  - full color, interactable.
- Network glimmer location:
  - grayscale/low opacity marker
  - tooltip copy:
    - "You sense this place through another traveler's memory."
  - not interactable until discovered by self.

## UX Text

- Empty glimmer state:
  - "No distant places shimmer yet."
- Non-empty:
  - "Other travelers have seen paths still hidden from you."

## Caching

- Cache location payloads for 10 minutes.
- Refresh map glimmers on:
  - login,
  - network presence refresh,
  - map open.

## Failure Behavior

- If network discovery payloads unavailable:
  - map functions normally with no glimmers.

## Non-Goals (v1)

- No direct teleport/unlock from social visibility.
- No guarantee of full location consistency across relays.
