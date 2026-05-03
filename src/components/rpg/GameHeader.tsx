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

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
  /** Pacing & debug items in the ⋯ menu (Advance day, 5‑min days, rapid sim, etc.). */
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
  const muted = useAudioMuted();

  const muteButton = (
    <button
      type="button"
      onClick={toggleAudioMuted}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      title={muted ? 'Unmute music' : 'Mute music'}
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
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--candle-rule)] bg-black/40 px-2 py-0.5 font-serif text-sm text-[var(--candle-ink)] backdrop-blur-sm">
        <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-1">
          <p className="min-w-0 text-center font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
            Day {dayCounter}
          </p>
          <div className="flex min-w-0 justify-center">
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
          </div>
          <p className="min-w-0 truncate text-center font-serif text-[0.625rem] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
            {UI_VERSION_LABEL}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1">
          <p
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] ${locationIndicatorClass}`}
          >
            {currentLocation}
          </p>
          {muteButton}
        </div>
      </div>
    </header>
  );
}
