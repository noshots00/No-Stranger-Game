import type { RefObject } from 'react';

import { cn } from '@/lib/utils';

import { QuestSceneCombat } from '@/components/rpg/combat/QuestSceneCombat';

import { CARL_FAREWELL_LABEL, CARL_OPENING_YELL } from '@/components/rpg/quests/carlDoorDialogueTree';

import { SHANNON_OPENING_LINE } from '@/components/rpg/quests/shannonDialogueTree';

import { useVillageMayorIdentity } from '@/components/rpg/mayorsHut/useVillageMayorIdentity';

import {

  getNpcTalkBackgroundSrc,

  getQuestScenePortraitAlt,

  getQuestScenePortraitSrc,

} from '@/components/rpg/rpgArtAssignments';

import type { QuestDefinition, QuestState, QuestStep } from '@/components/rpg/quests/types';

import { NpcTalkSceneLayout } from '@/components/rpg/npc/NpcTalkSceneLayout';

import { getNpcTalkDisplayName } from '@/components/rpg/npc/npcTalkRegistry';

import { getLatestNpcLine } from '@/components/rpg/npc/npcTalkTranscript';

import {

  QUEST_SCENE_CHOICE,

  QUEST_SCENE_CHOICE_LABEL,

  QUEST_SCENE_CONTINUE,

  QUEST_SCENE_META,

} from '../typography/rpgDialogTypography';

import { useCarlDoorTalk } from './useCarlDoorTalk';

import { useShannonTalk, type ShannonChoice } from './useShannonTalk';



type QuestSceneNpcTalkProps = {

  npcTalkId: string;

  quest: QuestDefinition;

  step: QuestStep;

  questState: QuestState;

  onPlayerHealthChange?: (health: number) => void;

  onCombatChromeChange?: (active: boolean) => void;

  onStepChoice: (choiceId: string) => void;

  actionBoxRef: RefObject<HTMLDivElement | null>;

  playerFlags: string[];

};



export function QuestSceneNpcTalk({

  npcTalkId,

  quest,

  step,

  questState,

  onPlayerHealthChange,

  onCombatChromeChange,

  onStepChoice,

  actionBoxRef,

  playerFlags,

}: QuestSceneNpcTalkProps) {

  if (npcTalkId === 'carl') {

    return (

      <QuestSceneCarlTalk

        quest={quest}

        step={step}

        playerFlags={playerFlags}

        questState={questState}

        onPlayerHealthChange={onPlayerHealthChange}

        onCombatChromeChange={onCombatChromeChange}

        onFarewell={() => onStepChoice('carl-farewell')}

        actionBoxRef={actionBoxRef}

      />

    );

  }



  if (npcTalkId === 'shannon') {

    return (

      <QuestSceneShannonTalk

        quest={quest}

        step={step}

        onComplete={() => onStepChoice('shannon-thanks')}

        actionBoxRef={actionBoxRef}

      />

    );

  }



  return null;

}



function QuestSceneCarlTalk({

  quest,

  step,

  playerFlags,

  questState,

  onPlayerHealthChange,

  onCombatChromeChange,

  onFarewell,

  actionBoxRef,

}: {

  quest: QuestDefinition;

  step: QuestStep;

  playerFlags: string[];

  questState: QuestState;

  onPlayerHealthChange?: (health: number) => void;

  onCombatChromeChange?: (active: boolean) => void;

  onFarewell: () => void;

  actionBoxRef: RefObject<HTMLDivElement | null>;

}) {

  const { transcript, logEndRef, askedDoor, askedSelf, handleChoice, mainChoices, combat, isCombatMode } =

    useCarlDoorTalk({

      stepId: step.id,

      playerFlags,

      questState,

      onPlayerHealthChange,

      onCombatChromeChange,

    });



  const displayName = getNpcTalkDisplayName('carl');

  const portraitSrc = getQuestScenePortraitSrc(quest, step);

  const portraitAlt = getQuestScenePortraitAlt(quest, step);

  const backgroundSrc = getNpcTalkBackgroundSrc('carl', quest, step.id);

  const currentNpcLine = getLatestNpcLine(transcript) || CARL_OPENING_YELL;



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

        onFastForward={combat.fastForward}

        fastForwardDisabled={combat.phase === 'entering'}

        actionBoxRef={actionBoxRef}

      />

    );

  }



  return (

    <NpcTalkSceneLayout

      displayName={displayName}

      portraitSrc={portraitSrc}

      portraitAlt={portraitAlt}

      backgroundSrc={backgroundSrc}

      currentNpcLine={currentNpcLine}

      transcript={transcript}

      logEndRef={logEndRef}

      logAriaLabel={`Conversation with ${displayName}`}

      actionBoxRef={actionBoxRef}

      choicePane={

        <>

          <p className={cn(QUEST_SCENE_META, 'px-0.5 py-0.5')}>What do you do?</p>

          <ul className="quest-scene-choice-grid">

            {mainChoices.map((choice) => {

              const used =

                choice.type === 'reply' &&

                (choice.id === 'carl-ask-door' ? askedDoor : choice.id === 'carl-ask-self' ? askedSelf : false);

              const label = used ? `${choice.label} (asked)` : choice.label;

              const isAttack = choice.type === 'combat';

              return (

                <li key={choice.id}>

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

        </>

      }

    />

  );

}



function isShannonContinueChoice(choice: ShannonChoice): boolean {

  return (

    choice.id === 'shannon-continue' ||

    choice.id === 'shannon-what-now' ||

    choice.id === 'shannon-work' ||

    choice.id === 'shannon-thanks'

  );

}



function QuestSceneShannonTalk({

  quest,

  step,

  onComplete,

  actionBoxRef,

}: {

  quest: QuestDefinition;

  step: QuestStep;

  onComplete: () => void;

  actionBoxRef: RefObject<HTMLDivElement | null>;

}) {

  const { mayorName, portraitSrc } = useVillageMayorIdentity({ enabled: true });

  const { transcript, logEndRef, choices, handleChoice } = useShannonTalk({

    stepId: step.id,

    mayorName,

    onComplete,

  });



  const backgroundSrc = getNpcTalkBackgroundSrc('shannon', quest, step.id);

  const currentNpcLine = getLatestNpcLine(transcript) || SHANNON_OPENING_LINE;



  return (

    <NpcTalkSceneLayout

      displayName={mayorName}

      portraitSrc={portraitSrc}

      portraitAlt={mayorName}

      backgroundSrc={backgroundSrc}

      currentNpcLine={currentNpcLine}

      transcript={transcript}

      logEndRef={logEndRef}

      logAriaLabel={`Conversation with ${mayorName}`}

      actionBoxRef={actionBoxRef}

      choicePane={
        <ul className="quest-scene-choice-grid">
          {choices.map((choice) => {
            const isAttack = choice.id === 'shannon-attack';
            const isContinue = isShannonContinueChoice(choice);
            return (
              <li key={choice.id} className={isContinue ? 'quest-scene-choice-span-full' : undefined}>
                <button
                  type="button"
                  className={cn(
                    isContinue ? QUEST_SCENE_CONTINUE : QUEST_SCENE_CHOICE,
                    isAttack && 'rpg-command-chip--danger'
                  )}
                  onClick={() => handleChoice(choice)}
                >
                  <span className={isContinue ? undefined : QUEST_SCENE_CHOICE_LABEL}>{choice.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      }

    />

  );

}

