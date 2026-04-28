import { useEffect, useState } from 'react';
import type { QuestBunchAnswer } from '@/lib/rpg/utils';

interface QuestStep {
  questionId: string;
  title: string;
  prompt: string;
  options: Array<{ option: string; label: string }>;
}

interface ChapterViewProps {
  chapterTitle: string;
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
  onChoose: (questionId: string, option: string) => void;
  deadLetterEnabled: boolean;
  onOpenDeadLetter: () => void;
  revealPhase: 'idle' | 'revealing';
  revealIdentity?: { consequence: string; race: string; profession: string; className: string };
}

export function ChapterView({
  chapterTitle,
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
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const chapterArt = pendingBunch.questId === 'market-money-001'
    ? '/placeholders/locations/village-square.svg'
    : pendingBunch.questId === 'embers-and-oaths-002'
      ? '/placeholders/locations/forest-edge.svg'
      : '/placeholders/locations/old-library.svg';

  useEffect(() => {
    if (!chapterOpened || hasChosenMarketQuest || revealPhase === 'revealing') {
      setNarrativeComplete(false);
      return;
    }
    const delay = chapterLines.length * 800 + 1200;
    const timer = setTimeout(() => setNarrativeComplete(true), delay);
    return () => clearTimeout(timer);
  }, [chapterOpened, hasChosenMarketQuest, chapterLines, revealPhase]);

  useEffect(() => {
    if (!chapterOpened || hasChosenMarketQuest) return;
    setVisibleLineCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setVisibleLineCount(count);
      if (count >= chapterLines.length) clearInterval(timer);
    }, 900);
    return () => clearInterval(timer);
  }, [chapterOpened, hasChosenMarketQuest, chapterLines.length]);

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
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-ghost)' }}>{chapterTitle}</p>
          <img
            src={chapterArt}
            alt="Chapter scene placeholder"
            className="w-full h-40 object-cover rounded-lg border"
            style={{ borderColor: 'var(--ink-ghost)' }}
            onError={(event) => {
              event.currentTarget.src = '/placeholders/locations/generic-location.svg';
            }}
          />
          {chapterLines.slice(0, visibleLineCount).map((line, idx) => (
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
        <div className="mt-12 space-y-5">
          <p className="font-cormorant text-xl md:text-2xl leading-relaxed chapter-line" style={{ color: 'var(--ink)', animationDelay: '0ms' }}>
            {revealIdentity.consequence}
          </p>
          <p className="font-cormorant text-lg chapter-line" style={{ color: 'var(--ember)', animationDelay: '2000ms' }}>
            Something stirs in your blood... <em>{revealIdentity.race}</em>
          </p>
          <p className="font-cormorant text-lg chapter-line" style={{ color: 'var(--ember)', animationDelay: '4000ms' }}>
            Your hands remember a craft... <em>{revealIdentity.profession}</em>
          </p>
          <p className="font-cormorant text-lg chapter-line" style={{ color: 'var(--ember)', animationDelay: '6000ms' }}>
            A word rises unbidden... <em>{revealIdentity.className}</em>
          </p>
          <p className="font-cormorant text-sm italic chapter-line" style={{ color: 'var(--ink-ghost)', animationDelay: '8000ms' }}>
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
                className="choice-smudge w-full min-h-[52px] text-left px-5 py-4 rounded-lg font-cormorant text-lg transition-all duration-350"
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
