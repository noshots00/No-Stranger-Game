/**
 * Mayor Shannon (quest 042) — phased village welcome dialogue.
 */

import {
  appendPair,
  type TranscriptEntry,
} from '@/components/rpg/merchant/merchantDialogueTree';

export type { TranscriptEntry };

function nextId(): string {
  return `shannon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SHANNON_OPENING_LINE = 'Welcome, traveler...';

export const SHANNON_ATTACK_SLAP_NARRATOR =
  'With surprising speed, the old man slaps you with an open palm.';

export const SHANNON_ATTACK_REPLY = "Now's not the time for that.";

export function buildMayorIdentityReply(mayorName: string): string {
  return `You are in ${mayorName}'s Village. I am the mayor, ${mayorName}.`;
}

export const SHANNON_MEMORY_LINE =
  'Everyone here woke up in that forest with no memory, as I am sure you did. I am glad you made it to us safely.';

export const SHANNON_JOB_LINE =
  'Life is about survival now. Go to the town hall and choose a job.';

export const SHANNON_MAYOR_RULES_LINE =
  'The mayor makes the rules. Anyone can run for mayor and you can change your vote at any time.';

export type ShannonTopicId = 'arena' | 'blobbi' | 'tavern' | 'market' | 'crafters';

export const SHANNON_TOPIC_CHOICES: ReadonlyArray<{
  id: ShannonTopicId;
  label: string;
  reply: string;
}> = [
  {
    id: 'arena',
    label: 'Tell me about the Arena',
    reply:
      'The forest is a dangerous place... a lot of the people here train in combat. The arena is a place where contests are held to see who fights the best.',
  },
  {
    id: 'blobbi',
    label: 'Tell me about Blobbi fighting',
    reply:
      "Some people train their Blobbi's to fight... I heard there's a way to bet on the outcome.",
  },
  {
    id: 'tavern',
    label: 'Tell me about the Tavern',
    reply: 'A good place to rest and meet people.',
  },
  {
    id: 'market',
    label: 'Tell me about the Market',
    reply: 'You can buy and sell goods there.',
  },
  {
    id: 'crafters',
    label: "Tell me about Crafter's Corner",
    reply: 'Some folks set up a place to tinker and craft...',
  },
];

export const SHANNON_THANKS_LABEL = 'Thanks';

export type ShannonTalkPhase =
  | 'intro'
  | 'post_attack'
  | 'identity_reveal'
  | 'memory'
  | 'job_pitch'
  | 'work_shock'
  | 'topics_hub';

export function seedShannonOpeningTranscript(): TranscriptEntry[] {
  return [
    {
      id: nextId(),
      role: 'narrator',
      text: '...',
    },
  ];
}

export function appendShannonPair(playerLine: string, shannonLine: string): TranscriptEntry[] {
  return appendPair(playerLine, shannonLine);
}
