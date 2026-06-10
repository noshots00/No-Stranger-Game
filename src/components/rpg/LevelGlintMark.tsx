import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import {
  hasPlayedReadableReveal,
  markReadableRevealPlayed,
  useRevealWhenReadable,
} from './hooks/useRevealWhenReadable';

/** Shipped level-up effect (ember sparks). Dev preview compares 1 / 2 / 3. */
export const LEVEL_GLINT_PRODUCTION_VARIANT = '3' as const;

/** First and second gleam pulse offsets after the line is readable (ms). */
export const LEVEL_GLINT_PULSE_AT_MS = [5000, 25000] as const;
export const LEVEL_GLINT_DEV_PULSE_AT_MS = [0, 2000] as const;
const PULSE_ANIMATION_FALLBACK_MS = 1700;

type LevelGlintMarkProps = {
  level: number;
  lineId: string;
  /** Root log line — visibility + burn-in gate for the one-shot FX. */
  revealRootRef: RefObject<HTMLElement | null>;
  /** Dev preview only — arm immediately with shortened pulse delays. */
  forceFresh?: boolean;
  /** Dev preview variant 1 | 2 | 3; production uses LEVEL_GLINT_PRODUCTION_VARIANT. */
  variant?: '1' | '2' | '3';
};

export function LevelGlintMark({
  level,
  lineId,
  revealRootRef,
  forceFresh = false,
  variant = LEVEL_GLINT_PRODUCTION_VARIANT,
}: LevelGlintMarkProps) {
  const [sequenceDone, setSequenceDone] = useState(() => hasPlayedReadableReveal(lineId));
  const [glowing, setGlowing] = useState(() => hasPlayedReadableReveal(lineId));
  const [fresh, setFresh] = useState(false);
  const armedRef = useRef(false);
  const activePulseRef = useRef<1 | 2 | null>(null);

  const canArm = useRevealWhenReadable(revealRootRef, lineId, {
    force: forceFresh,
    enabled: !sequenceDone,
  });

  const runPulse = useCallback((pulseIndex: 1 | 2) => {
    activePulseRef.current = pulseIndex;
    setFresh(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFresh(true));
    });
  }, []);

  const completePulse = useCallback(() => {
    setFresh(false);
    setGlowing(true);
    if (activePulseRef.current === 2) {
      if (!hasPlayedReadableReveal(lineId)) {
        markReadableRevealPlayed(lineId);
      }
      setSequenceDone(true);
    }
    activePulseRef.current = null;
  }, [lineId]);

  useEffect(() => {
    if (!canArm || sequenceDone || armedRef.current) return;
    armedRef.current = true;

    const [firstMs, secondMs] = forceFresh ? LEVEL_GLINT_DEV_PULSE_AT_MS : LEVEL_GLINT_PULSE_AT_MS;
    const firstTimer = window.setTimeout(() => runPulse(1), firstMs);
    const secondTimer = window.setTimeout(() => runPulse(2), secondMs);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [canArm, forceFresh, runPulse, sequenceDone]);

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(completePulse, PULSE_ANIMATION_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [completePulse, fresh]);

  const handleAnimationEnd = useCallback(() => {
    completePulse();
  }, [completePulse]);

  return (
    <span
      className={cn(
        'level-glint-mark',
        `level-glint-mark--${variant}`,
        fresh && 'level-glint-mark--fresh',
        (glowing || sequenceDone) && 'level-glint-mark--played'
      )}
      onAnimationEnd={handleAnimationEnd}
    >
      {`Level ${level}`}
    </span>
  );
}

/** Dev preview rows without a parent log line ref. */
export function LevelGlintMarkPreview({
  level,
  lineId,
  forceFresh = false,
  variant = LEVEL_GLINT_PRODUCTION_VARIANT,
}: Omit<LevelGlintMarkProps, 'revealRootRef'>) {
  const previewRootRef = useRef<HTMLSpanElement>(null);
  return (
    <span ref={previewRootRef}>
      <LevelGlintMark
        level={level}
        lineId={lineId}
        revealRootRef={previewRootRef}
        forceFresh={forceFresh}
        variant={variant}
      />
    </span>
  );
}
