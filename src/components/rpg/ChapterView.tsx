import { useEffect, useState } from 'react';
import type { QuestBunchAnswer } from '@/lib/rpg/utils';

interface QuestStep {
  questionId: string;
  title: string;
  prompt: string;
  options: Array<{ option: 'A' | 'B' | 'C'; label: string }>;
}

interface ChapterViewProps {
  chapterOpened: boolean;
  onOpenChapter: () => void;
  hasChosenMarketQuest: boolean;
  chapterLines: string[];
  mainQuestFlavorLine?: string;
  marketConsequence?: string;
  marketOption?: string;
  currentQuestStep?: QuestStep;
  pendingBunch: { questId: string; answers: QuestBunchAnswer[] };
  questBunchStepsLength: number;
  onChoose: (questionId: string, option: 'A' | 'B' | 'C') => void;
  deadLetterEnabled: boolean;
  onOpenDeadLetter: () => void;
  revealPhase: 'idle' | 'revealing';
  revealIdentity?: { consequence: string; race: string; profession: string; className: string };
}

export function ChapterView({
  chapterOpened,
  onOpenChapter,
  hasChosenMarketQuest,
  chapterLines,
  mainQuestFlavorLine,
  marketConsequence,
  marketOption,
  currentQuestStep,
  pendingBunch,
  questBunchStepsLength,
  onChoose,
  deadLetterEnabled,
  onOpenDeadLetter,
  revealPhase,
  revealIdentity,
}: ChapterViewProps) {
  const [narrativeComplete, setNarrativeComplete] = useState(false);

  useEffect(() => {
    if (!chapterOpened || hasChosenMarketQuest || revealPhase === 'revealing') {
      setNarrativeComplete(false);
      return;
    }
    const delay = chapterLines.length * 800 + 1200;
    const timer = setTimeout(() => setNarrativeComplete(true), delay);
    return () => clearTimeout(timer);
  }, [chapterOpened, hasChosenMarketQuest, chapterLines, revealPhase]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-6 mx-auto max-w-lg">
      {!chapterOpened && !hasChosenMarketQuest ? (
        <div className="text-center emerge">
          <button type="button" onClick={onOpenChapter} className="group">
            <div
              className="mx-auto h-20 w-20 rounded-full flex items-center justify-center transition-all duration-700 group-hover:scale-110 smolder"
              style={{ background: 'var(--surface-dim)', border: '1px solid var(--ember-dim)' }}
            >
              <span className="font-cormorant text-2xl" style={{ color: 'var(--ember)' }}>
                ⊕
              </span>
            </div>
            <p className="mt-6 font-cormorant text-lg" style={{ color: 'var(--ink-dim)' }}>
              Crack the wax seal
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--ink-ghost)' }}>
              Your daily chapter waits
            </p>
          </button>
        </div>
      ) : null}

      {chapterOpened || hasChosenMarketQuest ? (
        <div className="space-y-4">
          {chapterLines.map((line, idx) => (
            <p
              key={line}
              className="font-cormorant text-xl md:text-2xl leading-relaxed chapter-line"
              style={{ color: 'var(--ink)', animationDelay: `${idx * 800}ms` }}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {revealPhase === 'revealing' && revealIdentity ? (
        <div className="mt-12 space-y-5 emerge">
          <p className="font-cormorant text-xl md:text-2xl leading-relaxed chapter-line" style={{ color: 'var(--ink)' }}>
            {revealIdentity.consequence}
          </p>
          <p className="font-cormorant text-lg emerge emerge-delay-2" style={{ color: 'var(--ember)' }}>
            Race revealed: {revealIdentity.race}
          </p>
          <p className="font-cormorant text-lg emerge emerge-delay-3" style={{ color: 'var(--ember)' }}>
            Profession revealed: {revealIdentity.profession}
          </p>
          <p className="font-cormorant text-lg emerge emerge-delay-4" style={{ color: 'var(--ember)' }}>
            Class revealed: {revealIdentity.className}
          </p>
          <p className="font-cormorant text-sm italic emerge emerge-delay-5" style={{ color: 'var(--ink-ghost)' }}>
            Return tomorrow for the next unfolding.
          </p>
        </div>
      ) : null}

      {mainQuestFlavorLine ? (
        <p className="mt-8 font-cormorant text-sm italic" style={{ color: 'var(--ink-ghost)' }}>
          {mainQuestFlavorLine}
        </p>
      ) : null}

      {hasChosenMarketQuest ? (
        <div className="mt-10 emerge">
          <div className="h-px w-12 mb-6" style={{ background: 'var(--ink-ghost)' }} />
          <p className="font-cormorant text-base" style={{ color: 'var(--ink-dim)' }}>
            {marketConsequence}
          </p>
          <p className="mt-4 text-xs font-mono" style={{ color: 'var(--ink-ghost)' }}>
            Sealed: {marketOption}
          </p>
          <p className="mt-6 font-cormorant text-sm italic" style={{ color: 'var(--ink-ghost)' }}>
            Return tomorrow for the next unfolding.
          </p>
          {deadLetterEnabled ? (
            <button type="button" onClick={onOpenDeadLetter} className="mt-4 text-sm font-cormorant" style={{ color: 'var(--ember)' }}>
              Seal a letter to your future self →
            </button>
          ) : null}
        </div>
      ) : null}

      {chapterOpened && !hasChosenMarketQuest && narrativeComplete && revealPhase !== 'revealing' && currentQuestStep ? (
        <div className="mt-12 space-y-6 emerge candle-flicker-soft">
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-ghost)' }}>
            {pendingBunch.answers.length + 1} of {questBunchStepsLength}
          </p>

          <p className="font-cormorant text-xl leading-relaxed" style={{ color: 'var(--ink)' }}>
            {currentQuestStep.prompt}
          </p>

          <div className="relative space-y-3 mt-6 overflow-hidden rounded-lg">
            <div className="smoke-wisp smoke-wisp-1" aria-hidden="true" />
            <div className="smoke-wisp smoke-wisp-2" aria-hidden="true" />
            <div className="smoke-wisp smoke-wisp-3" aria-hidden="true" />
            {currentQuestStep.options.map((optionItem, idx) => (
              <button
                key={`${currentQuestStep.questionId}-${optionItem.option}`}
                type="button"
                className="choice-smudge w-full text-left px-5 py-4 rounded-lg font-cormorant text-lg transition-all duration-350"
                style={{ color: 'var(--ink)', background: 'var(--surface)', animationDelay: `${idx * 150}ms` }}
                onClick={() => onChoose(currentQuestStep.questionId, optionItem.option)}
              >
                {optionItem.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {chapterOpened && !hasChosenMarketQuest && !narrativeComplete && revealPhase !== 'revealing' ? (
        <p className="mt-8 text-xs tracking-[0.2em] uppercase emerge" style={{ color: 'var(--ink-ghost)' }}>
          Crack the seal to begin.
        </p>
      ) : null}
    </div>
  );
}
