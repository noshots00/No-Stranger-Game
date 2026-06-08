import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import { QuestSceneCombat } from '../combat/QuestSceneCombat';
import type { useArenaFightReplay } from './useArenaFightReplay';

type ArenaFightWatchViewProps = ReturnType<typeof useArenaFightReplay> & {
  className?: string;
  actionBoxRef?: RefObject<HTMLDivElement | null>;
};

export function ArenaFightWatchView({
  className,
  combatLog,
  logEndRef,
  fighterAHp,
  fighterBHp,
  fighterAMaxHp,
  fighterBMaxHp,
  fighterAName,
  fighterBName,
  fastForward,
  phase,
  actionBoxRef,
}: ArenaFightWatchViewProps) {
  return (
    <div className={cn('quest-scene-root quest-scene-root--npc-talk quest-scene-root--combat h-full min-h-0', className)}>
      <QuestSceneCombat
        displayName={fighterBName}
        playerLabel={fighterAName}
        enemyLabel={fighterBName}
        combatLog={combatLog}
        logEndRef={logEndRef}
        playerHp={fighterAHp}
        playerMaxHp={fighterAMaxHp}
        enemyHp={fighterBHp}
        enemyMaxHp={fighterBMaxHp}
        onFastForward={fastForward}
        fastForwardDisabled={phase === 'entering'}
        actionBoxRef={actionBoxRef}
      />
    </div>
  );
}
