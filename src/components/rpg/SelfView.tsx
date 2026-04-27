import type { MVPCharacter } from '@/lib/rpg/utils';
import type { ProofChainNode } from '@/hooks/useProofChain';
import type { RelayRegion } from '@/hooks/useRelayRegions';

interface SelfViewProps {
  character: MVPCharacter;
  proofNodes: ProofChainNode[];
  relayRegions: RelayRegion[];
  onUpdateCharacter: (nextCharacter: MVPCharacter) => void;
}

export function SelfView({
  character,
  proofNodes,
  relayRegions,
  onUpdateCharacter,
}: SelfViewProps) {
  const totalVisibleTraits = character.visibleTraits?.length ?? 0;
  const totalHiddenTraits = character.hiddenTraits?.length ?? 0;
  const totalInjuries = character.injuries?.length ?? 0;
  const experience = character.level * 100;

  return (
    <div className="px-4 py-8 max-w-lg mx-auto space-y-4">
      <p className="font-cormorant text-3xl" style={{ color: 'var(--ink)' }}>{character.characterName}</p>
      <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>{character.profileTitle?.trim() || 'Unnamed Drifter'}</p>
      <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>{character.profileBio?.trim() || '?????'}</p>

      <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ink-ghost)' }}>Core Stats</p>
        <p style={{ color: 'var(--ink)' }}>Health: {character.health ?? 100}</p>
        <p style={{ color: 'var(--ink)' }}>Experience: {experience}</p>
        <p style={{ color: 'var(--ink)' }}>Gold: {character.gold ?? 0}</p>
        <p style={{ color: 'var(--ink)' }}>Class: {character.className || '?????'}</p>
        <p style={{ color: 'var(--ink)' }}>Race: {character.race || '?????'}</p>
        <p style={{ color: 'var(--ink)' }}>Profession: {character.profession || '?????'}</p>
      </div>

      <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ink-ghost)' }}>Traits & Conditions</p>
        <p style={{ color: 'var(--ink)' }}>Visible Traits: {totalVisibleTraits > 0 ? character.visibleTraits?.join(', ') : '?????'}</p>
        <p style={{ color: 'var(--ink)' }}>Hidden Traits: {totalHiddenTraits > 0 ? `${totalHiddenTraits} hidden` : '?????'}</p>
        <p style={{ color: 'var(--ink)' }}>Injuries: {totalInjuries > 0 ? character.injuries?.join(', ') : 'None'}</p>
      </div>

      <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ink-ghost)' }}>Story State</p>
        <p style={{ color: 'var(--ink)' }}>Sealed Choices: {character.mainQuestChoices.length}</p>
        <p style={{ color: 'var(--ink)' }}>Proof Nodes: {proofNodes.length}</p>
        <p style={{ color: 'var(--ink)' }}>Known Relays: {relayRegions.length > 0 ? relayRegions.length : '?????'}</p>
      </div>

      <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ink-ghost)' }}>Public Card</p>
        <input
          value={character.profileTitle ?? ''}
          onChange={(event) => onUpdateCharacter({ ...character, profileTitle: event.target.value })}
          placeholder="Public title"
          className="w-full rounded-md px-3 py-2 text-sm"
          style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
        />
        <textarea
          value={character.profileBio ?? ''}
          onChange={(event) => onUpdateCharacter({ ...character, profileBio: event.target.value })}
          placeholder="Short public bio"
          className="w-full h-24 rounded-md px-3 py-2 text-sm"
          style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
        />
      </div>
    </div>
  );
}
