import type { NostrMetadata } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { CLASS_CATALOG } from './classCatalog';
import { PROFESSION_CATALOG } from './professionCatalog';
import { RACE_CATALOG } from './raceCatalog';
import { createSeededRandom, hashString } from './random';

const MVP_CHARACTER_STORAGE_KEY = 'noStrangerCharacter';

export type CreationAnswer = 0 | 1 | 2;

export interface MainQuestChoice {
  questId: string;
  prompt: string;
  option: string;
  consequence: string;
  chosenAt: number;
}

export interface QuestBunchAnswer {
  questionId: string;
  option: string;
}

export interface PendingQuestBunch {
  questId: string;
  answers: QuestBunchAnswer[];
}

export interface MVPCharacter {
  id: string;
  createdAt: number;
  level: number;
  role: 'stranger';
  characterName: string;
  gender: string;
  race: string;
  profession: string;
  startingCity: string;
  className: string;
  gold?: number;
  health?: number;
  locationId?: string;
  visibleTraits?: string[];
  hiddenTraits?: string[];
  injuries?: string[];
  dailyLogs?: Array<{ tick: string; line: string }>;
  lastSimulatedTick?: string;
  exploreIntent?: string;
  chapterProofHead?: string;
  chapterWindowIds?: string[];
  completedChapterIds?: string[];
  pendingQuestBunch?: PendingQuestBunch;
  hasCompletedFirstChapter?: boolean;
  classId?: number;
  answers?: [CreationAnswer, CreationAnswer, CreationAnswer];
  mainQuestChoices: MainQuestChoice[];
  discoveredLocations?: string[];
  pubkey?: string;
  npub?: string;
}

export interface NetworkPresenceMember {
  pubkey: string;
  nostrName: string;
  characterName: string;
  classLabel: string;
  race?: string;
  profession?: string;
  startingCity?: string;
  picture?: string;
  discoveredLocations?: string[];
}

const RACE_OPTIONS = RACE_CATALOG.map((race) => race.name);
const PROFESSION_OPTIONS = PROFESSION_CATALOG.map((profession) => profession.name);
const CLASS_OPTIONS = CLASS_CATALOG.map((classDef) => classDef.name);

const optionStep = (option: string): number => {
  if (option === 'A') return 7;
  if (option === 'B') return 11;
  if (option === 'C') return 13;
  if (option === 'D') return 17;
  if (option === 'E') return 19;
  return 13;
};

const raceWeightMapFromAnswers = (answers: QuestBunchAnswer[]): Map<string, number> => {
  const weights = new Map<string, number>(RACE_OPTIONS.map((race) => [race, 1]));
  const raceCount = RACE_OPTIONS.length;

  for (const answer of answers) {
    const sourceHash = hashString(`${answer.questionId}:${answer.option}`);
    const start = sourceHash % raceCount;
    const stride = optionStep(answer.option);

    // Each answer boosts 6 races, and all races still keep baseline weight.
    for (let i = 0; i < 6; i++) {
      const index = (start + i * stride) % raceCount;
      const raceName = RACE_OPTIONS[index];
      const bonus = 6 - i; // 6..1
      weights.set(raceName, (weights.get(raceName) ?? 1) + bonus);
    }
  }

  return weights;
};

const classWeightMapFromAnswers = (answers: QuestBunchAnswer[]): Map<string, number> => {
  const weights = new Map<string, number>(CLASS_OPTIONS.map((className) => [className, 1]));
  const classCount = CLASS_OPTIONS.length;

  for (const answer of answers) {
    const sourceHash = hashString(`class:${answer.questionId}:${answer.option}`);
    const start = sourceHash % classCount;
    const stride = optionStep(answer.option);

    // Each answer boosts 10 classes while preserving baseline odds for all classes.
    for (let i = 0; i < 10; i++) {
      const index = (start + i * stride) % classCount;
      const className = CLASS_OPTIONS[index];
      const bonus = 10 - i; // 10..1
      weights.set(className, (weights.get(className) ?? 1) + bonus);
    }
  }

  return weights;
};

const professionWeightMapFromAnswers = (answers: QuestBunchAnswer[]): Map<string, number> => {
  const weights = new Map<string, number>(PROFESSION_OPTIONS.map((profession) => [profession, 1]));
  const professionCount = PROFESSION_OPTIONS.length;

  for (const answer of answers) {
    const sourceHash = hashString(`profession:${answer.questionId}:${answer.option}`);
    const start = sourceHash % professionCount;
    const stride = optionStep(answer.option);

    // Each answer boosts 8 professions while keeping baseline odds for all.
    for (let i = 0; i < 8; i++) {
      const index = (start + i * stride) % professionCount;
      const profession = PROFESSION_OPTIONS[index];
      const bonus = 8 - i; // 8..1
      weights.set(profession, (weights.get(profession) ?? 1) + bonus);
    }
  }

  return weights;
};

