import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import { QuestSceneActionBox } from '../quest-scene/QuestSceneActionBox';
import { QuestSceneContentPanel } from '../quest-scene/QuestSceneContentPanel';
import {
  QUEST_SCENE_CONTINUE,
  QUEST_SCENE_META,
  QUEST_SCENE_RESPONSE,
} from '../typography/rpgDialogTypography';
import { RPG_UI_EMPHASIS, RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';
import type { CombatLogLine } from './combatLog';

type QuestSceneCombatProps = {
  displayName: string;
  /** Defaults to "You". */
  playerLabel?: string;
  /** Defaults to `displayName`. */
  enemyLabel?: string;
  combatLog: CombatLogLine[];
  logEndRef: RefObject<HTMLDivElement | null>;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  onFastForward: () => void;
  fastForwardDisabled?: boolean;
  actionBoxRef?: RefObject<HTMLDivElement | null>;
};

function hpPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((current / max) * 100);
}

function CombatHpBar({
  label,
  current,
  max,
  variant,
}: {
  label: string;
  current: number;
  max: number;
  variant: 'player' | 'enemy';
}) {
  const pct = hpPercent(current, max);
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-0.5 flex items-baseline justify-between gap-1">
        <span className={QUEST_SCENE_META}>{label}</span>
        <span className={QUEST_SCENE_META}>
          {current}/{max}
        </span>
      </div>
      <div
        className="rpg-combat-hp-track"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label} health`}
      >
        <div
          className={cn(
            'rpg-combat-hp-fill',
            variant === 'player' ? 'rpg-combat-hp-fill--player' : 'rpg-combat-hp-fill--enemy'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function QuestSceneCombat({
  displayName,
  playerLabel = 'You',
  enemyLabel,
  combatLog,
  logEndRef,
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  onFastForward,
  fastForwardDisabled = false,
  actionBoxRef,
}: QuestSceneCombatProps) {
  const enemyName = enemyLabel ?? displayName;
  return (
    <QuestSceneContentPanel>
      <div
        className="quest-scene-text-box rpg-panel rpg-combat-log facsimile-scroll border-x-0 px-2.5 py-2"
        role="log"
        aria-live="polite"
        aria-label={`Battle with ${displayName}`}
      >
        <div className="space-y-1.5">
          {combatLog.map((entry) => (
            <p
              key={entry.id}
              title={entry.detail}
              className={cn(
                entry.tone === 'narrator' && `${RPG_UI_LOG_LINE} italic text-[var(--candle-ink-faint)]`,
                entry.tone === 'player' && `${QUEST_SCENE_RESPONSE} text-[var(--candle-wax)]`,
                entry.tone === 'enemy' && QUEST_SCENE_RESPONSE
              )}
            >
              {entry.tone === 'enemy' ? (
                <>
                  <span className="font-semibold text-[var(--candle-flame-soft)]">{displayName}: </span>
                  {entry.text}
                </>
              ) : (
                entry.text
              )}
            </p>
          ))}
          <div ref={logEndRef} className="h-px" aria-hidden />
        </div>
      </div>

      <QuestSceneActionBox ref={actionBoxRef} innerClassName="space-y-1">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className={cn(RPG_UI_EMPHASIS, 'min-w-0 truncate')}>
            Battle — {playerLabel} vs {enemyName}
          </p>
          <button
            type="button"
            disabled={fastForwardDisabled}
            onClick={onFastForward}
            className={cn(
              QUEST_SCENE_CONTINUE,
              'shrink-0',
              fastForwardDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            Fast-forward
          </button>
        </div>
        <div className="flex gap-2 px-0.5">
          <CombatHpBar label={playerLabel} current={playerHp} max={playerMaxHp} variant="player" />
          <CombatHpBar label={enemyName} current={enemyHp} max={enemyMaxHp} variant="enemy" />
        </div>
      </QuestSceneActionBox>
    </QuestSceneContentPanel>
  );
}
