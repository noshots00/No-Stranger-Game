import { SKILL_SHEET_LABEL, SKILL_XP_KEYS } from '../quests/skills-config';
import { getCharacterLevel, getLevelFromXp } from '../quests/engine';
import { getModifierMessageKind, getCharacterClass } from '../helpers';
import { NPC_AVATAR_URL, characterStats } from '../constants';
import type { QuestState } from '../quests/types';

type CharacterTabProps = {
  questState: QuestState;
  userPubkey: string | undefined;
  onOpenChronicle: () => void;
};

export function CharacterTab({ questState, userPubkey, onOpenChronicle }: CharacterTabProps) {
  const characterLevel = getCharacterLevel(questState);
  const characterClass = getCharacterClass(questState.modifiers);

  const visibleSkillSheetParts: string[] = [];
  for (const key of SKILL_XP_KEYS) {
    const xp = questState.skills[key];
    if (xp < 1) continue;
    visibleSkillSheetParts.push(`${SKILL_SHEET_LABEL[key]} ${getLevelFromXp(xp)}`);
  }

  const nonZeroModifiers = Object.entries(questState.modifiers).filter(
    ([name, value]) => value !== 0 && getModifierMessageKind(name) !== 'hidden_class'
  );

  return (
    <section className="facsimile-panel space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-[var(--facsimile-ink)]">
          {questState.playerName || 'Stranger'}
        </h2>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">
          Level {characterLevel} Unknown {characterClass}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <img
            src={NPC_AVATAR_URL}
            alt="Character portrait"
            className="h-full w-full min-h-20 rounded-lg border border-[var(--facsimile-panel-border)] object-cover"
          />
        </div>
        <div className="col-span-3">
          <p className="text-xs text-[var(--facsimile-ink-muted)]">
            A cautious ranger from the floodplain roads, known for well-maps and steady hands.
            Travels between town and forest while carrying an unresolved oath to Ravenhall.
          </p>
        </div>
      </div>
      <p className="text-[11px] text-[var(--facsimile-ink-muted)]">
        Shareable profile link:{' '}
        <a
          href={`https://ditto.pub/${userPubkey ?? ''}`}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--facsimile-ink)] underline decoration-[var(--facsimile-panel-border)] underline-offset-2 hover:decoration-[var(--facsimile-ink)]"
        >
          your Ditto public profile
        </a>
      </p>
      <p className="text-center">
        <button
          type="button"
          onClick={onOpenChronicle}
          className="text-[11px] text-[var(--facsimile-ink)] underline decoration-[var(--facsimile-panel-border)] underline-offset-2 hover:decoration-[var(--facsimile-ink)]"
        >
          Open full chronicle (dialogue and world events)
        </button>
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {characterStats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-[var(--facsimile-panel-border)]/50 py-0.5">
            <p className="uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">{label}</p>
            <p className="text-[var(--facsimile-ink)]">{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
        <p>
          <span className="text-[var(--facsimile-ink)]">Skills:</span>{' '}
          {visibleSkillSheetParts.length > 0 ? (
            <span className="text-[var(--facsimile-ink-muted)]">{visibleSkillSheetParts.join(', ')}</span>
          ) : (
            <span className="text-[var(--facsimile-ink-muted)]">&mdash;</span>
          )}
        </p>
        <p>
          <span className="text-[var(--facsimile-ink)]">Quest Items:</span>{' '}
          {questState.questItems.length > 0 ? (
            <span className="text-[var(--facsimile-ink-muted)]">{questState.questItems.join(', ')}</span>
          ) : (
            <span className="text-[var(--facsimile-ink-muted)]">&mdash;</span>
          )}
        </p>
        <p><span className="text-[var(--facsimile-ink)]">Characteristics:</span></p>
        <p><span className="text-[var(--facsimile-ink)]">Relationships:</span></p>
        <p><span className="text-[var(--facsimile-ink)]">Affinities:</span></p>
        <p><span className="text-[var(--facsimile-ink)]">Afflictions:</span></p>
        <p><span className="text-[var(--facsimile-ink)]">Blessings:</span></p>
        <p><span className="text-[var(--facsimile-ink)]">Curses:</span></p>
        {nonZeroModifiers.length > 0 ? (
          <p>
            <span className="text-[var(--facsimile-ink)]">Modifiers:</span>{' '}
            {nonZeroModifiers.map(([name, value]) => `${name} ${value}`).join(', ')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
