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
      hideCloseButton
      panelClassName="h-auto max-h-none w-auto max-w-none border-0 bg-transparent p-0 shadow-none"
    >
      <img
        src={TAVERN_GRAFFITI_SRC}
        alt="Graffiti carved into the tavern restroom wall"
        className="mx-auto block max-h-[min(34dvh,200px)] max-w-[min(72vw,220px)] w-auto object-contain shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      />
    </GamePanelDialog>
  );
}
