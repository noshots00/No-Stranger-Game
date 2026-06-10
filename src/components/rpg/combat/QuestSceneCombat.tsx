import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import { getRacePortraitSrc } from '@/components/rpg/rpgArtAssignments';
import { QuestSceneActionBox } from '../quest-scene/QuestSceneActionBox';
import { QuestSceneContentPanel } from '../quest-scene/QuestSceneContentPanel';
import {
  QUEST_SCENE_CONTINUE,
  QUEST_SCENE_META,
  QUEST_SCENE_RESPONSE,
} from '../typography/rpgDialogTypography';
import { RPG_UI_EMPHASIS, RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';
import type { CombatLogLine } from './combatLog';

import type { CombatResolutionOutcome } from './useCombatEncounter';

type QuestSceneCombatProps = {
  displayName: string;
  /** Defaults to "You". */
  playerLabel?: string;
  /** Defaults to `displayName`. */
  enemyLabel?: string;
  playerPortraitSrc?: string;
  playerPortraitAlt?: string;
  enemyPortraitSrc?: string;
  enemyPortraitAlt?: string;
  combatLog: CombatLogLine[];
  logEndRef: RefObject<HTMLDivElement | null>;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  onFastForward: () => void;
  fastForwardDisabled?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
  pauseDisabled?: boolean;
  resolutionOutcome?: CombatResolutionOutcome | null;
  resolutionLines?: readonly string[];
  onDismissResolution?: () => void;
  actionBoxRef?: RefObject<HTMLDivElement | null>;
};

function hpPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((current / max) * 100);
}

import { SpellNameInText } from '../spells/SpellNameInText';

