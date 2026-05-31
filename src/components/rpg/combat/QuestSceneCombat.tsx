import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import { QUEST_SCENE_CONTINUE } from '../typography/rpgDialogTypography';
import { RPG_UI_BODY, RPG_UI_CAPTION, RPG_UI_EMPHASIS, RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';
import type { CombatLogLine } from './combatLog';

type QuestSceneCombatProps = {
  displayName: string;
  combatLog: CombatLogLine[];
  logEndRef: RefObject<HTMLDivElement | null>;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  onFlee: () => void;
  fleeDisabled?: boolean;
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
        <span className={RPG_UI_CAPTION}>{label}</span>
        <span className={RPG_UI_CAPTION}>
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
  combatLog,
  logEndRef,
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  onFlee,
  fleeDisabled = false,
}: QuestSceneCombatProps) {
  return (
    <>
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
              className={cn(
                entry.tone === 'narrator' && `${RPG_UI_LOG_LINE} italic text-[var(--candle-ink-faint)]`,
                entry.tone === 'player' && `${RPG_UI_BODY} text-[var(--candle-wax)]`,
                entry.tone === 'enemy' && RPG_UI_BODY
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

      <div className="quest-scene-action-box rpg-panel facsimile-scroll px-1.5 py-1">
        <div className="quest-scene-action-inner space-y-1">
          <p className={cn(RPG_UI_EMPHASIS, 'px-0.5')}>Battle — {displayName}</p>
          <div className="flex gap-2 px-0.5">
            <CombatHpBar label="You" current={playerHp} max={playerMaxHp} variant="player" />
            <CombatHpBar label={displayName} current={enemyHp} max={enemyMaxHp} variant="enemy" />
          </div>
          <div className="px-0.5">
            <button
              type="button"
              disabled={fleeDisabled}
              onClick={onFlee}
              className={cn(QUEST_SCENE_CONTINUE, fleeDisabled && 'cursor-not-allowed opacity-50')}
            >
              Flee
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
