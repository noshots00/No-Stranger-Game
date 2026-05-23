import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type VillageFeedRefreshButtonProps = {
  isFetching: boolean;
  onRefresh: () => void;
  className?: string;
};

export function VillageFeedRefreshButton({
  isFetching,
  onRefresh,
  className,
}: VillageFeedRefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'font-serif text-[0.65rem] uppercase tracking-[0.1em] text-[var(--candle-ink-soft)]',
        className
      )}
      disabled={isFetching}
      onClick={() => onRefresh()}
    >
      {isFetching ? 'Updating…' : 'Update'}
    </Button>
  );
}
