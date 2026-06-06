import { FadeIn } from "@investor/components/FadeIn";
import { SectionShell } from "@investor/components/SectionShell";
import { publicAsset } from "@investor/lib/publicAsset";

const WORLD_POINTS = [
  {
    title: "Districts & locations",
    body: "The world grows by district. The Forest (Silver Lake, Waterfall, and more) is live. Future districts — Village outskirts, new biomes — extend the map without resetting players.",
  },
  {
    title: "Emergent identity",
    body: "Race is not chosen from a menu. Early quest choices accumulate race modifiers; Silver Lake reflection locks your subrace. Class locks when any of five archetypes — Warrior, Mage, Rogue, Healer, Ranger — reaches five points.",
  },
  {
    title: "Main quest spine",
    body: "A authored narrative runs Forest → mid-game branches → Village arrival. Side quests hook anywhere. Content ships as TypeScript quest modules — a pipeline, not a one-off script.",
  },
  {
    title: "Jobs & discovery",
    body: "Post-village, players choose one job at a time — Explorer, Stone Cutter, Miner, and more — with daily shifts that yield resources and unlock new locations.",
  },
] as const;

export function WorldSection() {
  return (
    <SectionShell
      id="world"
      kicker="Content moat"
      title="A world that expands — quest by quest"
      subtitle="Literary, choice-driven scenes authored in code. Short narrator lines. Meaningful branches. The main quest is the spine; districts and side content fill the map."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {WORLD_POINTS.map((point, index) => (
          <FadeIn key={point.title} delayMs={index * 70}>
            <article className="investor-card h-full">
              <h3 className="investor-display text-xl font-semibold text-[var(--candle-wax)]">
                {point.title}
              </h3>
              <p className="investor-body mt-2 text-base">{point.body}</p>
            </article>
          </FadeIn>
        ))}
      </div>

      <FadeIn className="mt-8">
        <figure className="overflow-hidden rounded-xl border border-[var(--candle-rule)]">
          <img
            src={publicAsset("/art/converted/batch-2026-05-31_13-04-39/the-lantern-bearers.webp")}
            alt="Lantern bearers walking through a twilight landscape — the folktale tone of the world"
            className="aspect-[21/9] w-full object-cover"
            width={1400}
            height={600}
            loading="lazy"
          />
        </figure>
      </FadeIn>
    </SectionShell>
  );
}
