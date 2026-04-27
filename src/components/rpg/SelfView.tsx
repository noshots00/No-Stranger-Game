import type { MVPCharacter } from '@/lib/rpg/utils';
import type { ProofChainNode } from '@/hooks/useProofChain';
import type { RelayRegion } from '@/hooks/useRelayRegions';
import { CollapsibleSection } from './CollapsibleSection';
import { Switch } from '@/components/ui/switch';
import type { Tier3PolicySettings } from '@/lib/rpg/policy';
import { getClassDescription, getProfessionDescription, getRaceDescription } from '@/lib/rpg/identityGlossary';
import { ResponsiveTooltip } from './ResponsiveTooltip';

interface SelfViewProps {
  character: MVPCharacter;
  proofNodes: ProofChainNode[];
  relayRegions: RelayRegion[];
  tier3Policy: Tier3PolicySettings;
  onUpdatePolicy: (nextPolicy: Tier3PolicySettings) => void;
  onNewGame: () => void;
  onForgetProof: (eventId: string) => void;
}

export function SelfView({
  character,
  proofNodes,
  relayRegions,
  tier3Policy,
  onUpdatePolicy,
  onNewGame,
  onForgetProof,
}: SelfViewProps) {
  const raceDescription = getRaceDescription(character.race) ?? 'Unknown race lore.';
  const classDescription = getClassDescription(character.className || 'Wanderer') ?? 'Unknown class lore.';
  const professionDescription = getProfessionDescription(character.profession) ?? 'Unknown profession lore.';
  const characterAgeDays = Math.max(
    0,
    Math.floor((Date.now() - character.createdAt) / (1000 * 60 * 60 * 24)),
  );
  const characterAgeLabel = characterAgeDays === 0
    ? 'Born today'
    : `${characterAgeDays} day${characterAgeDays === 1 ? '' : 's'} old`;

  return (
      <div className="px-4 py-8 max-w-lg mx-auto space-y-10">
        <div className="text-center emerge">
          <p className="font-cormorant text-3xl font-light" style={{ color: 'var(--ink)' }}>
            {character.characterName}
          </p>
          <p className="mt-2 text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--ink-dim)' }}>
            Level {character.level} ·{' '}
            <ResponsiveTooltip content={classDescription}>
              <button type="button" className="underline underline-offset-2 decoration-dotted">
                {character.className || 'Wanderer'}
              </button>
            </ResponsiveTooltip>
          </p>
          <p className="mt-1 text-xs flex items-center justify-center gap-1.5 flex-wrap" style={{ color: 'var(--ink-ghost)' }}>
            <ResponsiveTooltip content={raceDescription}>
              <button type="button" className="underline underline-offset-2 decoration-dotted">
                {character.race}
              </button>
            </ResponsiveTooltip>
            <span>·</span>
            <ResponsiveTooltip content={professionDescription}>
              <button type="button" className="underline underline-offset-2 decoration-dotted">
                {character.profession}
              </button>
            </ResponsiveTooltip>
          </p>
          <p className="mt-1 text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-dim)' }}>
            Age · {characterAgeLabel}
          </p>
          {character.npub ? (
            <a
              href={`https://primal.net/p/${character.npub}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: 'var(--ember-dim)' }}
            >
              View on Nostr ↗
            </a>
          ) : null}
        </div>

        <div className="h-px w-16 mx-auto" style={{ background: 'var(--ink-ghost)' }} />

        <CollapsibleSection title="Revealed Nature">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>
              Gold: {character.gold ?? 0} · Health: {character.health ?? 100}
            </p>
            {character.visibleTraits && character.visibleTraits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {character.visibleTraits.map((trait) => (
                  <span key={trait} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--ink)', background: 'var(--surface)' }}>
                    {trait}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-cormorant text-sm italic" style={{ color: 'var(--ink-ghost)' }}>
                No traits have surfaced yet.
              </p>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Unrevealed Depth" defaultOpen={false}>
          <p className="font-cormorant text-sm italic" style={{ color: 'var(--ink-ghost)' }}>
            {character.hiddenTraits && character.hiddenTraits.length > 0
              ? `${character.hiddenTraits.length} qualities remain obscured.`
              : 'Nothing remains hidden.'}
          </p>
        </CollapsibleSection>

        {character.mainQuestChoices.length > 0 ? (
          <CollapsibleSection title="Sealed Choices">
            <div className="space-y-3">
              {character.mainQuestChoices.map((choice) => (
                <div key={`${choice.questId}-${choice.chosenAt}`} className="pl-4 border-l" style={{ borderColor: 'var(--ink-ghost)' }}>
                  <p className="font-cormorant text-sm" style={{ color: 'var(--ink-dim)' }}>
                    {choice.consequence}
                  </p>
                  <p className="text-xs font-mono mt-1" style={{ color: 'var(--ink-ghost)' }}>
                    {choice.option}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection title="Your Path" defaultOpen={false}>
        {proofNodes.length > 0 ? (
          <div className="space-y-2">
            {proofNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ember-dim)' }} />
                  <p className="text-xs font-mono" style={{ color: 'var(--ink-ghost)' }}>
                    {node.window} → {node.choice}
                  </p>
                </div>
                {tier3Policy.forgettingEnabled && !tier3Policy.killSwitchEnabled ? (
                  <button type="button" onClick={() => onForgetProof(node.id)} className="text-xs font-mono" style={{ color: 'var(--crimson)' }}>
                    ☒
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-cormorant text-sm italic" style={{ color: 'var(--ink-ghost)' }}>
            No path yet.
          </p>
        )}
        </CollapsibleSection>

        <CollapsibleSection title="Your Relays" defaultOpen={false}>
        {relayRegions.length > 0 ? relayRegions.map((region) => (
          <p key={region.relay} className="text-xs" style={{ color: 'var(--ink-dim)' }}>
            {region.region}
          </p>
        )) : (
          <p className="text-xs" style={{ color: 'var(--ink-ghost)' }}>
            No mapped relay regions.
          </p>
        )}
        </CollapsibleSection>

        <CollapsibleSection title="Rituals & Permissions" defaultOpen={false}>
        <div className="space-y-4">
          {[
            { key: 'experimentalEnabled', label: 'Experimental social mechanics' },
            { key: 'deadLetterEnabled', label: 'Dead Letter Office' },
            { key: 'echoChamberEnabled', label: 'Echo Chamber' },
            { key: 'forgettingEnabled', label: 'The Forgetting' },
            { key: 'whisperingRelayEnabled', label: 'Whispering Relay Regions' },
            { key: 'killSwitchEnabled', label: 'Silence all rituals' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm" style={{ color: 'var(--ink-dim)' }}>{label}</span>
              <Switch
                checked={Boolean(tier3Policy[key as keyof Tier3PolicySettings])}
                onCheckedChange={(checked) => onUpdatePolicy({ ...tier3Policy, [key]: checked })}
              />
            </label>
          ))}
        </div>
        </CollapsibleSection>

        <div className="pt-6">
          <button
            type="button"
            onClick={onNewGame}
            className="text-xs tracking-wider uppercase transition-colors"
            style={{ color: 'var(--crimson)' }}
          >
            Abandon this stranger
          </button>
        </div>
      </div>
  );
}
