import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Native scroll region for in-game panels (avoids Radix ScrollArea in the portrait shell). */
export function GamePanelScroll({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-h-0 overflow-y-auto overflow-x-hidden', className)}>{children}</div>
  );
}
