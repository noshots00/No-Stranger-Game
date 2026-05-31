import { cn } from '@/lib/utils';
import { QuestSceneCombat } from '@/components/rpg/combat/QuestSceneCombat';
import {
  CARL_FAREWELL_LABEL,
} from '@/components/rpg/quests/carlDoorDialogueTree';
import {
  QUEST_SCENE_CHOICE,
  QUEST_SCENE_CHOICE_LABEL,
  QUEST_SCENE_CONTINUE,
  QUEST_SCENE_META,
  QUEST_SCENE_RESPONSE,
} from '../typography/rpgDialogTypography';
import { RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';
import { useCarlDoorTalk } from './useCarlDoorTalk';

type QuestSceneNpcTalkProps = {
  npcTalkId: string;
  stepId: string;
  playerHealth: number;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onStepChoice: (choiceId: string) => void;
};

export function QuestSceneNpcTalk({
  npcTalkId,
  stepId,
  playerHealth,
  onPlayerHealthChange,
  onCombatChromeChange,
  onStepChoice,
}: QuestSceneNpcTalkProps) {
  if (npcTalkId !== 'carl') return null;

  return (
    <QuestSceneCarlTalk
      stepId={stepId}
      playerHealth={playerHealth}
      onPlayerHealthChange={onPlayerHealthChange}
      onCombatChromeChange={onCombatChromeChange}
      onFarewell={() => onStepChoice('carl-farewell')}
    />
  );
}

function QuestSceneCarlTalk({
  stepId,
  playerHealth,
  onPlayerHealthChange,
  onCombatChromeChange,
  onFarewell,
}: {
  stepId: string;
  playerHealth: number;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onFarewell: () => void;
}) {
  const { transcript, logEndRef, askedDoor, askedSelf, handleChoice, mainChoices, combat, isCombatMode } =
    useCarlDoorTalk({
      stepId,
      playerHealth,
      onPlayerHealthChange,
      onCombatChromeChange,
    });

  if (isCombatMode) {
    return (
      <QuestSceneCombat
        displayName={combat.displayName}
        combatLog={combat.combatLog}
        logEndRef={combat.logEndRef}
        playerHp={combat.playerHp}
        playerMaxHp={combat.playerMaxHp}
        enemyHp={combat.enemyHp}
        enemyMaxHp={combat.enemyMaxHp}
        onFlee={combat.flee}
        fleeDisabled={combat.phase === 'entering'}
      />
    );
  }

  return (
    <>
      <div
        className="quest-scene-text-box rpg-panel facsimile-scroll border-x-0 px-2.5 py-2"
        role="log"
        aria-label="Conversation with Carl"
      >
        <div className="space-y-1.5">
          {transcript.map((entry) => (
            <p
              key={entry.id}
              className={cn(
                entry.role === 'narrator' && `${RPG_UI_LOG_LINE} italic text-[var(--candle-ink-faint)]`,
                entry.role === 'player' && `${QUEST_SCENE_RESPONSE} text-[var(--candle-wax)]`,
                entry.role === 'merchant' && QUEST_SCENE_RESPONSE
              )}
            >
              {entry.role === 'merchant' ? (
                <>
                  <span className="font-semibold text-[var(--candle-flame-soft)]">Carl: </span>
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
        <div className="quest-scene-action-inner">
          <p className={cn(QUEST_SCENE_META, 'px-0.5 py-0.5')}>Speak with Carl</p>
          <ul className="quest-scene-choice-grid">
            {mainChoices.map((choice) => {
              const used =
                choice.type === 'reply' &&
                (choice.id === 'carl-ask-door' ? askedDoor : choice.id === 'carl-ask-self' ? askedSelf : false);
              const label = used ? `${choice.label} (asked)` : choice.label;
              const isAttack = choice.type === 'combat';
              return (
                <li key={choice.id} className={isAttack ? 'quest-scene-choice-span-full' : undefined}>
                  <button
                    type="button"
                    disabled={used}
                    aria-disabled={used || undefined}
                    className={cn(
                      QUEST_SCENE_CHOICE,
                      isAttack && 'rpg-command-chip--danger',
                      used && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => handleChoice(choice)}
                  >
                    <span className={QUEST_SCENE_CHOICE_LABEL}>{label}</span>
                  </button>
                </li>
              );
            })}
            <li className="quest-scene-choice-span-full">
              <button type="button" onClick={onFarewell} className={QUEST_SCENE_CONTINUE}>
                {CARL_FAREWELL_LABEL}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