function CombatLogLineText({ entry, enemyName }: { entry: CombatLogLine; enemyName: string }) {
  if (entry.tone === 'enemy') {
    if (entry.text.startsWith(enemyName)) {
      return (
        <>
          <span className="rpg-combat-enemy-name">{enemyName}</span>
          <SpellNameInText text={entry.text.slice(enemyName.length)} />
        </>
      );
    }
    return (
      <span className="text-[var(--combat-enemy-ink-soft)]">
        <SpellNameInText text={entry.text} />
      </span>
    );
  }
  return <SpellNameInText text={entry.text} />;
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
        <span
          className={cn(
            QUEST_SCENE_META,
            variant === 'enemy' && 'rpg-combat-enemy-name font-semibold normal-case tracking-normal'
          )}
        >
          {label}
        </span>
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

function CombatDuelPortrait({
  src,
  alt,
  label,
  variant,
}: {
  src: string;
  alt: string;
  label: string;
  variant: 'player' | 'enemy';
}) {
  return (
    <div
      className={cn(
        'rpg-combat-duel-fighter min-w-0 flex-1',
        variant === 'enemy' && 'rpg-combat-duel-fighter--enemy'
      )}
    >
      <img src={src} alt={alt} className="rpg-combat-duel-portrait" loading="lazy" />
      <p
        className={cn(
          QUEST_SCENE_META,
          'mt-0.5 truncate text-center',
          variant === 'enemy' && 'rpg-combat-enemy-name font-semibold normal-case tracking-normal'
        )}
      >
        {label}
      </p>
    </div>
  );
}

function CombatResolutionPanel({
  outcome,
  lines,
  onContinue,
}: {
  outcome: CombatResolutionOutcome;
  lines: readonly string[];
  onContinue: () => void;
}) {
  const isVictory = outcome === 'victory';
  return (
    <div
      className={cn(
        'rpg-combat-resolution rpg-panel border-x-0 px-2 py-2',
        isVictory ? 'rpg-combat-resolution--victory' : 'rpg-combat-resolution--defeat'
      )}
    >
      <p className="rpg-combat-resolution-headline">{isVictory ? 'Victory' : 'Defeat'}</p>
      {lines.length > 0 ? (
        <div className="mt-1 space-y-1">
          {lines.map((line) => (
            <p key={line} className={cn(QUEST_SCENE_RESPONSE, 'whitespace-pre-line text-center')}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
      <button type="button" className={cn(QUEST_SCENE_CONTINUE, 'mt-2 w-full')} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

export function QuestSceneCombat({
  displayName,
  playerLabel = 'You',
  enemyLabel,
  playerPortraitSrc,
  playerPortraitAlt,
  enemyPortraitSrc,
  enemyPortraitAlt,
  combatLog,
  logEndRef,
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  onFastForward,
  fastForwardDisabled = false,
  isPaused = false,
  onTogglePause,
  pauseDisabled = false,
  resolutionOutcome = null,
  resolutionLines = [],
  onDismissResolution,
  actionBoxRef,
}: QuestSceneCombatProps) {
  const enemyName = enemyLabel ?? displayName;
  const resolvedPlayerPortrait = playerPortraitSrc ?? getRacePortraitSrc(null);
  const resolvedEnemyPortrait = enemyPortraitSrc ?? getRacePortraitSrc(null);
  const isResolution = resolutionOutcome != null && onDismissResolution != null;

  return (
    <QuestSceneContentPanel>
      <div className="rpg-combat-duel-strip rpg-panel border-x-0 border-b border-t-0 px-2 py-1.5">
        <CombatDuelPortrait
          src={resolvedPlayerPortrait}
          alt={playerPortraitAlt ?? playerLabel}
          label={playerLabel}
          variant="player"
        />
        <span className={cn(RPG_UI_EMPHASIS, 'rpg-combat-duel-vs shrink-0 px-1 opacity-70')}>vs</span>
        <CombatDuelPortrait
          src={resolvedEnemyPortrait}
          alt={enemyPortraitAlt ?? enemyName}
          label={enemyName}
          variant="enemy"
        />
      </div>

      <div
        className={cn(
          'quest-scene-text-box rpg-panel rpg-combat-log facsimile-scroll border-x-0 px-2.5 py-2',
          isResolution && 'opacity-85'
        )}
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
              <CombatLogLineText entry={entry} enemyName={enemyName} />
            </p>
          ))}
          <div ref={logEndRef} className="h-px" aria-hidden />
        </div>
      </div>

      <QuestSceneActionBox ref={actionBoxRef} innerClassName="space-y-1">
        {isResolution ? (
          <>
            <CombatResolutionPanel
              outcome={resolutionOutcome}
              lines={resolutionLines}
              onContinue={onDismissResolution}
            />
            <div className="flex gap-2 px-0.5">
              <CombatHpBar label={playerLabel} current={playerHp} max={playerMaxHp} variant="player" />
              <CombatHpBar label={enemyName} current={enemyHp} max={enemyMaxHp} variant="enemy" />
            </div>
          </>
        ) : (
          <>
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className={cn(RPG_UI_EMPHASIS, 'min-w-0 truncate')}>
            Battle — {playerLabel} vs{' '}
            <span className="rpg-combat-enemy-name">{enemyName}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {onTogglePause ? (
              <button
                type="button"
                disabled={pauseDisabled}
                onClick={onTogglePause}
                aria-pressed={isPaused}
                className={cn(
                  QUEST_SCENE_CONTINUE,
                  pauseDisabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            ) : null}
            <button
              type="button"
              disabled={fastForwardDisabled}
              onClick={onFastForward}
              className={cn(
                QUEST_SCENE_CONTINUE,
                fastForwardDisabled && 'cursor-not-allowed opacity-50'
              )}
            >
              Fast-forward
            </button>
          </div>
        </div>
        <div className="flex gap-2 px-0.5">
          <CombatHpBar label={playerLabel} current={playerHp} max={playerMaxHp} variant="player" />
          <CombatHpBar label={enemyName} current={enemyHp} max={enemyMaxHp} variant="enemy" />
        </div>
          </>
        )}
      </QuestSceneActionBox>
    </QuestSceneContentPanel>
  );
}
