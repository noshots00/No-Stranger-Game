import { FadeIn } from "@investor/components/FadeIn";
import { publicAsset } from "@investor/lib/publicAsset";

const HERO_ART = publicAsset("/art/converted/nswoods.webp");

export function HeroSection() {
  return (
    <header className="relative overflow-hidden">
      <div className="investor-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="investor-section relative pb-8 pt-10 sm:pb-12 sm:pt-16">
        <FadeIn>
          <p className="investor-kicker mb-4">Investor overview</p>
          <h1 className="investor-display max-w-3xl text-4xl font-semibold leading-[1.12] text-[var(--candle-ink)] sm:text-5xl lg:text-6xl">
            The first multiplayer idle RPG
          </h1>
          <p className="investor-body mt-5 max-w-2xl text-lg sm:text-xl">
            A choice-driven story you play in minutes — then a shared world that keeps
            moving while you are away. Real players. Real politics. No grind MMO.
          </p>
          <p className="mt-4 font-cormorant text-xl italic text-[var(--candle-ink-faint)] sm:text-2xl">
            By a single flame, the room remembers.
          </p>
        </FadeIn>

        <FadeIn className="mt-10" delayMs={120}>
          <figure className="overflow-hidden rounded-2xl border border-[var(--candle-rule)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <img
              src={HERO_ART}
              alt="A candlelit forest path — the opening district of No Stranger Game"
              className="aspect-[16/10] w-full object-cover"
              width={1200}
              height={750}
              loading="eager"
            />
          </figure>
        </FadeIn>
      </div>
    </header>
  );
}
