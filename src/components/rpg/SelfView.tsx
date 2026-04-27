import type { MVPCharacter } from '@/lib/rpg/utils';
import type { ProofChainNode } from '@/hooks/useProofChain';
import type { RelayRegion } from '@/hooks/useRelayRegions';
import { CollapsibleSection } from './CollapsibleSection';
import { Switch } from '@/components/ui/switch';
import type { Tier3PolicySettings } from '@/lib/rpg/policy';

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
  return (
    <div className="px-4 py-8 max-w-lg mx-auto space-y-10">
      <div className="text-center emerge">
        <p className="font-cormorant text-3xl font-light" style={{ color: 'var(--ink)' }}>
          {character.characterName}
        </p>
        <p className="mt-2 text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--ink-dim)' }}>
          Level {character.level} · {character.className || 'Wanderer'}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-ghost)' }}>
          {character.race} · {character.profession}
        </p>
      </div>

      <div className="h-px w-16 mx-auto" style={{ background: 'var(--ink-ghost)' }} />

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
