import type { NostrMetadata } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

/**
 * RPG Utility Functions for No Stranger Game
 */

export const rollDice = (sides: number, count: number = 1): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

export const rollWithModifier = (sides: number, modifier: number, count: number = 1): number => {
  return rollDice(sides, count) + modifier;
};

export const calculateLevelFromXP = (xp: number): number => {
  // Exponential level curve: each level requires 10% more XP than the last
  if (xp < 100) return 1;
  let level = 1;
  let xpNeeded = 100;
  let xpRemaining = xp;
  
  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * 1.1); // 10% increase per level
  }
  
  return level;
};

export const calculateXPForLevel = (level: number): number => {
  // Calculate cumulative XP needed to reach this level
  if (level <= 1) return 0;
  
  let totalXP = 0;
  let xpForNextLevel = 100;
  
  for (let i = 1; i < level; i++) {
    totalXP += xpForNextLevel;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.1);
  }
  
  return totalXP;
};

export const calculateXPToNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevelFromXP(currentXP);
  const xpForCurrentLevel = calculateXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  return xpForNextLevel - currentXP;
};

export const calculateStatModifier = (stat: number): number => {
  // Standard D&D style modifier: (stat - 10) / 2, rounded down
  return Math.floor((stat - 10) / 2);
};

export const generateRandomEncounter = (location: string): { 
  enemy: string; 
  difficulty: number; 
  reward: { gold: number; xp: number } 
} => {
  const encounters: Record<string, Array<{name: string, difficulty: number, rewardMultiplier: number}>> = {
    starting_town: [
      {name: 'Goblin Scout', difficulty: 1, rewardMultiplier: 0.5},
      {name: 'Street Urchin', difficulty: 1, rewardMultiplier: 0.3},
      {name: 'Town Guard', difficulty: 2, rewardMultiplier: 1.0},
      {name: 'Stray Cat', difficulty: 0, rewardMultiplier: 0.1}
    ],
    forest: [
      {name: 'Wolf Pack', difficulty: 3, rewardMultiplier: 2.0},
      {name: 'Bandit', difficulty: 2, rewardMultiplier: 1.5},
      {name: 'Forest Sprite', difficulty: 2, rewardMultiplier: 1.0},
      {name: 'Ancient Tree Spirit', difficulty: 4, rewardMultiplier: 3.0}
    ],
    mountains: [
      {name: 'Mountain Goat', difficulty: 2, rewardMultiplier: 1.0},
      {name: 'Stone Golem', difficulty: 4, rewardMultiplier: 2.5},
      {name: 'Cave Bat', difficulty: 1, rewardMultiplier: 0.5},
      {name: 'Eagle', difficulty: 3, rewardMultiplier: 1.5}
    ],
    dungeon: [
      {name: 'Skeleton', difficulty: 2, rewardMultiplier: 1.0},
      {name: 'Zombie', difficulty: 2, rewardMultiplier: 1.2},
      {name: 'Trap', difficulty: 3, rewardMultiplier: 0.5},
      {name: 'Treasure Chest', difficulty: 1, rewardMultiplier: 5.0} // Special case
    ]
  };
  
  const locationEncounters = encounters[location as keyof typeof encounters] || 
    [{name: 'Mysterious Stranger', difficulty: 2, rewardMultiplier: 1.0}];
  
  const randomIndex = Math.floor(Math.random() * locationEncounters.length);
  const encounter = locationEncounters[randomIndex];
  
  // Calculate rewards based on difficulty and character level (would be passed in real implementation)
  const baseGold = encounter.difficulty * 20;
  const baseXP = encounter.difficulty * 15;
  
  return {
    enemy: encounter.name,
    difficulty: encounter.difficulty,
    reward: {
      gold: Math.floor(baseGold * encounter.rewardMultiplier),
      xp: Math.floor(baseXP * encounter.rewardMultiplier)
    }
  };
};

