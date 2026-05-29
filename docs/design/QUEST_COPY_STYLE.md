# Quest copy style guide

Short reference for humans and AI when writing Play-tab quest steps. Code lives in `src/components/rpg/quests/`; this doc is the voice contract.

Last reviewed: 2026-05-28

---

## Length

- **One line** per narrator beat when possible.
- **Two lines** max for choice framing or a single dramatic beat.
- Players skim; if it does not fit on a phone without scrolling, cut it.

## Voice

- Second person: **you**.
- Present tense.
- Direct statements. No hedging (“perhaps,” “it seems”).
- No stage directions in italics; no `[OOC]` asides.

## Quest card (Play list)

| Field | Use |
|-------|-----|
| `title` | Proper name (`Dyer's Crypt`, `Dream`) |
| `briefing` | One-line hook under the title (`There is evil here...`) — **card only**; do not repeat in quest transcript steps |

## Choice labels

- Start with a **verb**: `Continue`, `Eat more`, `Follow it`, `Leave`.
- No full sentences in labels unless unavoidable.
- Avoid `(disabled)` text in labels; use `disabledLabel` on the choice if needed.

## Day report phrasing (do not duplicate in quest text)

- Stats, traits, skills: handled by the engine on day end.
- Spells: `You learned the Spark spell.` (see `formatSpellLearnedMessage` in helpers).

## Good vs bad

| Bad | Good |
|-----|------|
| You begin to carefully make your way along the gurgling stream, wondering what lies ahead. | You follow the stream. |
| Perhaps you might consider tasting one of the mushrooms. | What do you do? |

## Sunset → Dyer's Crypt opener (one sentence each)

Set the matching flag in Sunset (quest 2); Dyer's Crypt reads it on open. Each opener ends with **when you find a patch of mushrooms.** The next step is the shared choice beat (`What do you do?`) — do not repeat mushroom discovery there.

| Sunset flag | Opener line |
|-------------|-------------|
| `quest-002-first-night-water` | You are following the water downstream when you find a patch of mushrooms. |
| `quest-002-first-night-trails` | You are following an animal trail when you find a patch of mushrooms. |
| `quest-002-first-night-food` | You are searching for food when you find a patch of mushrooms. |
| `quest-002-first-night-high-ground` | You climb toward higher ground when you find a patch of mushrooms. |
| `quest-002-first-night-shelter` | You leave your shelter when you find a patch of mushrooms. |
| `quest-002-first-night-tree` | You climb down from the tree when you find a patch of mushrooms. |
| `quest-002-first-night-pockets` | You move on when you find a patch of mushrooms. |
| `quest-002-first-night-call-help` | You push deeper into the forest when you find a patch of mushrooms. |
| *(none / fallback)* | You press on when you find a patch of mushrooms. |

Priority when multiple flags apply: water → trails → food → high ground → shelter → tree → pockets → call help → fallback.

## Contextual quests

- One quest **card**; branch with `resolveInitialStepId` in code, not separate quest IDs.
- Opener message → shared choice step (e.g. mushrooms). Do not duplicate setup in the choice `text`.
- Converge all paths before `completeQuest`.
