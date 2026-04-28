import { useMemo, useState } from 'react';
import { mergeCreationWeights, resolveRaceReveal } from '@/lib/rpg/creationEngine';

interface CreationOption {
  label: string;
  attributeWeights: Record<string, number>;
  raceWeights: Record<string, number>;
}

interface CreationQuestion {
  id: string;
  prompt: string;
  options: CreationOption[];
}

export interface CreationResult {
  race: string;
  raceProgress: Record<string, number>;
  hiddenAttributes: Record<string, number>;
  raceLocked: boolean;
}

interface CharacterCreationFlowProps {
  onComplete: (characterName: string, result: CreationResult) => void;
}

const QUESTIONS: CreationQuestion[] = [
  {
    id: 'wolf',
    prompt: 'You find a wounded wolf in the clearing. What do you do?',
    options: [
      { label: 'Approach slowly', attributeWeights: { cunning: 4, wisdom: 2 }, raceWeights: { WoodElf: 10, Clawed: 6 } },
      { label: 'Leave it be', attributeWeights: { wisdom: 4 }, raceWeights: { Human: 6, NightElf: 8 } },
      { label: 'Put it out of misery', attributeWeights: { strength: 4, willpower: 2 }, raceWeights: { HalfOrc: 8, Troll: 6 } },
      { label: 'Call for help', attributeWeights: { charm: 4 }, raceWeights: { Human: 8, Fae: 5 } },
    ],
  },
  {
    id: 'calm',
    prompt: 'What calms your mind most?',
    options: [
      { label: 'The sound of rain', attributeWeights: { wisdom: 2, luck: 1 }, raceWeights: { WoodElf: 7, Fae: 6 } },
      { label: 'A crackling fire', attributeWeights: { willpower: 3, strength: 1 }, raceWeights: { Dwarf: 8, HalfOrc: 6 } },
      { label: 'Complete silence', attributeWeights: { cunning: 3 }, raceWeights: { NightElf: 9, Clawed: 4 } },
      { label: 'A crowded room', attributeWeights: { charm: 4 }, raceWeights: { Human: 8 } },
    ],
  },
  {
    id: 'coin',
    prompt: 'A child drops a coin near your feet. You...',
    options: [
      { label: 'Return it', attributeWeights: { charm: 2, wisdom: 2 }, raceWeights: { Human: 6, WoodElf: 4 } },
      { label: 'Pocket it', attributeWeights: { cunning: 4 }, raceWeights: { Clawed: 7, NightElf: 7 } },
      { label: 'Add your own coin', attributeWeights: { charm: 3, luck: 2 }, raceWeights: { Fae: 8, Human: 5 } },
      { label: 'Pretend not to see', attributeWeights: { willpower: 2 }, raceWeights: { Dwarf: 5, Troll: 5 } },
    ],
  },
  {
    id: 'boar',
    prompt: 'A boar charges from brush. Your instinct is to...',
    options: [
      { label: 'Run', attributeWeights: { luck: 2, cunning: 2 }, raceWeights: { Human: 4, NightElf: 7 } },
      { label: 'Attack', attributeWeights: { strength: 4 }, raceWeights: { HalfOrc: 9, Troll: 5 } },
      { label: 'Cast from memory', attributeWeights: { wisdom: 4 }, raceWeights: { Fae: 9, NightElf: 6 } },
      { label: 'Evade and reposition', attributeWeights: { cunning: 4 }, raceWeights: { Clawed: 10, WoodElf: 6 } },
    ],
  },
  {
    id: 'promise',
    prompt: 'If you could recover one memory, what would it be?',
    options: [
      { label: 'A promise I made', attributeWeights: { willpower: 3, wisdom: 1 }, raceWeights: { Dwarf: 6, Human: 6 } },
      { label: 'A debt I owe', attributeWeights: { cunning: 2, willpower: 2 }, raceWeights: { NightElf: 6, Clawed: 6 } },
      { label: 'A place I loved', attributeWeights: { charm: 2, wisdom: 2 }, raceWeights: { WoodElf: 8, Fae: 6 } },
      { label: 'A battle I survived', attributeWeights: { strength: 3, willpower: 1 }, raceWeights: { HalfOrc: 8, Troll: 7 } },
    ],
  },
  {
    id: 'night',
    prompt: 'Night falls. How do you keep watch?',
    options: [
      { label: 'Listen to every sound', attributeWeights: { wisdom: 3 }, raceWeights: { WoodElf: 6, NightElf: 7 } },
      { label: 'Sharpen a blade', attributeWeights: { strength: 2, willpower: 2 }, raceWeights: { Dwarf: 8, HalfOrc: 5 } },
      { label: 'Read the stars', attributeWeights: { wisdom: 2, luck: 2 }, raceWeights: { Fae: 8, Human: 4 } },
      { label: 'Set traps', attributeWeights: { cunning: 4 }, raceWeights: { Clawed: 8, NightElf: 5 } },
    ],
  },
];

