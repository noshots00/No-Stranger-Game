import { cn } from '@/lib/utils';
import type { QuestChoice } from '../quests/types';
import { formatQuestChoiceModifierDevLines } from './questChoiceEffectsDev';

const HINT_SHELL =
  'mt-1 rounded border border-emerald-500/30 bg-emerald-950/35 px-2 py-1 font-mono text-[0.625rem] leading-snug text-emerald-100/90';

type QuestChoiceModifiersHintProps = {
  choice: QuestChoice;
  className?: string;
};

/** Dev overlay: `modifiersDelta`, quest items, and modifier gates for a single quest choice. */
export function QuestChoiceModifiersHint({ choice, className }: QuestChoiceModifiersHintProps) {
  const lines = formatQuestChoiceModifierDevLines(choice);
  if (lines.length === 0) return null;
  return (
    <div className={cn(HINT_SHELL, className)} aria-label={`Dev: ${choice.id} modifiers`}>
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
