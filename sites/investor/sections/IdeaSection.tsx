import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";

export function IdeaSection() {
  return (
    <SectionShell
      id="idea"
      kicker="The idea"
      title="Story first. Social forever."
      subtitle="No Stranger Game is a browser RPG built on Nostr — the open social protocol. Players begin alone in a forest with no memory, make choices that shape who they become, then arrive in a village where other real players trade, vote, fight, and build together."
    >
      <FadeIn>
        <div className="investor-card max-w-3xl">
          <p className="investor-body text-[var(--candle-ink)]">
            Idle games excel at retention. Multiplayer games excel at belonging. No one
            has merged them into a literary, choice-driven RPG — until now.
          </p>
          <p className="investor-body mt-4">
            We are not building a session-heavy MMO. We are building a world you check
            in on: a few meaningful choices, a day of progress, and a lobby full of
            strangers who might become kindred spirits.
          </p>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