const RACE_LABELS: Record<string, string> = {
  Human: 'Human',
  WoodElf: 'Wood Elf',
  Dwarf: 'Dwarf',
  HalfOrc: 'Half-Orc',
  NightElf: 'Night Elf',
  Fae: 'Fae',
  Clawed: 'Claw-ed',
  Troll: 'Troll',
};

export function CharacterCreationFlow({ onComplete }: CharacterCreationFlowProps) {
  const [characterName, setCharacterName] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hiddenAttributes, setHiddenAttributes] = useState<Record<string, number>>({});
  const [raceProgress, setRaceProgress] = useState<Record<string, number>>({});
  const [revealedRace, setRevealedRace] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  const raceLeader = useMemo(() => {
    const entries = Object.entries(raceProgress).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { race: '', score: 0, lead: 0 };
    const [race, score] = entries[0];
    const runnerUp = entries[1]?.[1] ?? 0;
    return { race, score, lead: score - runnerUp };
  }, [raceProgress]);

  const maybeRevealRace = (nextProgress: Record<string, number>, nextQuestionIndex: number): string | null => {
    const answered = nextQuestionIndex + 1;
    const adaptive = resolveRaceReveal(nextProgress, answered, 5);
    return adaptive ?? (answered >= QUESTIONS.length ? Object.entries(nextProgress).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null : null);
  };

  const handleChoose = (option: CreationOption) => {
    const merged = mergeCreationWeights(
      { attributes: hiddenAttributes, raceProgress },
      option.attributeWeights,
      option.raceWeights,
    );
    const nextAttributes = merged.attributes;
    const nextProgress = merged.raceProgress;

    setHiddenAttributes(nextAttributes);
    setRaceProgress(nextProgress);

    const resolvedRace = maybeRevealRace(nextProgress, questionIndex);
    if (resolvedRace) {
      setRevealedRace(resolvedRace);
      return;
    }
    setQuestionIndex((prev) => Math.min(prev + 1, QUESTIONS.length - 1));
  };

  const completeCreation = () => {
    const race = RACE_LABELS[revealedRace ?? raceLeader.race] ?? 'Human';
    onComplete(characterName.trim() || 'Nameless Stranger', {
      race,
      raceProgress,
      hiddenAttributes,
      raceLocked: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8" style={{ background: 'var(--void)' }}>
      <p className="text-sm tracking-[0.2em] uppercase" style={{ color: 'var(--ink-ghost)' }}>The Clearing</p>
      <h2 className="mt-4 font-cormorant text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>
        Who are you becoming?
      </h2>

      <div className="w-full max-w-xl mt-8 rounded-xl p-5 space-y-5" style={{ background: 'var(--surface)' }}>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--ink-ghost)' }}>Name</span>
          <input
            type="text"
            value={characterName}
            onChange={(event) => setCharacterName(event.target.value)}
            placeholder="Name your stranger"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-lg"
            style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
          />
        </label>

        {!revealedRace ? (
          <>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--ink-ghost)' }}>
              Question {Math.min(questionIndex + 1, QUESTIONS.length)} / {QUESTIONS.length}
            </p>
            <p className="font-cormorant text-xl leading-relaxed" style={{ color: 'var(--ink)' }}>
              {currentQuestion.prompt}
            </p>
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleChoose(option)}
                  className="w-full rounded-md border px-4 py-3 text-left font-cormorant text-lg"
                  style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)', background: 'var(--surface-dim)' }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="font-cormorant text-2xl" style={{ color: 'var(--ember)' }}>
              Something settles inside you. You are {RACE_LABELS[revealedRace] ?? revealedRace}.
            </p>
            <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
              Identity will continue to unfold in your journal as the days pass.
            </p>
            <button
              type="button"
              onClick={completeCreation}
              className="w-full rounded-md py-3 font-cormorant text-xl"
              style={{ background: 'var(--ember)', color: 'var(--void)' }}
            >
              Begin your first day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
