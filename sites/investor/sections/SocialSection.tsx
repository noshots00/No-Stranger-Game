import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";

const SOCIAL_FEATURES = [
  {
    title: "Global lobby",
    body: "District rooms on the Play tab and a worldwide Social tab chat. Real names from in-game character sheets — not anonymous noise.",
  },
  {
    title: "Strangers & kindred",
    body: "Discover who else is playing. Activity feed shows recent journeys: level, race, and class as players emerge from the Forest.",
  },
  {
    title: "Arena",
    body: "Open registration and automated pairing. Match results published on shared game relays — spectators and rivals see outcomes.",
  },
  {
    title: "Mayor & politics",
    body: "Candidacy and voting on-chain. The leading candidate is visible to every villager. Community projects follow the mayor's agenda.",
  },
  {
    title: "Tavern quests",
    body: "Players post bounties with gold escrow. Hire strangers for jobs only another human would take.",
  },
  {
    title: "Market & projects",
    body: "Player listings and NPC supply. Pooled stone and iron fund village upgrades everyone benefits from.",
  },
] as const;

export function SocialSection() {
  return (
    <SectionShell
      id="social"
      kicker="Multiplayer"
      title="Social by design — not bolted on"
      subtitle="After the solo Forest arc, every system pushes players toward each other. Chat, commerce, combat, and governance run on the same public network."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_FEATURES.map((feature, index) => (
          <FadeIn key={feature.title} delayMs={index * 60}>
            <article className="investor-card h-full">
              <h3 className="investor-display text-xl font-semibold text-[var(--candle-wax)]">
                {feature.title}
              </h3>
              <p className="investor-body mt-2 text-base">{feature.body}</p>
            </article>
          </FadeIn>
        ))}
      </div>

      <FadeIn className="mt-8">
        <div className="investor-card border-[var(--candle-flame-soft)] bg-[var(--candle-flame-glow)]">
          <p className="investor-body text-[var(--candle-ink)]">
            <strong className="font-semibold text-[var(--candle-wax)]">Privacy first:</strong>{" "}
            game chat lives on dedicated group relays — it does not spam players&apos; normal
            Nostr profile feeds. Social presence without surveillance-style telemetry.
          </p>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
