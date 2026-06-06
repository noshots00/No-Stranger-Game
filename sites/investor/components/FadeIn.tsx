import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@investor/lib/cn";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function FadeIn({ children, className, delayMs = 0 }: FadeInProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.12 });

  return (
    <div
      ref={ref}
      className={cn("investor-fade-in", inView && "is-visible", className)}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
