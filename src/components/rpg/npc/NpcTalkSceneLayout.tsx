import type { RefObject, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { QuestSceneActionBox } from '@/components/rpg/quest-scene/QuestSceneActionBox';
import { QuestSceneContentPanel } from '@/components/rpg/quest-scene/QuestSceneContentPanel';
import {
  QUEST_SCENE_META,
  QUEST_SCENE_RESPONSE,
  RPG_DIALOG_BODY,
} from '../typography/rpgDialogTypography';
import { RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';
import { NpcTalkFrame } from './NpcTalkFrame';

type NpcTalkSceneLayoutProps = {
  displayName: string;
  portraitSrc: string;
  portraitAlt: string;
  backgroundSrc: string;
  currentNpcLine: string;
  transcript: TranscriptEntry[];
  logEndRef: RefObject<HTMLDivElement | null>;
  logAriaLabel: string;
  actionBoxRef: RefObject<HTMLDivElement | null>;
  choicePane: ReactNode;
};

export function NpcTalkSceneLayout({
  displayName,
  portraitSrc,
  portraitAlt,
  backgroundSrc,
  currentNpcLine,
  transcript,
  logEndRef,
  logAriaLabel,
  actionBoxRef,
  choicePane,
}: NpcTalkSceneLayoutProps) {
  return (
    <div className="npc-talk-scene-layout">
      <NpcTalkFrame className="npc-talk-hero-frame">
        <div className="npc-talk-hero">
          <img src={backgroundSrc} alt="" className="npc-talk-hero-bg" loading="lazy" />
          <div className="npc-talk-hero-gradient" aria-hidden />
          <div className="npc-talk-hero-grid">
            <div className="npc-talk-portrait-col">
              <img
                src={portraitSrc}
                alt={portraitAlt}
                className="npc-talk-portrait"
                loading="lazy"
              />
            </div>
            <div className="npc-talk-dialogue-col">
              {currentNpcLine.trim().length > 0 ? (
                <div className="npc-talk-dialogue-bubble">
                  <p
                    className={cn(
                      'whitespace-pre-line facsimile-scroll',
                      QUEST_SCENE_RESPONSE,
                      'npc-talk-current-line'
                    )}
                  >
                    {currentNpcLine}
                  </p>
                </div>
              ) : (
                <p className={cn('italic opacity-50', QUEST_SCENE_META)}>…</p>
              )}
            </div>
          </div>
        </div>
      </NpcTalkFrame>

      <QuestSceneContentPanel>
        <div
          className="quest-scene-text-box npc-talk-transcript rpg-panel facsimile-scroll border-x-0 px-2.5 py-2"
          role="log"
          aria-label={logAriaLabel}
        >
          <div className={cn('space-y-1.5', RPG_DIALOG_BODY)}>
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

        <QuestSceneActionBox ref={actionBoxRef}>{choicePane}</QuestSceneActionBox>
      </QuestSceneContentPanel>
    </div>
  );
}
