import { ContactSection } from "@investor/sections/ContactSection";
import { ExperienceSection } from "@investor/sections/ExperienceSection";
import { HeroSection } from "@investor/sections/HeroSection";
import { IdeaSection } from "@investor/sections/IdeaSection";
import { NostrSection } from "@investor/sections/NostrSection";
import { RoadmapSection } from "@investor/sections/RoadmapSection";
import { SocialSection } from "@investor/sections/SocialSection";
import { WorldSection } from "@investor/sections/WorldSection";

function SiteHeader() {
  return (
    <div className="sticky top-0 z-50 border-b border-[var(--candle-rule)] bg-[var(--candle-void)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <p className="font-cormorant text-lg font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
          No Stranger Game
        </p>
        <nav className="hidden gap-6 text-sm text-[var(--candle-ink-soft)] sm:flex" aria-label="Page sections">
          <a href="#social" className="hover:text-[var(--candle-wax)]">
            Social
          </a>
          <a href="#nostr" className="hover:text-[var(--candle-wax)]">
            Nostr
          </a>
          <a href="#roadmap" className="hover:text-[var(--candle-wax)]">
            Roadmap
          </a>
          <a href="#contact" className="hover:text-[var(--candle-wax)]">
            Contact
          </a>
        </nav>
      </div>
    </div>
  );
}

export function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <IdeaSection />
        <ExperienceSection />
        <SocialSection />
        <NostrSection />
        <WorldSection />
        <RoadmapSection />
        <ContactSection />
      </main>
    </>
  );
}
