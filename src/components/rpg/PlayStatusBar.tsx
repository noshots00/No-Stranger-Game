import { useEffect, useState } from 'react';
import { toggleAudioMuted, useAudioMuted } from './audio/audioMute';

type PlayStatusBarProps = {
  /** 0-100 player health (clamped). */
  health: number;
  /** Wall-clock ms when the next in-game day rolls over; null while loading. */
  nextDayResetMs: number | null;
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatClock = (now: Date): string => {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  const seconds = pad2(now.getSeconds());
  return `${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const formatResetIn = (nextResetMs: number | null, now: number): string => {
  if (nextResetMs === null) return 'Reset in --h';
  const remainingMs = Math.max(0, nextResetMs - now);
  const hours = remainingMs / 3_600_000;
  return `Reset in ${hours.toFixed(1)}h`;
};

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function PlayStatusBar({ health, nextDayResetMs }: PlayStatusBarProps) {
  const now = useNow(1000);
  const muted = useAudioMuted();

  const clampedHealth = Math.max(0, Math.min(100, Math.round(health)));
  const fillPct = `${clampedHealth}%`;
  const clockText = formatClock(new Date(now));
  const resetText = formatResetIn(nextDayResetMs, now);

  return (
    <div className="mx-auto w-3/4 select-none">
      <div
        className="flex items-center gap-3 rounded-md border border-[var(--candle-rule)] bg-black/40 px-3 py-1.5 font-serif text-[11px] text-[var(--candle-ink-soft)] backdrop-blur-sm"
        role="status"
        aria-label="Player status"
      >
        <div
          className="relative h-3 w-[200px] flex-shrink-0 overflow-hidden rounded-sm border border-[var(--candle-rule)] bg-black"
          aria-label={`Health ${clampedHealth} out of 100`}
          title={`Health ${clampedHealth}/100`}
        >
          <div
            className="relative h-full bg-gradient-to-b from-rose-500 to-red-700 transition-[width] duration-500 ease-out"
            style={{ width: fillPct }}
          >
            <span aria-hidden className="hp-shimmer pointer-events-none absolute inset-y-0 -inset-x-1 block" />
          </div>
        </div>

        <div className="flex-1 text-center text-[var(--candle-ink)]" aria-label="Current time">
          <span className="tabular-nums">{clockText}</span>
        </div>

        <div className="flex-shrink-0 text-right text-[var(--candle-ember)]" aria-label="Day reset countdown">
          <span className="tabular-nums">{resetText}</span>
        </div>

        <button
          type="button"
          onClick={toggleAudioMuted}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
          title={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
          className="ml-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[var(--candle-ink-soft)] transition-colors hover:text-[var(--candle-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--candle-flame-soft)]"
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
