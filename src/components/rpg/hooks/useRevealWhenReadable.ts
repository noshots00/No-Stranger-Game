import { useEffect, useState, type RefObject } from 'react';

const playedLineIds = new Set<string>();

/** Whether a highlight line has already played its reveal animation this session. */
export function hasPlayedReadableReveal(lineId: string): boolean {
  return playedLineIds.has(lineId);
}

export function markReadableRevealPlayed(lineId: string): void {
  playedLineIds.add(lineId);
}

type UseRevealWhenReadableOptions = {
  /** Dev preview — arm immediately. */
  force?: boolean;
  /** When false, never arm (e.g. line already played). */
  enabled?: boolean;
};

const BURN_IN_FALLBACK_MS = 650;
const VISIBLE_THRESHOLD = 0.45;

/**
 * Arm a one-shot text highlight only after the line is on screen and any
 * parent `.dialogue-line-reveal` burn-in has finished (or timed out).
 */
export function useRevealWhenReadable(
  rootRef: RefObject<HTMLElement | null>,
  lineId: string,
  { force = false, enabled = true }: UseRevealWhenReadableOptions = {}
): boolean {
  const alreadyPlayed = hasPlayedReadableReveal(lineId);
  const [armed, setArmed] = useState(() => force && !alreadyPlayed);

  useEffect(() => {
    if (force) {
      if (!alreadyPlayed) setArmed(true);
      return;
    }
    if (!enabled || alreadyPlayed) return;

    const el = rootRef.current;
    if (!el) return;

    let cancelled = false;
    let burnInTimer: ReturnType<typeof setTimeout> | null = null;

    const arm = () => {
      if (cancelled || hasPlayedReadableReveal(lineId)) return;
      setArmed(true);
    };

    const afterBurnIn = () => {
      const revealRoot = el.closest('.dialogue-line-reveal');
      if (!revealRoot) {
        arm();
        return;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        revealRoot.removeEventListener('animationend', onAnimationEnd);
        if (burnInTimer) clearTimeout(burnInTimer);
        arm();
      };

      const onAnimationEnd = (event: AnimationEvent) => {
        if (event.target === revealRoot) finish();
      };

      revealRoot.addEventListener('animationend', onAnimationEnd);
      burnInTimer = setTimeout(finish, BURN_IN_FALLBACK_MS);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        afterBurnIn();
      },
      { threshold: VISIBLE_THRESHOLD }
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (burnInTimer) clearTimeout(burnInTimer);
    };
  }, [rootRef, lineId, force, enabled, alreadyPlayed]);

  if (alreadyPlayed && !force) return false;
  return armed;
}
