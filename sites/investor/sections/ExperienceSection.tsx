import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";
import { publicAsset } from "@investor/lib/publicAsset";

const STEPS = [
  {
    phase: "01",
    title: "Awaken",
    body: "You wake in the Forest with no memory. Branching quests teach choices. Every decision applies modifiers — stats, traits, race leanings, class leanings. The opening arc is bingeable: hook players before the idle clock starts.",
    art: "/art/converted/batch-2026-05-31_13-04-39/waterfall2.webp",
    artAlt: "A forest waterfall — one of the early exploration locations",
  },
  {
    phase: "02",
    title: "Idle",
    body: "After village arrival, the game respects your calendar. About two new quests unveil per in-game day. Skills advance at daily rollover. When there is nothing urgent, you chat, walk the world, read your chronicle, or wait for tomorrow.",
    art: "/art/converted/batch-2026-05-31_13-04-39/witches-pool.webp",
    artAlt: "A still forest pool — where the player's race is revealed and locked at Silver Lake",
  },
  {
    phase: "03",
    title: "Gather",
    body: "The Village is the multiplayer hub: arena matches, mayor elections, player-posted tavern quests, a player market, and community building projects funded by shared resources. Your solo journey becomes a social life.",
    art: "/art/environments/cliffbury-village-map.png",
    artAlt: "Map of Cliffbury Village — the multiplayer hub district",
  },
] as const;

export function ExperienceSection() {
  return (
    <SectionShell
      id="experience"
      kicker="Player journey"
      title="Solo hook → idle rhythm → shared world"
      subtitle="A deliberate funnel: binge the Forest, lock identity at Silver Lake, then live in the Village with everyone else."
      altBackground
    >
      <ol className="space-y-12">
        {STEPS.map((step, index) => (
          <FadeIn key={step.phase} delayMs={index * 80}>
            <li className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <p className="investor-kicker mb-2">{step.phase}</p>
                <h3 className="investor-display text-2xl font-semibold text-[var(--candle-wax)] sm:text-3xl">
                  {step.title}
                </h3>
                <p className="investor-body mt-3">{step.body}</p>
              </div>
              <figure className="overflow-hidden rounded-xl border border-[var(--candle-rule)]">
                <img
                  src={publicAsset(step.art)}
                  alt={step.artAlt}
                  className="aspect-[4/3] w-full object-cover"
                  width={800}
                  height={600}
                  loading="lazy"
                />
              </figure>
            </li>
          </FadeIn>
        ))}
      </ol>
    </SectionShell>
  );
}