const weightedPick = <T extends string>(weights: Array<{ value: T; weight: number }>, random: () => number): T => {
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return weights[0].value;
  let roll = random() * total;
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return weights[weights.length - 1].value;
};

export interface QuestBunchIdentityResult {
  race: string;
  profession: string;
  className: string;
}

export const computeQuestBunchIdentity = (
  answers: QuestBunchAnswer[],
  seedSource: string,
): QuestBunchIdentityResult => {
  const random = createSeededRandom(seedSource);
  const raceWeights = raceWeightMapFromAnswers(answers);
  const race = weightedPick(
    [...raceWeights.entries()].map(([value, weight]) => ({ value, weight })),
    random,
  );

  const professionWeightsFromAnswers = professionWeightMapFromAnswers(answers);
  const professionWeights = PROFESSION_OPTIONS.map((value) => {
    let weight = professionWeightsFromAnswers.get(value) ?? 1;
    const loweredRace = race.toLowerCase();
    const loweredProfession = value.toLowerCase();

    if ((loweredRace.includes('dwarf') || loweredRace.includes('kobold') || loweredRace.includes('goblin')) && (
      loweredProfession.includes('smith') || loweredProfession.includes('miner') || loweredProfession.includes('armorer')
    )) weight += 2;
    if ((loweredRace.includes('human') || loweredRace.includes('imperial') || loweredRace.includes('redguard')) && (
      loweredProfession.includes('guard') || loweredProfession.includes('watchman') || loweredProfession.includes('steward')
    )) weight += 2;
    if ((loweredRace.includes('elf') || loweredRace.includes('firbolg') || loweredRace.includes('treant')) && (
      loweredProfession.includes('herbalist') || loweredProfession.includes('harvester') || loweredProfession.includes('tracker')
    )) weight += 2;
    return { value, weight };
  });
  const profession = weightedPick(professionWeights, random);

  const classWeightsByAnswers = classWeightMapFromAnswers(answers);
  const classWeights = CLASS_OPTIONS.map((value) => {
    let weight = classWeightsByAnswers.get(value) ?? 1;
    const loweredRace = race.toLowerCase();
    const loweredClass = value.toLowerCase();

    if (loweredClass.includes('mage') || loweredClass.includes('wizard') || loweredClass.includes('arcan') || loweredClass.includes('sorcer') || loweredClass.includes('warlock')) {
      if (loweredRace.includes('elf') || loweredRace.includes('aasimar') || loweredRace.includes('tiefling')) weight += 2;
    }
    if (loweredClass.includes('druid') || loweredClass.includes('warden') || loweredClass.includes('shaman') || loweredClass.includes('animist')) {
      if (loweredRace.includes('firbolg') || loweredRace.includes('treant') || loweredRace.includes('elf')) weight += 2;
      if (profession === 'Wood Cutter') weight += 1;
    }
    if (loweredClass.includes('assassin') || loweredClass.includes('rogue') || loweredClass.includes('shadow') || loweredClass.includes('ninja') || loweredClass.includes('thief')) {
      if (loweredRace.includes('drow') || loweredRace.includes('kenku') || loweredRace.includes('yuan-ti') || loweredRace.includes('khajiit')) weight += 2;
    }
    if (loweredClass.includes('knight') || loweredClass.includes('paladin') || loweredClass.includes('guardian') || loweredClass.includes('sentinel') || loweredClass.includes('defender')) {
      if (profession === 'Royal Guard') weight += 2;
      if (loweredRace.includes('human') || loweredRace.includes('imperial') || loweredRace.includes('redguard')) weight += 1;
    }
    if (loweredClass.includes('engineer') || loweredClass.includes('machinist') || loweredClass.includes('mechanist') || loweredClass.includes('artificer') || loweredClass.includes('alchemist')) {
      if (profession === 'Miner') weight += 2;
      if (loweredRace.includes('gnome') || loweredRace.includes('goblin') || loweredRace.includes('kobold')) weight += 1;
    }

    return { value, weight };
  });
  const className = weightedPick(classWeights, random);

  return { race, profession, className };
};

export const mergeUniquePubkeys = (follows: string[], followers: string[], currentUserPubkey: string): string[] => {
  const unique = new Set<string>([...follows, ...followers]);
  unique.delete(currentUserPubkey);
  return [...unique];
};

export const getDisplayNameForPubkey = (
  pubkey: string,
  metadata: NostrMetadata | undefined,
): string => {
  const preferredName = metadata?.display_name?.trim() || metadata?.name?.trim();
  if (preferredName) return preferredName;

  try {
    return nip19.npubEncode(pubkey).slice(0, 16) + '...';
  } catch {
    return `${pubkey.slice(0, 12)}...`;
  }
};

