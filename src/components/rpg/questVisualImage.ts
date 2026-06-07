import { cn } from '@/lib/utils';

import type { QuestImageFit } from './quests/types';

type QuestVisualImageVariant = 'inline' | 'popup' | 'log';

const BASE =
  'rounded-md border border-[var(--candle-rule)]';

const COVER_CLASSES: Record<QuestVisualImageVariant, string> = {
  inline: cn('mx-auto aspect-[3/4] w-full max-w-[200px] object-cover', BASE),
  popup: cn('mx-auto aspect-[3/4] w-full max-w-[210px] shrink-0 object-cover', BASE),
  log: cn('mx-auto mb-2 aspect-[3/4] w-full max-w-[200px] object-cover', BASE),
};

/** Wide in-quest art only — quest cards always use portrait crop. */
const CONTAIN_CLASSES: Record<QuestVisualImageVariant, string> = {
  inline: cn(
    'mx-auto w-full max-w-[min(100%,14rem)] max-h-[11rem] object-contain bg-black/35',
    BASE
  ),
  popup: cn(
    'mx-auto w-full max-w-[min(100%,14rem)] max-h-[11rem] shrink-0 object-contain bg-black/35',
    BASE
  ),
  log: cn(
    'mx-auto mb-2 w-full max-w-[min(100%,14rem)] max-h-[11rem] object-contain bg-black/35',
    BASE
  ),
};

export function questVisualImageClassName(
  fit: QuestImageFit = 'cover',
  variant: QuestVisualImageVariant = 'inline'
): string {
  return fit === 'contain' ? CONTAIN_CLASSES[variant] : COVER_CLASSES[variant];
}
