import { cn } from '@/lib/utils';
import type { QuestDefinition, QuestState, QuestStep } from '../quests/types';
import {
  formatQuestOpenDevLines,
  formatQuestStepFlagsRoutingDevLines,
  formatQuestStepModifierDevLines,
  resolveQuestDevStep,
} from './questDevRail';

const FLAGS_SHELL =
  'rounded border border-amber-500/25 bg-amber-950/40 px-2 py-1 font-mono text-[0.625rem] leading-snug text-amber-100/85';
const MOD_SHELL =
  'rounded border border-emerald-500/25 bg-emerald-950/35 px-2 py-1 font-mono text-[0.625rem] leading-snug text-emerald-100/85';

type QuestDevRailPanelProps = {
  quest: QuestDefinition;
  questState: QuestState;
  activeQuestId: string | null | undefined;
  activeStep: QuestStep | null | undefined;
  playerFlags: readonly string[];
  showFlagsRouting: boolean;
  showModifiers: boolean;
  highlighted?: boolean;
  className?: string;
};

function DevLineList({ lines }: { lines: string[] }) {
  return (
    <ul className="list-none space-y-0.5">
      {lines.map((line, idx) => (
        <li key={`${idx}-${line}`} className="break-words whitespace-pre-wrap">
          {line}
        </li>
      ))}
    </ul>
  );
}

/** Right-rail dev card aligned with a Play journal quest card. */
export function QuestDevRailPanel({
  quest,
  questState,
  activeQuestId,
  activeStep,
  playerFlags,
  showFlagsRouting,
  showModifiers,
  highlighted = false,
  className,
}: QuestDevRailPanelProps) {
  const resolved = resolveQuestDevStep(quest, questState, activeQuestId, activeStep);
  const openLines = formatQuestOpenDevLines(quest.id, playerFlags);
  const flagsLines = resolved && showFlagsRouting
    ? formatQuestStepFlagsRoutingDevLines(quest, resolved.step)
    : [];
  const modifierLines = resolved && showModifiers
    ? formatQuestStepModifierDevLines(quest, resolved.step)
    : [];

  if (!showFlagsRouting && !showModifiers) return null;

  return (
    <div
      className={cn(
        'space-y-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/75 px-2 py-1.5',
        highlighted && 'ring-1 ring-[var(--candle-flame-soft)]/40',
        className
      )}
      aria-label={`Dev: ${quest.title}`}
    >
      <p className="font-serif text-[0.65rem] font-medium leading-snug text-[var(--candle-wax)]">
        {quest.title}
      </p>
      <p className="font-mono text-[0.55rem] text-[var(--candle-ink-faint)]">{quest.id}</p>

      {showFlagsRouting ? (
        <div className="space-y-1">
          <p className="font-serif text-[0.55rem] uppercase tracking-[0.12em] text-amber-200/70">
            Card tap
          </p>
          <div className={FLAGS_SHELL}>
            <DevLineList lines={openLines} />
          </div>
          {resolved && (highlighted || resolved.step.type !== 'choice') ? (
            <>
              <p className="font-serif text-[0.55rem] uppercase tracking-[0.12em] text-amber-200/70">
                {resolved.stepLabel}
              </p>
              <div className={FLAGS_SHELL}>
                <DevLineList lines={flagsLines} />
              </div>
            </>
          ) : resolved ? (
            <p className="font-mono text-[0.55rem] text-[var(--candle-ink-faint)]">
              {resolved.stepLabel} · choice step (open quest for FX)
            </p>
          ) : null}
        </div>
      ) : null}

      {showModifiers && modifierLines.length > 0 ? (
        <div className="space-y-1">
          <p className="font-serif text-[0.55rem] uppercase tracking-[0.12em] text-emerald-200/70">
            {resolved?.stepLabel ?? 'step'}
          </p>
          <div className={MOD_SHELL}>
            <DevLineList lines={modifierLines} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
