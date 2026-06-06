import { FadeIn } from "@investor/components/FadeIn";

const CONTACT_PROFILE_URL =
  "https://ditto.pub/npub16rlupr98se9xddsxlwg5kyknmvd3nf4ssv6qjayqvedkemyrz8jqejmtv5";

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-[var(--candle-rule)]">
      <div className="investor-section py-16 sm:py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="investor-kicker mb-3">Get in touch</p>
            <h2 className="investor-display text-3xl font-semibold text-[var(--candle-ink)] sm:text-4xl">
              Request a walkthrough
            </h2>
            <p className="investor-body mt-4">
              See the Forest arc, village multiplayer, and Nostr architecture in a live
              demo. We are raising to expand content, social systems, and player growth.
            </p>
            <a
              href={CONTACT_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--candle-flame-soft)] bg-[var(--candle-flame-glow)] px-8 py-3 text-base font-semibold text-[var(--candle-wax)] transition hover:border-[var(--candle-flame)] hover:bg-[var(--candle-flame-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--candle-flame)]"
            >
              Contact me on Ditto
            </a>
            <p className="mt-4 break-all text-sm text-[var(--candle-ink-faint)]">
              <a
                href={CONTACT_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--candle-rule)] underline-offset-2 hover:text-[var(--candle-ink-soft)]"
              >
                ditto.pub/npub16rlupr…jmtv5
              </a>
            </p>
          </div>
        </FadeIn>
      </div>
      <footer className="border-t border-[var(--candle-rule)] px-5 py-8 text-center">
        <p className="font-cormorant text-lg text-[var(--candle-ink-faint)]">
          No Stranger Game
        </p>
        <p className="mt-1 text-xs text-[var(--candle-ink-faint)]">
          Confidential investor overview · Not indexed
        </p>
      </footer>
    </section>
  );
}
