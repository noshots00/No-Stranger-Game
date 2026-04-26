const POLICY_STORAGE_KEY = 'nsg:tier3-policy';

export type VisibilityMode = 'public' | 'followers' | 'private';

export interface Tier3PolicySettings {
  experimentalEnabled: boolean;
  zapInfluenceEnabled: boolean;
  traumaEnabled: boolean;
  scarsEnabled: boolean;
  summoningEnabled: boolean;
  visibility: VisibilityMode;
}

export const DEFAULT_TIER3_POLICY: Tier3PolicySettings = {
  experimentalEnabled: false,
  zapInfluenceEnabled: false,
  traumaEnabled: false,
  scarsEnabled: false,
  summoningEnabled: false,
  visibility: 'followers',
};

export const loadTier3Policy = (): Tier3PolicySettings => {
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY);
    if (!raw) return DEFAULT_TIER3_POLICY;
    const parsed = JSON.parse(raw) as Partial<Tier3PolicySettings>;
    return { ...DEFAULT_TIER3_POLICY, ...parsed };
  } catch {
    return DEFAULT_TIER3_POLICY;
  }
};

export const saveTier3Policy = (settings: Tier3PolicySettings): void => {
  try {
    localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore failures.
  }
};
