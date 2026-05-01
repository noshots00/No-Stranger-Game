import type { RefObject } from 'react';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { DialogueVoiceBlockModel } from '../dialogueFormat';
import { PLAY_DIALOGUE_RECENT_MAX, PLAY_WORLD_RECENT_MAX } from '../constants';
import type { QuestDefinition, QuestStep, WorldEventLogEntry } from '../quests/types';

type PlayTabProps = {
  playDialogueBlocks: DialogueVoiceBlockModel[];
  playWorldLines: WorldEventLogEntry[];
  activeQuest: QuestDefinition | null;
  activeStep: QuestStep | null;
  dialogueLogLength: number;
  worldEventLogLength: number;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  eventLogScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  showOriginStartHint: boolean;
};

export function PlayTab({
  playDialogueBlocks,
  playWorldLines,
  activeQuest,
  activeStep,
  dialogueLogLength,
  worldEventLogLength,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  dialogueScrollRef,
  eventLogScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  showOriginStartHint,
}: PlayTabProps) {
  return (
    <section className="flex flex-col gap-2">
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll h-[30rem] overflow-y-auto rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2"
      >
        <div className="space-y-3">
          {playDialogueBlocks.map((block, blockIndex) => (
            <div
              key={`${block.role}-${block.lines[0]?.id ?? `b-${blockIndex}`}`}
              className="dialogue-line-reveal py-0.5"
            >
              <DialogueVoiceBlock presentation="play" role={block.role} lines={block.lines} />
            </div>
          ))}
          {activeQuest && activeStep ? (
            <div className="dialogue-line-reveal py-0.5">
              {activeStep.type === 'choice' ? (
                <div className="space-y-2">
                  {showOriginStartHint ? (
                    <p className="facsimile-kicker px-0.5">Choose a reply to continue</p>
                  ) : null}
                  <ul className="space-y-1.5">
                    {activeStep.choices.map((choice) => (
                      <li key={choice.id}>
                        <button
                          type="button"
                          className="dialogue-option-button facsimile-choice block w-full rounded-md px-3 py-2 text-left text-xs text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                          onClick={() => onStepChoice(choice.id)}
                        >
                          {choice.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeStep.type === 'input' ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(event) => onNameInputChange(event.target.value)}
                    placeholder={activeStep.placeholder}
                    className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] placeholder:text-[var(--facsimile-ink-muted)] focus:outline-none"
                  />
                  {nameInputError ? (
                    <p className="text-xs text-rose-300">{nameInputError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={onNameSubmit}
                    className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)]"
                  >
                    {activeStep.submitLabel}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {dialogueLogLength > PLAY_DIALOGUE_RECENT_MAX ? (
        <p className="text-center text-[10px] text-[var(--facsimile-ink-muted)]">
          Showing the last {PLAY_DIALOGUE_RECENT_MAX} dialogue lines. Older lines are in the chronicle.
        </p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
        <div
          ref={eventLogScrollRef}
          className="facsimile-scroll h-20 overflow-y-auto px-2 py-2"
        >
          <ul className="space-y-1 pl-4 text-[11px] text-[var(--facsimile-ink-muted)]">
            {playWorldLines.map((entry, index) => (
              <li key={`${entry.atMs}-${index}-${entry.text}`} className="list-disc">
                {entry.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {worldEventLogLength > PLAY_WORLD_RECENT_MAX ? (
        <p className="text-center text-[10px] text-[var(--facsimile-ink-muted)]">
          Showing the last {PLAY_WORLD_RECENT_MAX} world events. Older events are in the chronicle.
        </p>
      ) : null}
      {visibleLocationActions.length > 0 ? (
        <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {visibleLocationActions.map((action) => (
              <button
                key={action}
                type="button"
                className="location-action-button w-full rounded-md border border-[var(--facsimile-panel-border)] bg-[rgba(20,23,31,0.82)] px-2 py-1.5 text-left text-xs text-[var(--facsimile-ink-muted)] hover:border-[var(--facsimile-accent)] hover:text-[var(--facsimile-ink)]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
