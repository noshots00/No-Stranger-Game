import type { NostrEvent } from '@nostrify/nostrify';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

export function NoteContent({ event, className }: NoteContentProps) {
  return <span className={className}>{event.content}</span>;
}