export const calculateCombatDamage = (attackerStat: number, defenderStat: number, weaponDamage: number, attackerLevel: number = 1, defenderLevel: number = 1): number => {
  // Level-scaled combat
  const attackModifier = calculateStatModifier(attackerStat) + Math.floor(attackerLevel / 5);
  const defenseModifier = calculateStatModifier(defenderStat) + Math.floor(defenderLevel / 5);
  
  const attackRoll = rollDice(20) + attackModifier;
  const defenseRoll = rollDice(20) + defenseModifier;
  
  if (attackRoll > defenseRoll) {
    // Hit! Calculate damage
    const baseDamage = rollDice(6) + weaponDamage + Math.floor(attackerLevel / 3); // Level scaling
    const critChance = attackRoll >= 20; // Natural 20 is crit
    const critMultiplier = critChance ? 2 : 1;
    
    // Add glancing blow/chance to miss based on level difference
    const levelDiff = attackerLevel - defenderLevel;
    const hitChanceModifier = Math.max(0.5, Math.min(1.5, 1 + (levelDiff * 0.1))); // +/- 10% per level difference
    
    if (Math.random() < hitChanceModifier) {
      return Math.floor(baseDamage * critMultiplier);
    }
    return 0; // Miss due to level difference
  }
  return 0; // Miss
};

export const generateQuestReward = (questDifficulty: number, playerLevel: number = 1): { gold: number; xp: number; item?: string } => {
  // Scale rewards with player level
  const levelMultiplier = 1 + (playerLevel - 1) * 0.2; // 20% increase per level above 1
  
  const baseGold = questDifficulty * 15 * levelMultiplier;
  const baseXP = questDifficulty * 20 * levelMultiplier;
  
  const goldReward = Math.floor(baseGold + rollDice(Math.floor(baseGold * 0.5), 2)); // Add variability
  const xpReward = Math.floor(baseXP + rollDice(Math.floor(baseXP * 0.5), 2));
  
  let itemReward: string | undefined;
  const itemChance = Math.min(0.5, 0.1 + (playerLevel * 0.05)); // Increases with level
  
  if (Math.random() < itemChance) { // Chance for item
    const commonItems = ['Healing Potion', 'Iron Sword', 'Leather Armor', 'Magic Scroll'];
    const uncommonItems = ['Steel Blade', 'Chain Mail', 'Mystic Ring', 'Explorer\'s Map'];
    const rareItems = ['Enchanted Blade', 'Plate Armor', 'Amulet of Power', 'Legendary Tome'];
    
    const itemRoll = Math.random();
    if (itemRoll < 0.6) {
      itemReward = commonItems[Math.floor(Math.random() * commonItems.length)];
    } else if (itemRoll < 0.9) {
      itemReward = uncommonItems[Math.floor(Math.random() * uncommonItems.length)];
    } else {
      itemReward = rareItems[Math.floor(Math.random() * rareItems.length)];
    }
  }
  
  return { gold: goldReward, xp: xpReward, item: itemReward };
};

const CHARACTER_STORAGE_PREFIX = 'nsg:character:';
const NOSTR_LOAD_TIMEOUT_MS = 8000;
const NOSTR_SAVE_TIMEOUT_MS = 15000;
const MVP_CHARACTER_STORAGE_KEY = 'noStrangerCharacter';

export type CreationAnswer = 0 | 1 | 2;

export interface MainQuestChoice {
  questId: string;
  prompt: string;
  option: 'A' | 'B' | 'C';
  consequence: string;
  chosenAt: number;
}

export interface MVPCharacter {
  id: string;
  createdAt: number;
  level: number;
  role: 'stranger';
  characterName: string;
  gender: string;
  classId?: number;
  answers?: [CreationAnswer, CreationAnswer, CreationAnswer];
  mainQuestChoices: MainQuestChoice[];
  pubkey?: string;
  npub?: string;
}

export interface NetworkPresenceMember {
  pubkey: string;
  nostrName: string;
  characterName: string;
  classLabel: string;
  picture?: string;
}

export const mergeUniquePubkeys = (follows: string[], followers: string[], currentUserPubkey: string): string[] => {
  const unique = new Set<string>([...follows, ...followers]);
  unique.delete(currentUserPubkey);
  return [...unique];
};

