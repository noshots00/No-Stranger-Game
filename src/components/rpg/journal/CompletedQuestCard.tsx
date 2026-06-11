import { SpellNameInText } from '../spells/SpellNameInText';
import { WORLD_EVENT_PRINTS_ENABLED } from '../constants';
import type { JournalLogEntry, QuestDefinition } from '../quests/types';
import { RPG_UI_BODY } from '../typography/rpgUiTypography';
import { CompletedQuestStrip } from './CompletedQuestStrip';

type CompletedQuestCardProps = {
  quest: QuestDefinition;
  journalEntry?: JournalLogEntry;
  playerName?: string;
  playerFlags?: readonly string[];
  onOpen?: () => void;
};

export function CompletedQuestCard({
  quest,
  journalEntry,
  playerName = '',
  playerFlags,
  onOpen,
}: CompletedQuestCardProps) {
  const summaryText = journalEntry?.text.trim() ?? '';

  const body = (
    <div className="space-y-1">
      <CompletedQuestStrip quest={quest} playerFlags={playerFlags} />
      {summaryText.length > 0 ? (
        <p className={`whitespace-pre-line ${RPG_UI_BODY}`}>
          <SpellNameInText text={summaryText} playerName={playerName} />
        </p>
      ) : null}
      {WORLD_EVENT_PRINTS_ENABLED && journalEntry?.playMilestones && journalEntry.playMilestones.length > 0 ? (
        <div className="space-y-1 pt-1">
          {journalEntry.playMilestones.map((line, milestoneIdx) => (
            <p
              key={`${journalEntry.id}-milestone-${milestoneIdx}`}
              className="font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80"
            >
              <SpellNameInText text={line} playerName={playerName} />
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!onOpen) {
    return <div className="py-0.5 font-sans select-none">{body}</div>;
  }

  return (
    <button type="button" onClick={onOpen} className="w-full py-0.5 text-left font-sans hover:bg-black/15">
      {body}
    </button>
  );
}
