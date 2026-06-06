import { cn } from '@/lib/utils';

export function NewDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'size-1.5 shrink-0 rounded-full bg-[var(--candle-flame-soft)] shadow-[0_0_6px_rgba(230,161,87,0.55)]',
        className
      )}
      aria-hidden
    />
  );
}
