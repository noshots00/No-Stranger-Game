import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toggleAudioMuted, useAudioMuted } from '../audio/audioMute';

export type CharacterTabTopBarProps = {
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
};

/** Music mute + dev tools; shown only on the Character tab. */
export function CharacterTabTopBar({
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
}: CharacterTabTopBarProps) {
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
    <div
      className="sticky top-0 z-10 -mt-0.5 mb-2 flex items-center justify-end gap-1 border-b border-[var(--candle-rule)]/70 bg-black/45 px-2 py-1 backdrop-blur-[6px]"
      role="toolbar"
      aria-label="Character screen tools"
    >
      {muteButton}
      {showDevTools ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
              aria-label="Developer menu"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="whisper-tooltip-surface min-w-[12rem] font-serif text-sm">
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
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
