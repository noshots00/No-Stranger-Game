import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";

const NOSTR_POINTS = [
  {
    label: "No game server",
    detail: "The browser client reads and writes public Nostr events on fixed game relays. Capital-efficient at any scale.",
  },
  {
    label: "Portable saves",
    detail: "Full quest state publishes as kind 10032 checkpoints. Players own their progress — identity travels with their key.",
  },
  {
    label: "Open multiplayer",
    detail: "Arena, mayor, market, tavern, and village projects use documented custom kinds (30333–30341). Any client can observe the world.",
  },
  {
    label: "Honest roadmap",
    detail: "Server-side anti-cheat and maintainer integrity feeds are not shipped yet. We grow with the protocol — we do not overclaim.",
  },
] as const;

export function NostrSection() {
  return (
    <SectionShell
      id="nostr"
      kicker="Architecture"
      title="Built on Nostr — the open social protocol"
      subtitle="No Stranger Game is a product, not a walled garden. Multiplayer state is public events on shared relays, not a proprietary backend."
      altBackground
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn>
          <div className="investor-card h-full space-y-4">
            {NOSTR_POINTS.map((point) => (
              <div key={point.label} className="border-b border-[var(--candle-rule)] pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-[var(--candle-wax)]">{point.label}</p>
                <p className="investor-body mt-1 text-base">{point.detail}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delayMs={100}>
          <div className="investor-card flex h-full flex-col justify-center">
            <p className="investor-kicker mb-3">Data flow</p>
            <div className="space-y-3 font-mono text-sm text-[var(--candle-ink-soft)]">
              <p className="rounded-lg border border-[var(--candle-rule)] bg-[var(--candle-void)] px-4 py-3">
                Player browser
                <span className="text-[var(--candle-flame)]"> → </span>
                Game relays
              </p>
              <p className="rounded-lg border border-[var(--candle-rule)] bg-[var(--candle-void)] px-4 py-3">
                kind 10032 quest-state
                <span className="text-[var(--candle-flame)]"> · </span>
                kind 10031 creation anchor
              </p>
              <p className="rounded-lg border border-[var(--candle-rule)] bg-[var(--candle-void)] px-4 py-3">
                Village events 30333–30341
                <span className="text-[var(--candle-flame)]"> · </span>
                NIP-29 chat rooms
              </p>
            </div>
            <p className="investor-body mt-5 text-base">
              Two fixed relays today: relay.ditto.pub and relay.dreamith.to. Every villager
              sees the same world.
            </p>
          </div>
        </FadeIn>
      </div>
    </SectionShell>
  );
}
