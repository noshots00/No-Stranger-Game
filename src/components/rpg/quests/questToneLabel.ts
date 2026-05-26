import type { QuestDefinition } from './types';

export function questToneDisplayLabel(toneTag: QuestDefinition['toneTag']): string | null {
  if (toneTag === 'vision') return 'Vision';
  if (toneTag === 'echo') return 'Echo';
  return null;
}
