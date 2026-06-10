import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { HeaderFlyout } from '../HeaderFlyout';
import { toggleAudioMuted, useAudioMuted } from '../audio/audioMute';

export type CharacterScreenCornerControlsProps = {
  showDevTools?: boolean;
  showModifierDetails: boolean;
  onShowModifierDetailsChange: (enabled: boolean) => void;
  showQuestChoiceModifiers?: boolean;
  onShowQuestChoiceModifiersChange?: (enabled: boolean) => void;
  showQuestChoiceEffects?: boolean;
  onShowQuestChoiceEffectsChange?: (enabled: boolean) => void;
  devUnlockAllQuests: boolean;
  onDevUnlockAllQuestsChange: (enabled: boolean) => void;
  onDevGrantCoins?: () => void;
  onLogout: () => void;
  onResetStory: () => void;
};

const menuItemClass =
  'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left font-serif text-sm text-[var(--candle-ink)] hover:bg-black/30 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]';

const menuCheckboxClass =
  'flex w-full cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:bg-black/30 hover:text-[var(--candle-ink)]';

/** Mute + game/dev menu; fixed bottom-left on the Character tab only. */
export function CharacterScreenCornerControls({
  showDevTools = false,
  showModifierDetails,
  onShowModifierDetailsChange,
  showQuestChoiceModifiers = false,
  onShowQuestChoiceModifiersChange,
  showQuestChoiceEffects = false,
  onShowQuestChoiceEffectsChange,
  devUnlockAllQuests,
  onDevUnlockAllQuestsChange,
  onDevGrantCoins,
  onLogout,
  onResetStory,
}: CharacterScreenCornerControlsProps) {
  const muted = useAudioMuted();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

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
      <HeaderFlyout
        open={menuOpen}
        onOpenChange={setMenuOpen}
        align="start"
        side="top"
        ariaLabel="Game and developer menu"
        panelClassName="whisper-tooltip-surface min-w-[12rem] font-serif text-sm"
        trigger={
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]">
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </span>
        }
      >
        {showDevTools ? (
          <>
            <label className={menuCheckboxClass}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={showModifierDetails}
                onChange={(e) => onShowModifierDetailsChange(e.target.checked)}
              />
              <span>Show modifier details</span>
            </label>
            {onShowQuestChoiceModifiersChange ? (
              <label className={menuCheckboxClass}>
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={showQuestChoiceModifiers}
                  onChange={(e) => onShowQuestChoiceModifiersChange(e.target.checked)}
                />
                <span>Show choice modifiers &amp; items</span>
              </label>
            ) : null}
            {onShowQuestChoiceEffectsChange ? (
              <label className={menuCheckboxClass}>
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={showQuestChoiceEffects}
                  onChange={(e) => onShowQuestChoiceEffectsChange(e.target.checked)}
                />
                <span>Show choice flags &amp; routing</span>
              </label>
            ) : null}
            <label className={menuCheckboxClass}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={devUnlockAllQuests}
                onChange={(e) => onDevUnlockAllQuestsChange(e.target.checked)}
              />
              <span>Show all quests</span>
            </label>
            {onDevGrantCoins ? (
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  onDevGrantCoins();
                  closeMenu();
                }}
              >
                Grant 10g 10s 10c
              </button>
            ) : null}
            <div className="my-1 h-px bg-[var(--candle-rule)]" role="separator" />
          </>
        ) : null}
        <button
          type="button"
          className={menuItemClass}
          onClick={() => {
            onLogout();
            closeMenu();
          }}
        >
          Log Out
        </button>
        <button
          type="button"
          className={`${menuItemClass} text-[var(--candle-ember)] hover:text-[var(--candle-wax)]`}
          onClick={() => {
            onResetStory();
            closeMenu();
          }}
        >
          Reset Progress
        </button>
      </HeaderFlyout>
    </div>
  );
}
