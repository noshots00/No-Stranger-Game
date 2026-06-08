import type { ReactNode } from 'react';
import { UI_VERSION_LABEL } from './constants';
import { cn } from '@/lib/utils';

type HeaderHealthBarProps = {
  /** Current HP (absolute, not 0–100). */
  health: number;
  /** Max HP for fill percentage. */
  maxHealth: number;
  /** Centered inside the bar (defaults to app version). */
  label?: ReactNode;
  className?: string;
  /** When the bar is wrapped in a dev-tools button, omit inner `role="meter"`. */
  hideMeterSemantics?: boolean;
};

/** Compact HP meter with version label centered inside the track. */
export function HeaderHealthBar({
  health,
  maxHealth,
  label = UI_VERSION_LABEL,
  className,
  hideMeterSemantics = false,
}: HeaderHealthBarProps) {
  const safeMax = maxHealth > 0 ? maxHealth : 1;
  const safeHealth = Number.isFinite(health) ? Math.max(0, Math.min(safeMax, health)) : safeMax;
  const pct = Math.max(0, Math.min(100, Math.round((safeHealth / safeMax) * 100)));

  return (
    <div
      className={cn('relative mx-auto h-3.5 w-full max-w-[4.75rem]', className)}
      {...(hideMeterSemantics
        ? {}
        : {
            role: 'meter' as const,
            'aria-label': 'Health',
            'aria-valuenow': safeHealth,
            'aria-valuemin': 0,
            'aria-valuemax': safeMax,
          })}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-sm border border-[var(--candle-rule)]/70 bg-black/55"
        aria-hidden={hideMeterSemantics ? true : undefined}
      >
        <div
          className="relative h-full bg-gradient-to-r from-red-950/95 via-red-700/85 to-red-600/75 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        >
          <div className="hp-shimmer pointer-events-none absolute inset-0" />
        </div>
      </div>
      <div className="relative z-[1] flex h-full min-w-0 items-center justify-center px-1">
        <span className="pointer-events-none min-w-0 truncate text-center font-serif text-[0.5rem] uppercase leading-none tracking-[0.14em] text-[var(--candle-ink)] drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
          {label}
        </span>
      </div>
    </div>
  );
}