export const saveMVPCharacter = (character: MVPCharacter): void => {
  try {
    localStorage.setItem(MVP_CHARACTER_STORAGE_KEY, JSON.stringify(character));
  } catch (error) {
    console.error('Failed to save MVP character:', error);
  }
};

export const loadMVPCharacter = (): MVPCharacter | null => {
  try {
    const raw = localStorage.getItem(MVP_CHARACTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MVPCharacter>;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const legacyAnswers = Array.isArray(parsed.answers) && parsed.answers.length === 3
      ? parsed.answers as [CreationAnswer, CreationAnswer, CreationAnswer]
      : undefined;
    const mainQuestChoices = Array.isArray(parsed.mainQuestChoices) ? parsed.mainQuestChoices as MainQuestChoice[] : [];
    const discoveredLocations = Array.isArray(parsed.discoveredLocations)
      ? parsed.discoveredLocations.filter((location): location is string => typeof location === 'string')
      : ['market-square'];
    const chapterWindowIds = Array.isArray(parsed.chapterWindowIds)
      ? parsed.chapterWindowIds.filter((windowId): windowId is string => typeof windowId === 'string')
      : [];

    return {
      id: parsed.id ?? `temp-${Date.now()}`,
      createdAt: parsed.createdAt ?? Date.now(),
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      role: 'stranger',
      characterName: typeof parsed.characterName === 'string' && parsed.characterName.trim() ? parsed.characterName : 'Nameless Stranger',
      gender: typeof parsed.gender === 'string' && parsed.gender.trim() ? parsed.gender : 'Unknown',
      race: typeof parsed.race === 'string' && parsed.race.trim() ? parsed.race : 'Human',
      profession: typeof parsed.profession === 'string' && parsed.profession.trim() ? parsed.profession : 'Wood Cutter',
      startingCity: typeof parsed.startingCity === 'string' && parsed.startingCity.trim() ? parsed.startingCity : 'Dawnharbor',
      className: typeof parsed.className === 'string' && parsed.className.trim() ? parsed.className : 'Wanderer',
      gold: typeof parsed.gold === 'number' ? parsed.gold : 0,
      health: typeof parsed.health === 'number' ? parsed.health : 100,
      locationId: typeof parsed.locationId === 'string' ? parsed.locationId : 'market_square',
      visibleTraits: Array.isArray(parsed.visibleTraits) ? parsed.visibleTraits.filter((trait): trait is string => typeof trait === 'string') : [],
      hiddenTraits: Array.isArray(parsed.hiddenTraits) ? parsed.hiddenTraits.filter((trait): trait is string => typeof trait === 'string') : ['Patient', 'Risk-Taker', 'Night Owl'],
      injuries: Array.isArray(parsed.injuries) ? parsed.injuries.filter((injury): injury is string => typeof injury === 'string') : [],
      dailyLogs: Array.isArray(parsed.dailyLogs)
        ? parsed.dailyLogs
            .filter((entry): entry is { tick: string; line: string } => Boolean(entry) && typeof entry === 'object' && typeof (entry as { tick?: string }).tick === 'string' && typeof (entry as { line?: string }).line === 'string')
            .slice(0, 40)
        : [],
      lastSimulatedTick: typeof parsed.lastSimulatedTick === 'string' ? parsed.lastSimulatedTick : undefined,
      exploreIntent: typeof parsed.exploreIntent === 'string' ? parsed.exploreIntent : undefined,
      classId: typeof parsed.classId === 'number' ? parsed.classId : undefined,
      answers: legacyAnswers,
      mainQuestChoices,
      discoveredLocations,
      chapterWindowIds,
      completedChapterIds: Array.isArray(parsed.completedChapterIds)
        ? parsed.completedChapterIds.filter((chapterId): chapterId is string => typeof chapterId === 'string')
        : [],
      chapterProofHead: typeof parsed.chapterProofHead === 'string' ? parsed.chapterProofHead : undefined,
      pendingQuestBunch: parsed.pendingQuestBunch && typeof parsed.pendingQuestBunch === 'object'
        ? parsed.pendingQuestBunch as PendingQuestBunch
        : undefined,
      hasCompletedFirstChapter: Boolean(parsed.hasCompletedFirstChapter),
      pubkey: parsed.pubkey,
      npub: parsed.npub,
    };
  } catch (error) {
    console.error('Failed to load MVP character:', error);
    return null;
  }
};

export const clearMVPCharacter = (): void => {
  try {
    localStorage.removeItem(MVP_CHARACTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear MVP character:', error);
  }
};