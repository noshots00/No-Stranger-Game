import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePlayerBroadcast } from '@/hooks/usePlayerBroadcast';
import type { DeepPartial, GameState, GameUnlocks, TutorialStep } from '@/types/game';

export interface DialogueLine {
  id: string;
  speaker?: string;
  text: string;
  isSystem?: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
  modifiers?: Record<string, number>;
  nextStep: TutorialStep;
  guard?: string;
  onChoose?: () => void;
}

function makeLineId(text: string): string {
  return `${text.slice(0, 10)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const validSteps = new Set<TutorialStep>([
  'intro_1',
  'intro_2',
  'intro_3',
  'name_input',
  'vignettes',
  'post_vignettes',
  'map_reveal',
  'map_explore',
  'boar_encounter',
  'village_arrival',
  'deckard_approach',
  'village_return',
  'deckard_lore_1',
  'deckard_lore_2',
  'deckard_lore_3',
  'deckard_lore_4',
  'deckard_lore_5',
  'deckard_lore_6',
  'deckard_lore_7',
  'deckard_farewell',
  'tavern_prompt',
  'tavern_visit',
  'tutorial_complete',
  'idle_play',
]);

function normalizeStep(raw: string | undefined): TutorialStep {
  if (!raw) return 'intro_1';
  const legacyMap: Record<string, TutorialStep> = {
    intro_forest: 'intro_1',
    map_unlock: 'map_reveal',
    boar_encounter_overlay: 'boar_encounter',
    village_arrival_scene: 'village_arrival',
    deckard_dialogue: 'deckard_lore_1',
    deckard_lore: 'deckard_lore_1',
  };
  const mapped = legacyMap[raw] ?? raw;
  return validSteps.has(mapped as TutorialStep) ? (mapped as TutorialStep) : 'intro_1';
}

export function useDialogueEngine(state: GameState | null, save: (patch: DeepPartial<GameState>) => void) {
  const { broadcast } = usePlayerBroadcast();
  const [history, setHistory] = useState<DialogueLine[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<ChoiceOption[] | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'none'>('none');
  const [step, setStep] = useState<TutorialStep>(normalizeStep(state?.tutorial.step));
  const [playerName, setPlayerName] = useState(state?.tutorial.name ?? '');
  const [playerRace, setPlayerRace] = useState(state?.tutorial.race || '');
  const [unlocks, setUnlocks] = useState<GameUnlocks>(
    state?.unlocks ?? {
      map: false,
      profile: false,
      tavern: false,
      quests: false,
      activities: { hunt: false, forage: false, explore: false, questsTab: false },
    },
  );
  const [appliedGuards, setAppliedGuards] = useState<Set<string>>(new Set(state?.tutorial.guards ?? []));
  const [lastFarewellChoice, setLastFarewellChoice] = useState<'f1' | 'f2' | 'f3' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rebuiltStepRef = useRef<TutorialStep | null>(null);

  const persist = useCallback(
    (nextStep: TutorialStep, extras?: DeepPartial<GameState>) => {
      const { tutorial: extraTutorial, ...restExtras } = extras ?? {};
      save({
        ...restExtras,
        tutorial: {
          step: nextStep,
          completed: nextStep === 'idle_play',
          name: playerName,
          race: playerRace,
          guards: Array.from(appliedGuards),
          ...extraTutorial,
        },
        unlocks,
      });
    },
    [appliedGuards, playerName, playerRace, save, unlocks],
  );

  const addLine = useCallback((line: Omit<DialogueLine, 'id'>) => {
    setHistory((prev) => [...prev, { ...line, id: makeLineId(line.text) }]);
  }, []);

  const setPrompt = useCallback((options: ChoiceOption[]) => {
    setCurrentPrompt(options);
  }, []);

  const applyModifiers = useCallback(
    (mods?: Record<string, number>) => {
      if (!mods || !state) return;
      const nextMods = { ...state.character.modifiers };
      Object.entries(mods).forEach(([key, value]) => {
        nextMods[key] = (nextMods[key] ?? 0) + value;
      });
      save({ character: { ...state.character, modifiers: nextMods } });
    },
    [save, state],
  );

  const advance = useCallback(
    (next: TutorialStep) => {
      if (import.meta.env.DEV) {
        console.debug('[DialogueEngine][advance]', { from: step, to: next, history: history.length, inputMode, promptCount: currentPrompt?.length ?? 0 });
      }
      setStep(next);
      setCurrentPrompt(null);
      setInputMode('none');
      persist(next);

      // Defer prompt/input transitions to avoid render races after state resets.
      setTimeout(() => {
        switch (next) {
          case 'intro_1':
            addLine({ text: 'You find yourself in a dense forest.' });
            setPrompt([{ id: 'c1', label: 'Where am I?', nextStep: 'intro_2' }]);
            break;
          case 'intro_2':
            addLine({ text: 'You are in a forest.' });
            setPrompt([{ id: 'c2', label: 'How did I get here?', nextStep: 'intro_3' }]);
            break;
          case 'intro_3':
            addLine({ text: "You don't remember anything." });
            setPrompt([{ id: 'c3', label: 'Who am I?', nextStep: 'name_input' }]);
            break;
          case 'name_input':
            setInputMode('text');
            break;
          case 'vignettes':
            break;
          case 'post_vignettes':
            addLine({ text: `You are beginning to remember... your name is ${playerName || 'Traveler'} and you are a level 1 ${playerRace || 'Human'} peasant.` });
            setPrompt([{ id: 'continue', label: 'Continue...', nextStep: 'map_reveal' }]);
            break;
          case 'map_reveal':
            addLine({ text: `Unlocked Race: ${playerRace}`, isSystem: true });
            addLine({ text: 'Soandso has found something.' });
            setPrompt([
              {
                id: 'map',
                label: 'Check the map.',
                nextStep: 'map_explore',
                onChoose: () =>
                  setUnlocks((prev) => ({
                    ...prev,
                    map: true,
                  })),
              },
            ]);
            break;
          case 'map_explore':
            addLine({ text: 'The map is now open. Visit the village.' });
            setCurrentPrompt(null);
            break;
          case 'boar_encounter':
            addLine({ text: 'A wild boar bursts from the brush and charges!' });
            setPrompt([
              { id: 'b1', label: 'Attack', modifiers: { strength: 5, bravery: 3 }, nextStep: 'village_arrival' },
              { id: 'b2', label: 'Run', modifiers: { survival: 5, caution: 2 }, nextStep: 'village_arrival' },
              { id: 'b3', label: 'Dodge', modifiers: { agility: 5, evasion: 3 }, nextStep: 'village_arrival' },
              { id: 'b4', label: 'Cast a spell', modifiers: { wisdom: 5, arcane: 4 }, nextStep: 'village_arrival' },
            ]);
            break;
          case 'village_arrival':
            addLine({ text: 'You find a village in a clearing in the forest.' });
            addLine({ text: 'Region updated: Amnesia Village', isSystem: true });
            if (state) save({ character: { ...state.character, region: 'Amnesia Village' } });
            setPrompt([{ id: 'va1', label: "I hope someone here can tell me what's going on.", nextStep: 'deckard_approach' }]);
            break;
          case 'deckard_approach':
            addLine({ text: 'Some people are approaching you: an old man and two young girls.' });
            setPrompt([
              { id: 'da', label: 'Acknowledge them but wait', modifiers: { wisdom: 2, resolve: 2 }, nextStep: 'deckard_lore_1' },
              { id: 'db', label: 'Be wary', modifiers: { survival: 2 }, guard: 'distrusting', nextStep: 'deckard_lore_1' },
              { id: 'dc', label: 'Leave the area quickly', guard: 'leave_quick', nextStep: 'village_return' },
            ]);
            break;
          case 'village_return':
            addLine({ text: 'You step back into the trees. The village watches silently.' });
            addLine({ text: 'You return to the village after gathering your nerve.' });
            setPrompt([{ id: 'return_deckard', label: 'Speak with Deckard.', nextStep: 'deckard_lore_1' }]);
            break;
          case 'deckard_lore_1':
            addLine({ speaker: 'Deckard', text: 'My name is Deckard, this is my village.' });
            setPrompt([{ id: 'dl1', label: 'How did I get here?', nextStep: 'deckard_lore_2' }]);
            break;
          case 'deckard_lore_2':
            addLine({ speaker: 'Deckard', text: 'We all got here the same way. We woke up in the forest with no memory. I call moments like that Blinks.' });
            setPrompt([{ id: 'dl2', label: 'Blink?', nextStep: 'deckard_lore_3' }]);
            break;
          case 'deckard_lore_3':
            addLine({ speaker: 'Deckard', text: "A Blink is the instant your old life vanishes. One breath you're someone, the next you're here." });
            setPrompt([{ id: 'dl3', label: 'So no one here knows who they are?', nextStep: 'deckard_lore_4' }]);
            break;
          case 'deckard_lore_4':
            addLine({ speaker: 'Deckard', text: 'Survival is the name of the game here.' });
            setPrompt([{ id: 'dl4', label: 'Survival?', nextStep: 'deckard_lore_5' }]);
            break;
          case 'deckard_lore_5':
            addLine({ speaker: 'Deckard', text: 'We all work hard every day just to get enough to eat and keep a roof over our heads.' });
            setPrompt([{ id: 'dl5', label: 'Dangerous?', nextStep: 'deckard_lore_6' }]);
            break;
          case 'deckard_lore_6':
            addLine({ speaker: 'Deckard', text: 'Wolves, boar, and other wild animals... and living skeletons in the old places.' });
            setPrompt([{ id: 'dl6', label: '...what kind of place have I found myself?', nextStep: 'deckard_lore_7' }]);
            break;
          case 'deckard_lore_7':
            addLine({ speaker: 'Deckard', text: 'That is enough for today. I am tired. The villagers are used to new people. Visit the tavern. Work, eat, contribute.' });
            setPrompt([
              { id: 'f1', label: 'Thank you for everything.', modifiers: { grateful: 3, polite: 2, liked: 2 }, nextStep: 'deckard_farewell' },
              { id: 'f2', label: 'Wait, I have more questions!', modifiers: { curious: 2, hasty: 1 }, nextStep: 'deckard_farewell' },
              { id: 'f3', label: 'Am I allowed to come and go freely?', modifiers: { loneWolf: 2, distrustful: 2 }, nextStep: 'deckard_farewell' },
            ]);
            break;
          case 'deckard_farewell':
            if (lastFarewellChoice === 'f2') {
              addLine({ speaker: 'Deckard', text: 'That is enough for today... I am weary.' });
            } else if (lastFarewellChoice === 'f3') {
              addLine({ speaker: 'Deckard', text: 'Of course, this is not a prison... now I must lie down.' });
            } else {
              addLine({ text: 'Deckard shambles off to a large tent near the back of the village. His two companions hold his elbows to steady the old man.' });
            }
            addLine({ text: 'New activities unlocked on map!', isSystem: true });
            addLine({ text: 'Your profile has been unlocked!', isSystem: true });
            addLine({ text: 'You should visit the tavern next.' });
            setUnlocks((prev) => ({ ...prev, profile: true, tavern: true }));
            setPrompt([{ id: 'visit_tavern', label: 'Visit the tavern next.', nextStep: 'tavern_prompt' }]);
            break;
          case 'tavern_prompt':
            addLine({ text: 'A warm glow spills from the tavern doors.' });
            setPrompt([{ id: 'enter_tavern', label: 'Step inside.', nextStep: 'tavern_visit' }]);
            break;
          case 'tavern_visit':
            addLine({
              speaker: 'Tavern Keep',
              text: "You didn't realize how hungry you were until the Tavern Keep served you a bowl of stew. Attached to the tavern is a warehouse. Bunks and sleeping rolls fill every unused space. Some of them have people lying in them - Blinks just like you, who have no idea where they are, where they came from, or where they are going.",
            });
            setPrompt([{ id: 'settle', label: 'I guess this will be my home for a while.', nextStep: 'tutorial_complete' }]);
            break;
          case 'tutorial_complete':
            addLine({
              text:
                "You have completed the tutorial. The game is now fully unlocked. Log in at least once a day to complete new quests. Quests are the primary way to unlock more of the game and progress the story. Every choice you make irrevocably affects the fate of your character. As your character explores the world he will discover new locations. Please note that he will not explore those locations until you have first visited them at least once from the map screen.\n\nThe game resets each day at midnight EST. You will automatically collect all of the rewards of your character's toils, including his wages, experience points, and any items he has found. It may seem like nothing is happening right now, but log in tomorrow to see your character's progress. Be patient, it can take some time to get rolling.\n\nEnjoy the game, explore, have fun, look forward to frequent updates, and if you need help you can find me on Nostr.",
            });
            addLine({ text: 'Unlocked activity: Hunt in the Forest', isSystem: true });
            addLine({ text: 'Unlocked activity: Forage in the Forest', isSystem: true });
            addLine({ text: 'Unlocked activity: Explore the Forest', isSystem: true });
            addLine({ text: 'Unlocked activity: Explore the Village', isSystem: true });
            addLine({ text: 'Unlocked activity: Player Quests unlocked in Tavern', isSystem: true });
            setUnlocks((prev) => ({
              ...prev,
              quests: true,
              activities: { ...prev.activities, hunt: true, forage: true, explore: true, questsTab: true },
            }));
            setStep('idle_play');
            persist('idle_play');
            break;
          case 'idle_play':
            setCurrentPrompt(null);
            setInputMode('none');
            break;
        }
      }, 0);
    },
    [addLine, lastFarewellChoice, persist, playerName, playerRace, save, setPrompt, state, step],
  );

  const handleChoice = useCallback(
    (option: ChoiceOption) => {
      if (option.guard && appliedGuards.has(option.guard)) return;
      if (option.guard) {
        const guard = option.guard;
        setAppliedGuards((prev) => new Set(prev).add(guard));
      }
      applyModifiers(option.modifiers);
      option.onChoose?.();
      if (option.id === 'f1' || option.id === 'f2' || option.id === 'f3') {
        setLastFarewellChoice(option.id);
      }
      addLine({ text: option.label, isSystem: true });
      if (step === 'boar_encounter') {
        broadcast('BOAR_CHOICE', { choice: option.label.toLowerCase() });
      }
      if (step === 'tavern_visit') {
        broadcast('TAVERN_SETTLED');
      }
      advance(option.nextStep);
    },
    [addLine, advance, appliedGuards, applyModifiers, broadcast, step],
  );

  const handleNameSubmit = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;
      setPlayerName(trimmedName);
      addLine({ text: `Name set: ${trimmedName}` });
      setInputMode('none');
      // Only override the name field here; avoid re-introducing stale step values.
      persist('vignettes', { tutorial: { name: trimmedName } });
      setStep('vignettes');
    },
    [addLine, persist],
  );

  const completeVignettes = useCallback(
    (race: string) => {
      setPlayerRace(race);
      broadcast('RACE_REVEAL', { race });
      advance('post_vignettes');
    },
    [advance, broadcast],
  );

  const handleMapInteraction = useCallback(
    (locationId: string) => {
      if (locationId === 'village' && (step === 'map_reveal' || step === 'map_explore')) {
        addLine({ text: 'Traveling to village...', isSystem: true });
        advance('boar_encounter');
        return;
      }
      if (locationId === 'tavern' && unlocks.tavern) {
        addLine({ text: 'Traveling to tavern...', isSystem: true });
        advance('tavern_visit');
      }
    },
    [addLine, advance, step, unlocks.tavern],
  );

  const handleSimulationLog = useCallback(
    (text: string) => {
      addLine({ text, isSystem: true });
    },
    [addLine],
  );

  useEffect(() => {
    if (!state) return;
    const normalized = normalizeStep(state.tutorial.step);
    if (normalized === step && rebuiltStepRef.current === normalized) return;
    setStep(normalized);
    setPlayerName(state.tutorial.name);
    setPlayerRace(state.tutorial.race || '');
    setUnlocks(state.unlocks);
    setAppliedGuards(new Set(state.tutorial.guards));
    if (import.meta.env.DEV) {
      console.debug('[DialogueEngine][rehydrate-state]', {
        persistedStep: state.tutorial.step,
        normalizedStep: normalized,
      });
    }
    if (state.tutorial.step !== normalized) {
      save({
        tutorial: {
          ...state.tutorial,
          step: normalized,
          completed: normalized === 'idle_play',
        },
      });
    }
  }, [save, state, step]);

  useEffect(() => {
    if (history.length !== 0) return;
    if (rebuiltStepRef.current === step) return;

    // Rebuild prompt/history deterministically after refresh or state restore.
    if (step === 'idle_play') return;
    if (step === 'intro_1') {
      rebuiltStepRef.current = step;
      advance('intro_1');
      return;
    }
    if (step === 'vignettes') {
      setCurrentPrompt(null);
      setInputMode('none');
      rebuiltStepRef.current = step;
      return;
    }
    rebuiltStepRef.current = step;
    advance(normalizeStep(step));
  }, [advance, history.length, step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, currentPrompt, inputMode]);

  const region = useMemo(() => {
    const isPostBoar = [
      'village_arrival',
      'deckard_approach',
      'deckard_lore_1',
      'deckard_lore_2',
      'deckard_lore_3',
      'deckard_lore_4',
      'deckard_lore_5',
      'deckard_lore_6',
      'deckard_lore_7',
      'deckard_farewell',
      'tavern_prompt',
      'tavern_visit',
      'tutorial_complete',
      'idle_play',
    ].includes(step);
    return isPostBoar ? 'Amnesia Village' : 'Unknown Region';
  }, [step]);

  return {
    history,
    currentPrompt,
    inputMode,
    step,
    unlocks,
    playerName,
    playerRace,
    region,
    handleChoice,
    handleNameSubmit,
    completeVignettes,
    handleMapInteraction,
    handleSimulationLog,
    scrollRef,
  };
}
