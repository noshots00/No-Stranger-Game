# NIP-05 Homeland Spec

## Purpose

Use NIP-05 domain identity as a lightweight lore anchor:

- domain -> homeland flavor
- same-domain players share a subtle narrative link.

## Inputs

- Current user's kind 0 metadata.
- `nip05` field if present and valid.

## Processing

1. Parse `nip05` safely.
2. Validate structure `name@domain`.
3. Extract domain as homeland key.
4. Normalize:
   - lowercase domain
   - strip whitespace

## Output Fields

- `homelandDomain: string | null`
- `homelandLabel: string` (display-friendly text)

## Profile Integration

Add Homeland section:

- If domain exists:
  - "Homeland: <domain>"
- If missing:
  - "Homeland: Unknown Roads"

## Dialogue Integration

When homeland exists, append one flavor line in Events or Main Quest:

- "A merchant recognizes the mark of <domain>."

If two visible players share homeland:

- show subtle linkage text in profile card:
  - "A hidden road connects your homelands."

## Safety/Resilience

- Never block gameplay on missing/invalid `nip05`.
- Treat invalid `nip05` as absent.
- No DNS verification logic required in v1.

## Non-Goals (v1)

- No mechanical stat bonuses by domain.
- No hard map lock/unlock logic from homeland.