export const getDisplayNameForPubkey = (
  pubkey: string,
  metadata: NostrMetadata | undefined,
): string => {
  const preferredName = metadata?.display_name?.trim() || metadata?.name?.trim();
  if (preferredName) return preferredName;

  try {
    return nip19.npubEncode(pubkey).slice(0, 16) + '...';
  } catch {
    return `${pubkey.slice(0, 12)}...`;
  }
};

export const computeMVPClassId = (
  answers: [CreationAnswer, CreationAnswer, CreationAnswer],
): number => {
  const [q1, q2, q3] = answers;
  return (q1 * 9) + (q2 * 3) + q3 + 1;
};

export const saveMVPCharacter = (character: MVPCharacter): void => {
  try {
    localStorage.setItem(MVP_CHARACTER_STORAGE_KEY, JSON.stringify(character));
  } catch (error) {
    console.error('Failed to save MVP character:', error);
  }
};

export const loadMVPCharacter = (): MVPCharacter | null => {
  try {
    const raw = localStorage.getItem(MVP_CHARACTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MVPCharacter>;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const legacyAnswers = Array.isArray(parsed.answers) && parsed.answers.length === 3
      ? parsed.answers as [CreationAnswer, CreationAnswer, CreationAnswer]
      : undefined;
    const mainQuestChoices = Array.isArray(parsed.mainQuestChoices) ? parsed.mainQuestChoices as MainQuestChoice[] : [];

    return {
      id: parsed.id ?? `temp-${Date.now()}`,
      createdAt: parsed.createdAt ?? Date.now(),
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      role: 'stranger',
      characterName: typeof parsed.characterName === 'string' && parsed.characterName.trim() ? parsed.characterName : 'Nameless Stranger',
      gender: typeof parsed.gender === 'string' && parsed.gender.trim() ? parsed.gender : 'Unknown',
      classId: typeof parsed.classId === 'number' ? parsed.classId : undefined,
      answers: legacyAnswers,
      mainQuestChoices,
      pubkey: parsed.pubkey,
      npub: parsed.npub,
    };
  } catch (error) {
    console.error('Failed to load MVP character:', error);
    return null;
  }
};

export const clearMVPCharacter = (): void => {
  try {
    localStorage.removeItem(MVP_CHARACTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear MVP character:', error);
  }
};

const getCharacterStorageKey = (pubkey: string): string => `${CHARACTER_STORAGE_PREFIX}${pubkey}`;

const saveGameDataLocal = (userPubkey: string, data: unknown): void => {
  try {
    localStorage.setItem(getCharacterStorageKey(userPubkey), JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save character to local storage:', error);
  }
};

const loadGameDataLocal = (userPubkey: string): any => {
  try {
    const raw = localStorage.getItem(getCharacterStorageKey(userPubkey));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load character from local storage:', error);
    return null;
  }
};

export const saveGameData = async (nostr: any, userPubkey: string, data: any): Promise<void> => {
  // Always persist locally first so gameplay is never blocked by signer/relay issues.
  saveGameDataLocal(userPubkey, data);

  try {
    await Promise.race([
      nostr.event({
        kind: 3223, // Character Profile
        content: JSON.stringify(data),
        tags: [
          ['d', userPubkey],
          ['class', data.class || 'adventurer'],
          ['level', data.level?.toString() || '1'],
          ['xp', data.xp?.toString() || '0']
        ]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Nostr save timed out')), NOSTR_SAVE_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn('Saved character locally; failed to publish to Nostr:', error);
  }
};

export const loadGameData = async (nostr: any, userPubkey: string): Promise<any> => {
  const localCharacter = loadGameDataLocal(userPubkey);

  try {
    const events = await nostr.query([
      {
        kinds: [3223], // Character Profile
        authors: [userPubkey],
        limit: 1
      }
    ], { signal: AbortSignal.timeout(NOSTR_LOAD_TIMEOUT_MS) });

    if (events.length > 0) {
      const fromNostr = JSON.parse(events[0].content);
      saveGameDataLocal(userPubkey, fromNostr);
      return fromNostr;
    }
  } catch (error) {
    console.warn('Failed to load character from Nostr; using local fallback if available:', error);
  }

  return localCharacter;
};

/**
 * Generate a unique quest ID based on content and timestamp
 */
export const generateQuestID = (content: string): string => {
  // Simple hash function for quest ID
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return `quest_${Math.abs(hash)}_${Date.now()}`;
};

/**
 * Calculate travel time between locations
 */
export const calculateTravelTime = (fromLocation: string, toLocation: string, playerSpeed: number = 1): number => {
  // Simplified distance calculation (would use actual coordinates in real implementation)
  const locationCoords: Record<string, {x: number, y: number}> = {
    starting_town: {x: 0, y: 0},
    forest: {x: -100, y: -50},
    mountains: {x: -150, y: 100},
    dungeon: {x: -50, y: -150}
  };
  
  const from = locationCoords[fromLocation as keyof typeof locationCoords] || {x: 0, y: 0};
  const to = locationCoords[toLocation as keyof typeof locationCoords] || {x: 0, y: 0};
  
  const distance = Math.sqrt(
    Math.pow(to.x - from.x, 2) + 
    Math.pow(to.y - from.y, 2)
  );
  
  // Base travel time is distance / speed, with minimum of 1 minute
  return Math.max(1, Math.floor(distance / (playerSpeed * 10)));
};

/**
 * Generate loot from defeated enemies
 */
export const generateEnemyLoot = (enemyDifficulty: number, playerLevel: number = 1): Array<{item: string; quantity: number}> => {
  const lootTable: Record<string, {items: string[], chance: number, quantityRange: [number, number]}> = {
    'Goblin Scout': {items: ['Goblin Ear', 'Rusty Dagger', 'Cloth Scraps'], chance: 0.4, quantityRange: [1, 2]},
    'Street Urchin': {items: ['Copper Coin', 'Bread Stale', 'Ragged Cloth'], chance: 0.3, quantityRange: [1, 3]},
    'Town Guard': {items: ['Iron Shield', 'Steel Helmet', 'Guard Badge'], chance: 0.5, quantityRange: [1, 1]},
    'Wolf Pack': {items: ['Wolf Pelt', 'Wolf Fang', 'Meat Chunk'], chance: 0.6, quantityRange: [1, 3]},
    'Bandit': {items: ['Leather Vest', 'Short Sword', 'Stolen Goods'], chance: 0.5, quantityRange: [1, 2]},
    'Stone Golem': {items: ['Stone Shard', 'Gem Fragment', 'Ancient Rune'], chance: 0.3, quantityRange: [1, 2]},
    'Skeleton': {items: ['Bone Fragment', 'Rusty Sword', 'Dusty Armor'], chance: 0.4, quantityRange: [1, 3]},
    'Zombie': {items: ['Rotten Flesh', 'Tattered Cloth', 'Zombie Brain'], chance: 0.5, quantityRange: [1, 2]},
    'Treasure Chest': {items: ['Gold Coin', 'Jeweled Crown', 'Magic Staff'], chance: 0.8, quantityRange: [1, 4]} // Special
  };
  
  // Get enemy name from difficulty (simplified)
  const enemyNames = Object.keys(lootTable);
  const enemyName = enemyNames[Math.floor(Math.random() * enemyNames.length)] || 'Goblin Scout';
  
  const lootInfo = lootTable[enemyName] || {items: ['Miscellaneous Junk'], chance: 0.2, quantityRange: [1, 1]};
  
  const loot: Array<{item: string; quantity: number}> = [];
  
  // Determine if loot drops
  if (Math.random() < lootInfo.chance * (1 + (playerLevel - 1) * 0.1)) { // Increased chance with player level
    const numItems = Math.floor(Math.random() * (lootInfo.quantityRange[1] - lootInfo.quantityRange[0] + 1)) + lootInfo.quantityRange[0];
    
    for (let i = 0; i < numItems; i++) {
      const item = lootInfo.items[Math.floor(Math.random() * lootInfo.items.length)];
      const quantity = Math.floor(Math.random() * (lootInfo.quantityRange[1] - lootInfo.quantityRange[0] + 1)) + lootInfo.quantityRange[0];
      loot.push({item, quantity});
    }
  }
  
  return loot;
};