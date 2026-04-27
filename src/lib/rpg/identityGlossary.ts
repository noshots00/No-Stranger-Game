import { CLASS_CATALOG } from './classCatalog';
import { PROFESSION_CATALOG } from './professionCatalog';
import { RACE_CATALOG } from './raceCatalog';

const RACE_MAP = new Map(RACE_CATALOG.map((entry) => [entry.name.toLowerCase(), entry.description]));
const CLASS_MAP = new Map(CLASS_CATALOG.map((entry) => [entry.name.toLowerCase(), entry.description]));
const PROFESSION_MAP = new Map(PROFESSION_CATALOG.map((entry) => [entry.name.toLowerCase(), entry.description]));

export const getRaceDescription = (race: string | undefined): string | undefined => {
  if (!race) return undefined;
  return RACE_MAP.get(race.toLowerCase());
};

export const getClassDescription = (className: string | undefined): string | undefined => {
  if (!className) return undefined;
  return CLASS_MAP.get(className.toLowerCase());
};

export const getProfessionDescription = (profession: string | undefined): string | undefined => {
  if (!profession) return undefined;
  return PROFESSION_MAP.get(profession.toLowerCase());
};
