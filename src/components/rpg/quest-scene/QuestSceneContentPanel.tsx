import type { ReactNode } from 'react';

type QuestSceneContentPanelProps = {
  children: ReactNode;
};

/** Narrative + choices share one lower band; choices center in space below prose. */
export function QuestSceneContentPanel({ children }: QuestSceneContentPanelProps) {
  return <div className="quest-scene-content-panel">{children}</div>;
}
