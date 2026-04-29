export type TutorialStep =
  | 'intro_1'
  | 'intro_2'
  | 'intro_3'
  | 'name_input'
  | 'vignettes'
  | 'vignette_1'
  | 'vignette_2'
  | 'vignette_3'
  | 'post_vignettes'
  | 'map_reveal'
  | 'map_explore'
  | 'boar_encounter'
  | 'village_arrival'
  | 'deckard_approach'
  | 'village_return'
  | 'deckard_lore_1'
  | 'deckard_lore_2'
  | 'deckard_lore_3'
  | 'deckard_lore_4'
  | 'deckard_lore_5'
  | 'deckard_lore_6'
  | 'deckard_lore_7'
  | 'deckard_farewell'
  | 'tavern_prompt'
  | 'tavern_visit'
  | 'tutorial_complete'
  | 'idle_play';

export type TabId = 'play' | 'map' | 'character';

export type AmbientRegion = 'unknown' | 'forest' | 'village' | 'tavern';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface GameUnlocks {
  map: boolean;
  profile: boolean;
  tavern: boolean;
  quests: boolean;
  activities: {
    hunt: boolean;
    forage: boolean;
    explore: boolean;
    questsTab: boolean;
  };
}

export interface GameState {
  version: 1;
  timestamp: number;
  tutorial: {
    step: TutorialStep;
    completed: boolean;
    name: string;
    race: string;
    guards: string[];
  };
  unlocks: GameUnlocks;
  character: {
    profession: string;
    region: 'Unknown Region' | 'Amnesia Village';
    shelter: string;
    traits: string[];
    modifiers: Record<string, number>;
    hourlyCopper: number;
    hourlyXp: number;
    lastSimTime: number;
    day: number;
    health: number;
    maxHealth: number;
    copperAccumulated: number;
    xpAccumulated: number;
    inventory: string[];
  };
  completedQuestIds: string[];
}
