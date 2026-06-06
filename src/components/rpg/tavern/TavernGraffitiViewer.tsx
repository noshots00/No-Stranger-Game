import { GamePanelDialog } from '../GamePanelDialog';
import { TAVERN_GRAFFITI_SRC } from './tavernArt';

type TavernGraffitiViewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TavernGraffitiViewer({ open, onOpenChange }: TavernGraffitiViewerProps) {
  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Tavern graffiti"
      panelClassName="h-auto max-h-[min(88dvh,720px)] gap-2 p-3 pt-7"
    >
      <img
        src={TAVERN_GRAFFITI_SRC}
        alt="Graffiti carved into the tavern restroom wall"
        className="mx-auto max-h-[min(75dvh,640px)] w-full rounded-md border border-[var(--candle-rule)] object-contain shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      />
    </GamePanelDialog>
  );
}
