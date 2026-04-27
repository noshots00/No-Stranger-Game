const POLICY_STORAGE_KEY = 'nsg:tier3-policy';

export type VisibilityMode = 'public' | 'followers' | 'private';

export interface Tier3PolicySettings {
  experimentalEnabled: boolean;
  zapInfluenceEnabled: boolean;
  traumaEnabled: boolean;
  scarsEnabled: boolean;
  summoningEnabled: boolean;
  deadLetterEnabled: boolean;
  echoChamberEnabled: boolean;
  forgettingEnabled: boolean;
  whisperingRelayEnabled: boolean;
  killSwitchEnabled: boolean;
  visibility: VisibilityMode;
}

export const DEFAULT_TIER3_POLICY: Tier3PolicySettings = {
  experimentalEnabled: true,
  zapInfluenceEnabled: true,
  traumaEnabled: true,
  scarsEnabled: true,
  summoningEnabled: true,
  deadLetterEnabled: true,
  echoChamberEnabled: true,
  forgettingEnabled: true,
  whisperingRelayEnabled: true,
  killSwitchEnabled: false,
  visibility: 'followers',
};

export const loadTier3Policy = (): Tier3PolicySettings => {
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY);
    if (!raw) return DEFAULT_TIER3_POLICY;
    const parsed = JSON.parse(raw) as Partial<Tier3PolicySettings>;
    const merged = { ...DEFAULT_TIER3_POLICY, ...parsed };

    // Migration: older saves often had every Tier 3 toggle off.
    // If all feature toggles are off and the kill switch is off, promote to current defaults.
    const featureToggleKeys: Array<keyof Tier3PolicySettings> = [
      'experimentalEnabled',
      'zapInfluenceEnabled',
      'traumaEnabled',
      'scarsEnabled',
      'summoningEnabled',
      'deadLetterEnabled',
      'echoChamberEnabled',
      'forgettingEnabled',
      'whisperingRelayEnabled',
    ];
    const hasAnyFeatureEnabled = featureToggleKeys.some((key) => Boolean(merged[key]));
    if (!hasAnyFeatureEnabled && !merged.killSwitchEnabled) {
      return { ...DEFAULT_TIER3_POLICY, killSwitchEnabled: false, visibility: merged.visibility };
    }

    return merged;
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
