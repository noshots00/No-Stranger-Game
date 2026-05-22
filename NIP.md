# No Stranger Game — custom Nostr events

## Kind 30333 — Arena open registration (addressable)

Replaceable per author with `d` tag `arena-open`. One active queue slot per player.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `arena-open` |
| `t` | yes | `arena`, `arena-open` (relay filter) |
| `name` | yes | In-game fighter display name |
| `rating` | yes | Combat rating at registration time |
| `alt` | yes | Human-readable description |

`content` is empty.

## Kind 10050 — Arena match result (regular)

Immutable result when a matcher pairs with an open registration.

| Tag | Required | Description |
|-----|----------|-------------|
| `t` | yes | `arena`, `arena-match` |
| `e` | yes | Registration event id consumed |
| `winner` | yes | Winner pubkey (hex) |
| `p-a`, `n-a`, `cr-a` | yes | Fighter A pubkey, name, combat rating |
| `p-b`, `n-b`, `cr-b` | yes | Fighter B pubkey, name, combat rating |
| `win-pct` | yes | Winner's win chance × 100 (integer) |
| `alt` | yes | Human-readable description |

`content` holds a short summary line for UI.

## Kind 30334 — Guild definition (addressable)

Replaceable per founder with `d` tag = guild slug.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | Guild slug (e.g. `my-guild-name`) |
| `t` | yes | `guild`, `guild-def` |
| `name` | yes | Display name |
| `leader` | yes | Leader display name |
| `alt` | yes | Human-readable description |

`content` is empty.

## Kind 30335 — Guild membership (addressable)

Replaceable per member with `d` tag `member-{guildSlug}`.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `member-{guildSlug}` |
| `t` | yes | `guild`, `guild-member` |
| `g` | yes | Guild slug |
| `name` | yes | Member display name |
| `joined` | yes | Unix seconds when joined |
| `status` | yes | `active` or `left` |
| `left` | when left | Unix seconds when left |
| `alt` | yes | Human-readable description |

`content` is empty.

## Kind 30336 — Player-posted tavern quest (addressable)

Replaceable per poster with `d` tag `player-quest-{uuid}`.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `player-quest-{uuid}` |
| `t` | yes | `tavern`, `player-quest` |
| `title` | yes | Quest title |
| `desc` | yes | Description (truncated in tag) |
| `bounty` | yes | Free-text bounty item name |
| `status` | yes | `open`, `fulfilled`, or `cancelled` |
| `poster-name` | yes | Poster display name |
| `reward-gold` | yes | Gold escrowed (integer, 0 if none) |
| `reward-item` | optional | Quest item label reward |
| `reward-item-key` | optional | Canonical `item:*` key if from inventory |
| `reward-item-qty` | optional | Item quantity (default 1) |
| `fulfiller` | on fulfill | Fulfiller pubkey |
| `fulfiller-name` | on fulfill | Fulfiller display name |
| `alt` | yes | Human-readable description |

`content` is empty.

## Kind 30337 — Player market listing (addressable)

Replaceable per seller with `d` tag `market-listing-{uuid}`.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `market-listing-{uuid}` |
| `t` | yes | `market`, `market-listing` |
| `item-label` | yes | Display name of item for sale |
| `item-key` | optional | Canonical `item:*` key when from inventory stacks |
| `item-qty` | yes | Quantity listed (default 1) |
| `price-copper` | yes | Price in copper |
| `status` | yes | `open`, `sold`, or `cancelled` |
| `seller-name` | yes | Seller display name |
| `buyer` | on sale | Buyer pubkey |
| `buyer-name` | on sale | Buyer display name |
| `alt` | yes | Human-readable description |

`content` is empty. Seller escrows goods locally on list; buyer pays copper on purchase. Seller payout is reconciled when the client sees a `sold` listing on the relay.

## Kind 30338 — Village mayor candidacy (addressable)

Replaceable per candidate with fixed `d` tag `village-mayor-candidate`.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `village-mayor-candidate` |
| `t` | yes | `village`, `mayor-candidate` |
| `candidate-name` | yes | Display name on the ballot |
| `status` | yes | `active` or `withdrawn` |
| `alt` | yes | Human-readable description |

`content` is empty.

## Kind 30339 — Village mayor vote (addressable)

Replaceable per voter with fixed `d` tag `village-mayor-vote`.

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | yes | `village-mayor-vote` |
| `t` | yes | `village`, `mayor-vote` |
| `candidate` | yes | Pubkey hex of the chosen candidate |
| `voter-name` | yes | Voter display name |
| `alt` | yes | Human-readable description |

`content` is empty. The player with the most votes among active candidates is mayor; ties or no votes keep the placeholder mayor (Shannon) in the client UI.
