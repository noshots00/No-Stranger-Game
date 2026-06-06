import type { ReactNode } from "react";

import { FadeIn } from "@investor/components/FadeIn";
import { cn } from "@investor/lib/cn";

type SectionShellProps = {
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  altBackground?: boolean;
};

export function SectionShell({
  id,
  kicker,
  title,
  subtitle,
  children,
  className,
  altBackground = false,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        altBackground && "border-y border-[var(--candle-rule)]",
        altBackground && "bg-[color-mix(in_srgb,var(--candle-hearth)_40%,transparent)]",
        className,
      )}
    >
      <div className="investor-section">
        <FadeIn>
          {kicker ? <p className="investor-kicker mb-3">{kicker}</p> : null}
          <h2 className="investor-display text-3xl font-semibold text-[var(--candle-ink)] sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="investor-body mt-4 max-w-3xl">{subtitle}</p>
          ) : null}
        </FadeIn>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
