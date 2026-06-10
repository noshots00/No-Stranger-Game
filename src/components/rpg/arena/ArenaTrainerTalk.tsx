import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { QuestSceneCombat } from '@/components/rpg/combat/QuestSceneCombat';
import { NpcTalkSceneLayout } from '@/components/rpg/npc/NpcTalkSceneLayout';
import { getNpcTalkDisplayName } from '@/components/rpg/npc/npcTalkRegistry';
import { getLatestNpcLine } from '@/components/rpg/npc/npcTalkTranscript';
import { getNpcPortraitSrc, NPC_TALK_BACKGROUND_BY_ID } from '@/components/rpg/rpgArtAssignments';
import { TRAINER_OPENING_LINE } from './arenaTrainerDialogueTree';
import type { useArenaTrainerTalk } from './useArenaTrainerTalk';

export type ArenaTrainerTalkViewProps = ReturnType<typeof useArenaTrainerTalk> & {
  className?: string;
};

export function ArenaTrainerTalkView({
  transcript,
  logEndRef,
  combat,
  isCombatMode,
  className,
}: ArenaTrainerTalkViewProps) {
  const actionBoxRef = useRef<HTMLDivElement | null>(null);
  const displayName = getNpcTalkDisplayName('trainer');
  const portraitSrc = getNpcPortraitSrc('trainer');
  const backgroundSrc = NPC_TALK_BACKGROUND_BY_ID.trainer ?? portraitSrc;
  const currentNpcLine = getLatestNpcLine(transcript) || TRAINER_OPENING_LINE;

  if (isCombatMode) {
    return (
      <div className={cn('quest-scene-root quest-scene-root--npc-talk quest-scene-root--combat h-full min-h-0', className)}>
        <QuestSceneCombat
          displayName={combat.displayName}
          playerLabel={combat.playerLabel}
          playerPortraitSrc={combat.playerPortraitSrc}
          playerPortraitAlt={combat.playerPortraitAlt}
          enemyPortraitSrc={combat.enemyPortraitSrc}
          enemyPortraitAlt={combat.enemyPortraitAlt}
          combatLog={combat.combatLog}
          logEndRef={combat.logEndRef}
          playerHp={combat.playerHp}
          playerMaxHp={combat.playerMaxHp}
          enemyHp={combat.enemyHp}
          enemyMaxHp={combat.enemyMaxHp}
          onFastForward={combat.fastForward}
          fastForwardDisabled={combat.phase === 'entering'}
          isPaused={combat.isPaused}
          onTogglePause={combat.togglePause}
          pauseDisabled={combat.isEnding}
          resolutionOutcome={combat.resolutionOutcome}
          resolutionLines={combat.resolutionLines}
          onDismissResolution={combat.dismissResolution}
          actionBoxRef={actionBoxRef}
        />
      </div>
    );
  }

  return (
    <div className={cn('h-full min-h-0', className)}>
      <NpcTalkSceneLayout
        displayName={displayName}
        portraitSrc={portraitSrc}
        portraitAlt={displayName}
        backgroundSrc={backgroundSrc}
        currentNpcLine={currentNpcLine}
        transcript={transcript}
        logEndRef={logEndRef}
        logAriaLabel={`Conversation with ${displayName}`}
        actionBoxRef={actionBoxRef}
      />
    </div>
  );
}
