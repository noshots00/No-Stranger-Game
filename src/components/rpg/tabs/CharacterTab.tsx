import { SKILL_SHEET_LABEL, SKILL_XP_KEYS } from '../quests/skills-config';
import { getCharacterLevel, getLevelFromXp } from '../quests/engine';
import { getModifierMessageKind, getCharacterClass } from '../helpers';
import { NPC_AVATAR_URL, characterStats } from '../constants';
import type { QuestState } from '../quests/types';
import { nip19 } from 'nostr-tools';

type CharacterTabProps = {
  questState: QuestState;
  userPubkey: string | undefined;
  onOpenChronicle: () => void;
};

export function CharacterTab({ questState, userPubkey, onOpenChronicle }: CharacterTabProps) {
  const characterLevel = getCharacterLevel(questState);
  const characterClass = getCharacterClass(questState.modifiers);
  const profileNpub = userPubkey ? nip19.npubEncode(userPubkey) : null;

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
    <section className="space-y-8 pb-4">
      <div className="space-y-2 text-center">
        <h2 className="font-cormorant text-3xl font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
          {questState.playerName || 'Stranger'}
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--candle-ink-soft)]">
          Level {characterLevel} Unknown {characterClass}
        </p>
      </div>
      <div className="grid grid-cols-[5.5rem_1fr] gap-6 sm:grid-cols-[6.5rem_1fr]">
        <div className="flex justify-center sm:justify-end">
          <img
            src={NPC_AVATAR_URL}
            alt="Character portrait"
            className="h-24 w-24 rounded-full object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-[var(--candle-rule)] sm:h-28 sm:w-28"
          />
        </div>
        <div>
          <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
            A cautious ranger from the floodplain roads, known for well-maps and steady hands. Travels between town
            and forest while carrying an unresolved oath to Ravenhall.
          </p>
        </div>
      </div>
      <p className="font-serif text-sm text-[var(--candle-ink-soft)]">
        Shareable profile link:{' '}
        <a
          href={profileNpub ? `https://ditto.pub/${profileNpub}` : '#'}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!profileNpub}
          className="text-[var(--candle-wax)] underline decoration-[var(--candle-rule)] underline-offset-4 transition-colors hover:decoration-[var(--candle-flame-soft)]"
        >
          your Ditto public profile
        </a>
      </p>
      <p className="text-center">
        <button
          type="button"
          onClick={onOpenChronicle}
          className="choice-line inline-block py-2 text-center text-[var(--candle-wax)]"
        >
          Open full chronicle (dialogue and world events)
        </button>
      </p>
      <div className="space-y-0">
        {characterStats.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-[var(--candle-rule)] py-2.5 font-serif text-sm"
          >
            <p className="uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">{label}</p>
            <p className="font-mono text-[var(--candle-ink)]">{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
        <p>
          <span className="text-[var(--candle-ink)]">Skills:</span>{' '}
          {visibleSkillSheetParts.length > 0 ? visibleSkillSheetParts.join(', ') : '—'}
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Quest items:</span>{' '}
          {questState.questItems.length > 0 ? questState.questItems.join(', ') : '—'}
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Characteristics:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Relationships:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Affinities:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Afflictions:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Blessings:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        <p>
          <span className="text-[var(--candle-ink)]">Curses:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
        </p>
        {nonZeroModifiers.length > 0 ? (
          <p>
            <span className="text-[var(--candle-ink)]">Modifiers:</span>{' '}
            {nonZeroModifiers.map(([name, value]) => `${name} ${value}`).join(', ')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
