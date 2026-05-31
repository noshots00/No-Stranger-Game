/**
 * Merchant Talk tab: topic graph + scripted choices (not persisted; resets when panel closes).
 */

export type TopicId = 'main' | 'weather' | 'road' | 'dreams';

export type TranscriptRole = 'player' | 'merchant' | 'narrator';

export type TranscriptEntry = {
  id: string;
  role: TranscriptRole;
  text: string;
};

export type DialogueChoice =
  | { id: string; type: 'reply'; label: string; merchantText: string }
  | { id: string; type: 'combat'; label: string }
  | {
      id: string;
      type: 'enterTopic';
      label: string;
      topicId: Exclude<TopicId, 'main'>;
      /** Merchant line right after the player asks to switch topic (before landing copy). */
      merchantBridge: string;
    };

/** Shown after player picks “Let’s talk about something else.” */
export const EXIT_TO_MAIN_LABEL = "Let's talk about something else.";

export const EXIT_TO_MAIN_MERCHANT =
  'The Merchant spreads his hands. “Fair enough. What’s next on your mind?”';

/** Seed the transcript when the panel opens (narrator atmosphere + scroll test). */
export const MERCHANT_OPENING_NARRATOR: readonly string[] = [
  'The tarp smells like last week’s rain and someone’s ambition. A wheel squeaks in a rhythm that almost counts as music.',
  'Papers shuffle without hands moving. Ink smudges in shapes that could be signatures from another alphabet.',
  'Sunlight finds a seam in the roof and insists on being dramatic. Dust keeps its own council.',
  'The Merchant notices you waiting. His smile is practised and warm.',
];

export const MERCHANT_TOPICS: Record<TopicId, { choices: DialogueChoice[] }> = {
  main: {
    choices: [
      {
        id: 'enter-weather',
        type: 'enterTopic',
        label: 'Ask about the weather.',
        topicId: 'weather',
        merchantBridge: '“Sky? I sell canvas. But ask—everyone does.”',
      },
      {
        id: 'enter-road',
        type: 'enterTopic',
        label: 'Comment on the road.',
        topicId: 'road',
        merchantBridge: '“The road’s an opinion the mud agrees with. Go on.”',
      },
      {
        id: 'enter-dreams',
        type: 'enterTopic',
        label: 'Mention dreams.',
        topicId: 'dreams',
        merchantBridge: '“Dreams.” He drums the counter once. “Unpaid inventory, but go on.”',
      },
      {
        id: 'scales',
        type: 'reply',
        label: 'Stare at the scales.',
        merchantText: '“They weigh intention. Results vary.”',
      },
      {
        id: 'wagon',
        type: 'reply',
        label: 'Praise the wagon.',
        merchantText: '“She remembers every rut. We have an understanding.”',
      },
      {
        id: 'business',
        type: 'reply',
        label: 'Ask if business is good.',
        merchantText: '“Business is a weasel-word. Money is simpler.”',
      },
      {
        id: 'ribbons',
        type: 'reply',
        label: 'Compliment the ribbons.',
        merchantText: '“Ribbons keep chaos polite. You’re welcome.”',
      },
      {
        id: 'wolves',
        type: 'reply',
        label: 'Wonder aloud about wolves.',
        merchantText: '“Wolves are freelance. I prefer contractors.”',
      },
      {
        id: 'crate',
        type: 'reply',
        label: 'Point at an unlabeled crate.',
        merchantText: '“That one’s curiosity. The price is a question.”',
      },
      {
        id: 'hum',
        type: 'reply',
        label: 'Hum vaguely.',
        merchantText: '“Humor is currency in some counties. Not mine today.”',
      },
      {
        id: 'directions',
        type: 'reply',
        label: 'Ask for directions.',
        merchantText: '“Direction is a luxury if you already have feet.”',
      },
      {
        id: 'tea',
        type: 'reply',
        label: 'Question the tea.',
        merchantText: '“It’s wet and warm. That’s the contract.”',
      },
      {
        id: 'king',
        type: 'reply',
        label: 'Mention the king.',
        merchantText: '“Kings borrow geography. I rent space by the hour.”',
      },
      {
        id: 'wood',
        type: 'reply',
        label: 'Knock on wood.',
        merchantText: '“Superstition is a loyalty program. Carry on.”',
      },
      {
        id: 'bell',
        type: 'reply',
        label: 'Admire the bell.',
        merchantText: '“It announces nothing on purpose. Very modern.”',
      },
    ],
  },
  weather: {
    choices: [
      {
        id: 'rain',
        type: 'reply',
        label: 'Ask if it will rain.',
        merchantText:
          '“Rain is a creditor. It collects when you’ve forgotten the terms.”',
      },
      {
        id: 'wind',
        type: 'reply',
        label: 'Mention the wind.',
        merchantText: '“Wind is gossip that got out of the trees. Tie things down.”',
      },
      {
        id: 'hail',
        type: 'reply',
        label: 'Ask about hail.',
        merchantText: '“Hail is weather’s rude uncle. I double-tarp when the birds go quiet.”',
      },
    ],
  },
  road: {
    choices: [
      {
        id: 'mud',
        type: 'reply',
        label: 'Ask how bad the mud is.',
        merchantText: '“Mud is democracy—every wheel gets a vote. Pack patience.”',
      },
      {
        id: 'next-town',
        type: 'reply',
        label: 'Ask how far to the next town.',
        merchantText: '“Far enough that wishes won’t pull the wagon. Days, not thoughts.”',
      },
      {
        id: 'bandits',
        type: 'reply',
        label: 'Wonder about bandits.',
        merchantText: '“Bandits adore drama. Pay in boredom when you can.”',
      },
    ],
  },
  dreams: {
    choices: [
      {
        id: 'recurring',
        type: 'reply',
        label: 'Describe a recurring dream.',
        merchantText: '“Recurring is just interest on the same loan. Wake up and refinance.”',
      },
      {
        id: 'nightmares',
        type: 'reply',
        label: 'Mention nightmares.',
        merchantText: '“Nightmares invoice courage. Pay in daylight chores.”',
      },
    ],
  },
};

export const STIPEND_PLAYER_LINE = 'I need gold.';
export const STIPEND_MERCHANT_LINE =
  'The Merchant tosses you a heavy little purse. “Spend it wisely.”';

function nextTranscriptId(): string {
  return `mt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function seedOpeningTranscript(): TranscriptEntry[] {
  return MERCHANT_OPENING_NARRATOR.map((text) => ({
    id: nextTranscriptId(),
    role: 'narrator' as const,
    text,
  }));
}

export function appendPair(playerText: string, merchantText: string): TranscriptEntry[] {
  return [
    { id: nextTranscriptId(), role: 'player', text: playerText },
    { id: nextTranscriptId(), role: 'merchant', text: merchantText },
  ];
}
