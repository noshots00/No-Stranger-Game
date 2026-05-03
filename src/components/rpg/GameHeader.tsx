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

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
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
  return (
    <header className="sticky top-0 z-20 -mx-1 grid grid-cols-4 items-center gap-2 px-1 py-0 backdrop-blur-[6px]">
      <p className="text-center font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
        Day {dayCounter}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mx-auto h-9 w-9 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
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
      <p className="text-center font-serif text-[0.625rem] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
        {UI_VERSION_LABEL}
      </p>
      <p
        className={`justify-self-center rounded-full border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] ${locationIndicatorClass}`}
      >
        {currentLocation}
      </p>
    </header>
  );
}
