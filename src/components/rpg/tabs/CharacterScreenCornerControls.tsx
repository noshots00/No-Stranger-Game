import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toggleAudioMuted, useAudioMuted } from '../audio/audioMute';

export type CharacterScreenCornerControlsProps = {
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

/** Mute + game/dev menu; fixed bottom-left on the Character tab only. */
export function CharacterScreenCornerControls({
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
}: CharacterScreenCornerControlsProps) {
  const muted = useAudioMuted();

  const muteButton = (
    <button
      type="button"
      onClick={toggleAudioMuted}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      title={muted ? 'Unmute music' : 'Mute music'}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--candle-ink-soft)] transition-colors hover:text-[var(--candle-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--candle-flame-soft)]"
    >
      {muted ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );

  return (
    <div
      className="pointer-events-auto fixed z-30 flex items-center gap-0.5 rounded-md border border-[var(--candle-rule)]/55 bg-black/60 px-0.5 py-0.5 pl-[var(--facsimile-scrollbar-width)] backdrop-blur-sm"
      style={{ left: 'max(0.5rem, env(safe-area-inset-left, 0px))', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.35rem)' }}
      role="toolbar"
      aria-label="Character screen tools"
    >
      {muteButton}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
            aria-label="Game and developer menu"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="whisper-tooltip-surface min-w-[12rem] font-serif text-sm">
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
  );
}
