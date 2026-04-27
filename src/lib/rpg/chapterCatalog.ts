export interface ChapterQuestOption {
  option: 'A' | 'B' | 'C';
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
];

export const getActiveChapter = (): ChapterDefinition => CHAPTER_CATALOG[0];
