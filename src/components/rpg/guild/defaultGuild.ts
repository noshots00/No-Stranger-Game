export const DEFAULT_GUILD_SLUG = 'new-players-guild';

export type GuildDefinitionView = {
  slug: string;
  name: string;
  leaderName: string;
  /** Set when loaded from a relay definition event. */
  founderPubkey?: string;
  isDefault?: boolean;
};

export const DEFAULT_GUILD: GuildDefinitionView = {
  slug: DEFAULT_GUILD_SLUG,
  name: 'New Players Guild',
  leaderName: 'Gannon',
  isDefault: true,
};
