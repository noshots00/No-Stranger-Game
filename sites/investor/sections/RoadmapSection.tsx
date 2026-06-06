import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";

const LIVE_ITEMS = [
  "Branching quest engine with daily pacing and unveil queue",
  "Forest arc through race lock (Silver Lake) and class lock",
  "Village hub: Arena, Mayor, Tavern, Market, Jobs Hall",
  "Community building projects (mayor-set, player-funded)",
  "Global and district chat (NIP-29 group rooms)",
  "Social tab: strangers, kindred, activity feed",
  "Nostr persistence: kind 10031 / 10032 checkpoints",
  "Chronicle, ambient audio, character sheet with modifiers",
] as const;

const NEXT_ITEMS = [
  "Main quest polish and mid-game branch authoring",
  "Guild system (House-naming rule; NIP kinds defined)",
  "Integrity feed and anti-cheat (maintainer roadmap)",
  "Additional districts beyond the Forest",
  "Kindred-spirit matching and deeper social signals",
  "E2E private inventory and DMs where feasible",
] as const;

export function RoadmapSection() {
  return (
    <SectionShell
      id="roadmap"
      kicker="Status"
      title="Live today — building next"
      subtitle="The core loop and village multiplayer are implemented. The main quest narrative and guild layer are the next content and systems push."
      altBackground
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <div className="investor-card h-full">
            <h3 className="investor-kicker mb-4 text-[var(--candle-wax)]">Live today</h3>
            <ul className="space-y-2.5">
              {LIVE_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-base text-[var(--candle-ink-soft)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--candle-flame)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn delayMs={80}>
          <div className="investor-card h-full">
            <h3 className="investor-kicker mb-4 text-[var(--candle-ink-faint)]">Next</h3>
            <ul className="space-y-2.5">
              {NEXT_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-base text-[var(--candle-ink-faint)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-[var(--candle-ink-faint)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </div>
    </SectionShell>
  );
}
