import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NpcTalkFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Warm inset panel chrome for NPC hero — CSS only (matches candle/hearth UI). */
export function NpcTalkFrame({ children, className }: NpcTalkFrameProps) {
  return <div className={cn('npc-talk-hero-panel', className)}>{children}</div>;
}
