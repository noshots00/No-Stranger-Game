import { cn } from '@/lib/utils';
import type { QuestChoice } from '../quests/types';
import { formatQuestChoiceDevLines } from './questChoiceEffectsDev';

const HINT_SHELL =
  'mt-1 rounded border border-amber-500/25 bg-amber-950/40 px-2 py-1 font-mono text-[0.625rem] leading-snug text-amber-100/85';

type QuestChoiceEffectsHintProps = {
  choice: QuestChoice;
  className?: string;
};

/** Dev overlay: flags / routing for a single quest choice. */
export function QuestChoiceEffectsHint({ choice, className }: QuestChoiceEffectsHintProps) {
  const lines = formatQuestChoiceDevLines(choice);
  return (
    <div className={cn(HINT_SHELL, className)} aria-label={`Dev: ${choice.id} effects`}>
      <ul className="list-none space-y-0.5">
        {lines.map((line) => (
          <li key={line} className="break-words">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
