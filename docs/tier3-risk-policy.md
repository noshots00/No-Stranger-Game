# Tier 3 Mechanics Risk and Policy Guardrails

## Scope

Applies to:

- Zap-Powered Quest Influence
- Mute List as Trauma
- Kind 1984 as Scars
- NIP-07 Summoning

## Launch Policy

Tier 3 mechanics are disabled by default in production until all guardrails below are implemented.

## Required Guardrails

## 1. Player Consent Controls

- Global toggle: `Enable Experimental Social Mechanics`
- Per-feature toggles:
  - zap influence
  - trauma shadows
  - scar rendering
  - summoning/ghosting

## 2. Visibility Controls

For any social mechanic output, allow:

- Public
- Followers only
- Private/off

## 3. Anti-Abuse Limits

- Rate limits on influence operations (per pubkey, per day).
- Distinct-author requirements for crowd-influence effects.
- Ignore self-authored and obvious sybil burst patterns.

## 4. Harassment Prevention

- Never expose private mute-list details publicly.
- No direct naming/shaming in trauma/scar mechanics.
- Convert sensitive outputs to abstract/lore-safe representations.

## 5. Content Safety Filters

- Strip slurs/harassment phrases from generated rumor text.
- Prevent direct quote amplification from abuse events.

## 6. Moderation Hooks

- Owner kill-switch per feature.
- Feature-wide disable flag in config.
- Emergency narrative fallback copy.

## 7. Auditability

Log (client-side for v1, server-side later):

- feature enabled state
- influence source counts
- suppression/filter actions

## Rollout Strategy

1. Closed alpha with trusted testers.
2. Opt-in beta with explicit warnings.
3. Public default-off.
4. Public default-on only after policy pass and incident-free window.

## Success Criteria to Graduate Tier 3

- No critical abuse incidents in beta window.
- Player sentiment net-positive.
- Support burden acceptable.
- Clear player understanding of controls.
