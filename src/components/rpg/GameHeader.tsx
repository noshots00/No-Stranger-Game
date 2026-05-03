import { MoreHorizontal } from 'lucide-react';
import { UI_VERSION_LABEL } from './constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toggleAudioMuted, useAudioMuted } from './audio/audioMute';
import { formatResetIn, formatResetInCompact, formatWallClockTime } from './statusBarFormat';
import { useWallClock } from './hooks/useWallClock';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
  /** 0-100 player health (clamped). */
  health: number;
  /** Wall-clock ms when the next in-game day rolls over; null while loading. */
  nextDayResetMs: number | null;
  /** Vite dev only: items 1–5 below. */
  showDevTools?: boolean;
  onAdvanceDay: () => void;
  devFiveMinuteDays?: boolean;
  onDevFiveMinuteDaysChange?: (enabled: boolean) => void;
  rapidDaySimulation: boolean;
  onRapidDaySimulationChange: (enabled: boolean) => void;
  showModifierDetails: boolean;
  onShowModifierDetailsChange: (enabled: boolean) => void;
  devUnlockAllQuests: boolean;
  onDevUnlockAllQuestsChange: (enabled: boolean) => void;
  onLogout: () => void;
  onResetStory: () => void;
};

export function GameHeader({
  dayCounter,
  currentLocation,
  locationIndicatorClass,
  health,
  nextDayResetMs,
  showDevTools = false,
  onAdvanceDay,
  devFiveMinuteDays = false,
  onDevFiveMinuteDaysChange,
  rapidDaySimulation,
  onRapidDaySimulationChange,
  showModifierDetails,
  onShowModifierDetailsChange,
  devUnlockAllQuests,
  onDevUnlockAllQuestsChange,
  onLogout,
  onResetStory,
}: GameHeaderProps) {
  const wallNow = useWallClock(1000);
  const muted = useAudioMuted();
  const clampedHealth = Math.max(0, Math.min(100, Math.round(health)));
  const fillPct = `${clampedHealth}%`;
  const clockText = formatWallClockTime(new Date(wallNow));
  const resetText = formatResetIn(nextDayResetMs, wallNow);
  const resetCompact = formatResetInCompact(nextDayResetMs, wallNow);

  const healthTrack = (
    <div
      className="relative h-2.5 min-h-[10px] w-[min(5.5rem,22vw)] max-w-full shrink-0 overflow-hidden rounded-sm border border-[var(--candle-rule)] bg-black sm:h-3 sm:min-h-[12px] sm:w-[min(6.5rem,18vw)]"
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
  );

  const muteButton = (
    <button
      type="button"
      onClick={toggleAudioMuted}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      title={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[var(--candle-ink-soft)] transition-colors hover:text-[var(--candle-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--candle-flame-soft)]"
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
  );

  return (
    <header className="sticky top-0 z-20 -mx-1 select-none backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border border-[var(--candle-rule)] bg-black/40 px-2 py-1 font-serif text-sm text-[var(--candle-ink)] backdrop-blur-sm sm:justify-between sm:gap-x-3 sm:px-3 sm:py-1">
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <p className="shrink-0 font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
            Day {dayCounter}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
                aria-label="Game menu"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="whisper-tooltip-surface min-w-[12rem] font-serif text-sm">
              {showDevTools ? (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer font-serif text-[var(--candle-ink)] focus:bg-black/30 focus:text-[var(--candle-wax)]"
                    onSelect={() => onAdvanceDay()}
                  >
                    Advance 24 hours
                  </DropdownMenuItem>
                  {onDevFiveMinuteDaysChange ? (
                    <DropdownMenuCheckboxItem
                      className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                      checked={devFiveMinuteDays}
                      onCheckedChange={(v) => onDevFiveMinuteDaysChange(v === true)}
                    >
                      Set reset to every 5 minutes
                    </DropdownMenuCheckboxItem>
                  ) : null}
                  <DropdownMenuCheckboxItem
                    className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                    checked={rapidDaySimulation}
                    onCheckedChange={(v) => onRapidDaySimulationChange(v === true)}
                  >
                    Simulate 24 hours every 2 seconds
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                    checked={showModifierDetails}
                    onCheckedChange={(v) => onShowModifierDetailsChange(v === true)}
                  >
                    Show modifier details
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                    checked={devUnlockAllQuests}
                    onCheckedChange={(v) => onDevUnlockAllQuestsChange(v === true)}
                  >
                    Show all quests
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator className="bg-[var(--candle-rule)]" />
                </>
              ) : null}
              <DropdownMenuItem
                className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                onSelect={() => onLogout()}
              >
                Log Out
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-serif text-[var(--candle-ember)] focus:bg-black/30 focus:text-[var(--candle-wax)]"
                onSelect={() => onResetStory()}
              >
                Reset Progress
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="shrink-0 font-serif text-[0.625rem] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
            {UI_VERSION_LABEL}
          </p>
          <p
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] ${locationIndicatorClass}`}
          >
            {currentLocation}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-end">
          {healthTrack}
          <span className="shrink-0 font-serif text-sm tabular-nums text-[var(--candle-ink)]" aria-label="Current time">
            {clockText}
          </span>
          <span
            className="min-w-0 font-serif text-xs tabular-nums text-[var(--candle-ember)] sm:text-sm"
            aria-label={`Day reset countdown: ${resetText}`}
            title={resetText}
          >
            <span className="sm:hidden">
              <span className="text-[var(--candle-ink-soft)]">Next </span>
              {resetCompact}
            </span>
            <span className="hidden sm:inline">{resetText}</span>
          </span>
          {muteButton}
        </div>
      </div>
    </header>
  );
}
