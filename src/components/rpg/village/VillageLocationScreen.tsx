import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import {
  RPG_CHOICE_GRID,
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_VILLAGE_HUB_BANNER,
} from '../typography/rpgUiTypography';

import { getVillageLocationBanner } from './villageLocationArt';
import type { VillagePanelId } from './villageCatalog';

type VillageLocationScreenProps = {
  panel: VillagePanelId;
  className?: string;
  /** Override banner caption (defaults to art map tagline). */
  tagline?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function VillageLocationScreen({
  panel,
  className,
  tagline,
  onClose,
  children,
  footer,
}: VillageLocationScreenProps) {
  const banner = getVillageLocationBanner(panel);
  const displayTagline = tagline ?? banner.tagline;

  return (
    <section className={cn('village-location-screen relative flex h-full min-h-0 flex-col gap-1', className)}>
      <header className="shrink-0 space-y-0.5 px-0.5">
        <div className={cn(RPG_VILLAGE_HUB_BANNER, 'relative')}>
          <img
            src={banner.src}
            alt=""
            className="h-full w-full object-cover"
            style={banner.objectPosition ? { objectPosition: banner.objectPosition } : undefined}
          />
        </div>
        <p className={cn(RPG_UI_CAPTION, 'text-center text-[var(--candle-wax)]')}>{displayTagline}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-0.5 [scroll-padding-bottom:min(6dvh,64px)]">
        <div className="space-y-1">{children}</div>
      </div>

      <div className="shrink-0 space-y-1 pt-0.5">
        {footer ? <ul className={RPG_CHOICE_GRID}>{footer}</ul> : null}
        <ul className={RPG_CHOICE_GRID}>
          <li>
            <button type="button" className={RPG_COMMAND_CHIP} onClick={onClose}>
              <span className={RPG_COMMAND_CHIP_LABEL}>{banner.leaveLabel}</span>
            </button>
          </li>
        </ul>
      </div>
    </section>
  );
}
