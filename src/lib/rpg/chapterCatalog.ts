export interface ChapterQuestOption {
  option: string;
  label: string;
}

export interface ChapterQuestStep {
  questionId: string;
  title: string;
  prompt: string;
  options: ChapterQuestOption[];
}

export interface ChapterDefinition {
  id: string;
  title: string;
  chapterLines: string[];
  questBunch: ChapterQuestStep[];
}

const chapterOneId = 'market-money-001';
const chapterTwoId = 'embers-and-oaths-002';
const chapterThreeId = 'salt-and-echo-003';

export const CHAPTER_CATALOG: ChapterDefinition[] = [
  {
    id: chapterOneId,
    title: 'Chapter One — The Village',
    chapterLines: [
      'The village burns.',
      'Smoke rolls across the market square.',
      "A purse slips from a stranger's hand and lands near your feet.",
    ],
    questBunch: [
      { questionId: `${chapterOneId}-q1`, title: 'Quest 1/10 - Waking', prompt: "You open your eyes to moss and half-light. What color was your mother's hair?", options: [{ option: 'A', label: 'Copper-red and bright like embers' }, { option: 'B', label: 'Black as wet stone' }, { option: 'C', label: 'Silver like moonlit frost' }] },
      { questionId: `${chapterOneId}-q2`, title: 'Quest 2/10 - The Village', prompt: 'A woman offers you bread. What do you notice first about her face?', options: [{ option: 'A', label: 'A scar she does not hide' }, { option: 'B', label: 'Eyes that weigh every word' }, { option: 'C', label: 'A smile that feels borrowed' }] },
      { questionId: `${chapterOneId}-q3`, title: 'Quest 3/10 - A Family Finds You', prompt: 'The carpenter asks you to stay. If it were your choice, would you?', options: [{ option: 'A', label: 'Stay, and share their table' }, { option: 'B', label: 'Stay only until dawn' }, { option: 'C', label: 'Refuse and sleep outside' }] },
      { questionId: `${chapterOneId}-q4`, title: 'Quest 4/10 - A Simple Trade', prompt: 'Which craft feels least like a lie?', options: [{ option: 'A', label: 'Woodcutting and grainwork' }, { option: 'B', label: 'Mining and masonry' }, { option: 'C', label: 'Forging and hidden trade' }] },
      { questionId: `${chapterOneId}-q5`, title: 'Quest 5/10 - Slow Work of Days', prompt: 'If you could know one thing about your old life, what would it be?', options: [{ option: 'A', label: 'Who I once protected' }, { option: 'B', label: 'Who I betrayed' }, { option: 'C', label: 'What I stole from fate' }] },
      { questionId: `${chapterOneId}-q6`, title: "Quest 6/10 - A Stranger's Fortune", prompt: 'The crone asks what you fear you left behind.', options: [{ option: 'A', label: 'A promise I could not keep' }, { option: 'B', label: 'A debt with my name on it' }, { option: 'C', label: 'A door that should stay closed' }] },
      { questionId: `${chapterOneId}-q7`, title: 'Quest 7/10 - The Night Before', prompt: 'What is the last thing you would save?', options: [{ option: 'A', label: 'A person' }, { option: 'B', label: 'A tool' }, { option: 'C', label: 'A secret' }] },
      { questionId: `${chapterOneId}-q8`, title: 'Quest 8/10 - The Fire', prompt: 'The cottage burns. You have time for one.', options: [{ option: 'A', label: 'Carry the carpenter' }, { option: 'B', label: 'Carry his wife' }, { option: 'C', label: 'Carry the daughter' }] },
      { questionId: `${chapterOneId}-q9`, title: 'Quest 9/10 - The Road', prompt: 'At the fork, which road feels most like regret avoided?', options: [{ option: 'A', label: 'North to old libraries' }, { option: 'B', label: 'East to the coast' }, { option: 'C', label: 'West toward the dream-door' }] },
      { questionId: `${chapterOneId}-q10`, title: 'Quest 10/10 - The First Night', prompt: 'The stone is warm in your pocket. What do you whisper before sleep?', options: [{ option: 'A', label: '“Let me become someone worthy.”' }, { option: 'B', label: '“Let me survive what comes.”' }, { option: 'C', label: '“Let me remember everything.”' }] },
    ],
  },
  {
    id: chapterTwoId,
    title: 'Chapter Two - Ash and Oath',
    chapterLines: [
      'By daylight the smoke looks thinner, but nothing smells clean.',
      'A courier seeks the one who carried the letter.',
      'Five seals hang from his belt, each marked for a different future.',
    ],
    questBunch: [
      { questionId: `${chapterTwoId}-q1`, title: 'Quest 1/5 - The Courier', prompt: 'Which seal do you touch first?', options: [{ option: 'A', label: 'Wax of the Crown' }, { option: 'B', label: 'Cord of the Guild' }, { option: 'C', label: 'Ash-marked parish' }, { option: 'D', label: 'A broken thief-sign' }, { option: 'E', label: 'Blank black wax' }] },
      { questionId: `${chapterTwoId}-q2`, title: 'Quest 2/5 - Debt', prompt: 'He asks what you owe this world.', options: [{ option: 'A', label: 'A life' }, { option: 'B', label: 'A promise' }, { option: 'C', label: 'A name' }, { option: 'D', label: 'A grave' }] },
      { questionId: `${chapterTwoId}-q3`, title: 'Quest 3/5 - Proof', prompt: 'How do you prove your word?', options: [{ option: 'A', label: 'With blood' }, { option: 'B', label: 'With coin' }, { option: 'C', label: 'With labor' }, { option: 'D', label: 'With silence' }] },
      { questionId: `${chapterTwoId}-q4`, title: 'Quest 4/5 - Nightfall', prompt: 'Night finds you before shelter does. Who gets the fire?', options: [{ option: 'A', label: 'A child' }, { option: 'B', label: 'A wounded veteran' }, { option: 'C', label: 'You' }] },
      { questionId: `${chapterTwoId}-q5`, title: 'Quest 5/5 - Oath', prompt: 'Speak the oath you can keep tomorrow.', options: [{ option: 'A', label: 'I will not run.' }, { option: 'B', label: 'I will not beg.' }, { option: 'C', label: 'I will not forget.' }, { option: 'D', label: 'I will not forgive.' }, { option: 'E', label: 'I will not lie.' }] },
    ],
  },
  {
    id: chapterThreeId,
    title: 'Chapter Three - Salt and Echo',
    chapterLines: [
      'At the coast, gulls wheel above ships that never anchor long.',
      'Someone in the crowd speaks your old nickname.',
      'The sea keeps no records, but people do.',
    ],
    questBunch: [
      { questionId: `${chapterThreeId}-q1`, title: 'Quest 1/4 - The Name', prompt: 'Do you answer when they call?', options: [{ option: 'A', label: 'Yes, immediately' }, { option: 'B', label: 'After a pause' }, { option: 'C', label: 'Only in private' }, { option: 'D', label: 'Never' }] },
      { questionId: `${chapterThreeId}-q2`, title: 'Quest 2/4 - The Price', prompt: 'A captain offers passage for one truth. Which truth?', options: [{ option: 'A', label: 'Who hunts you' }, { option: 'B', label: 'Who taught you' }, { option: 'C', label: 'Who you failed' }, { option: 'D', label: 'Who you loved' }, { option: 'E', label: 'Who you buried' }] },
      { questionId: `${chapterThreeId}-q3`, title: 'Quest 3/4 - The Harbor', prompt: 'Where do you sleep tonight?', options: [{ option: 'A', label: 'On deck beneath a tarp' }, { option: 'B', label: 'In a crowded inn hall' }, { option: 'C', label: 'Under a pier with smugglers' }] },
      { questionId: `${chapterThreeId}-q4`, title: 'Quest 4/4 - The Echo', prompt: 'Before dawn, what do you leave behind?', options: [{ option: 'A', label: 'A coin' }, { option: 'B', label: 'A letter' }, { option: 'C', label: 'A knife' }, { option: 'D', label: 'A prayer' }] },
    ],
  },
];

export const getNextChapter = (completedChapterIds: string[] = []): ChapterDefinition =>
  CHAPTER_CATALOG.find((chapter) => !completedChapterIds.includes(chapter.id)) ?? CHAPTER_CATALOG[CHAPTER_CATALOG.length - 1];

export const getActiveChapter = (completedChapterIds: string[] = []): ChapterDefinition =>
  getNextChapter(completedChapterIds);
