import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type QuestSceneActionBoxProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export const QuestSceneActionBox = forwardRef<HTMLDivElement, QuestSceneActionBoxProps>(
  function QuestSceneActionBox({ children, className, innerClassName }, ref) {
    return (
      <div
        ref={ref}
        className={cn('quest-scene-action-box rpg-panel facsimile-scroll px-1.5 py-1', className)}
      >
        <div className={cn('quest-scene-action-inner', innerClassName)}>{children}</div>
      </div>
    );
  }
);
