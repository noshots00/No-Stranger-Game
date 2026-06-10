const NPC_DISPLAY_NAMES: Record<string, string> = {
  carl: 'Carl',
  shannon: 'Shannon',
  trainer: 'The Trainer',
  skeleton: 'Living Skeleton',
};

export function getNpcTalkDisplayName(npcTalkId: string): string {
  return NPC_DISPLAY_NAMES[npcTalkId] ?? npcTalkId;
}
