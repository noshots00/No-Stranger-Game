import { useEffect, useState } from 'react';
import { nip19 } from 'nostr-tools';
import { useNostr } from '@nostrify/react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PRESENCE_RELAYS, useNetworkPresence } from '@/hooks/useNetworkPresence';
import { useToast } from '@/hooks/useToast';
import { useEchoes } from '@/hooks/useEchoes';
import { useScryingPool } from '@/hooks/useScryingPool';
import { useHomeland } from '@/hooks/useHomeland';
import { useStrangersLedger } from '@/hooks/useStrangersLedger';
import { useConvergence } from '@/hooks/useConvergence';
import { useProofChain } from '@/hooks/useProofChain';
import { useRelayRegions } from '@/hooks/useRelayRegions';
import { useDeadLetterOffice } from '@/hooks/useDeadLetterOffice';
import { useEchoChamber } from '@/hooks/useEchoChamber';
import { useForgetting } from '@/hooks/useForgetting';
import { trackTelemetry } from '@/lib/rpg/telemetry';
import {
  CHAPTER_PROOF_KIND,
  getChapterWindowId,
  hasCanonicalChoiceForWindow,
  markCanonicalChoiceForWindow,
  resolveCanonicalChoiceFromEvents,
} from '@/lib/rpg/proof';
import {
  clearMVPCharacter,
  computeQuestBunchIdentity,
  loadMVPCharacter,
  saveMVPCharacter,
  type MVPCharacter,
  type NetworkPresenceMember,
  type QuestBunchAnswer,
} from '@/lib/rpg/utils';
import { DEFAULT_TIER3_POLICY, loadTier3Policy, saveTier3Policy, type Tier3PolicySettings } from '@/lib/rpg/policy';
import { ChronicleView } from './ChronicleView';
import { ChapterView } from './ChapterView';
import { TerritoryView } from './TerritoryView';
import { SelfView } from './SelfView';
import { DeadLetterOverlay } from './DeadLetterOverlay';
import { EchoChamberOverlay } from './EchoChamberOverlay';
import { Guttering } from './Guttering';

type ActiveView = 'chronicle' | 'chapter' | 'territory' | 'self';

export function RPGInterface() {
  const { user, metadata } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home'>('creation');
  const [activeView, setActiveView] = useState<ActiveView>('chronicle');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [selectedNetworkMember, setSelectedNetworkMember] = useState<NetworkPresenceMember | null>(null);
  const [chapterOpened, setChapterOpened] = useState(false);
  const [tier3Policy, setTier3Policy] = useState<Tier3PolicySettings>(DEFAULT_TIER3_POLICY);
  const [deadLetterOpen, setDeadLetterOpen] = useState(false);
  const [echoChamberOpen, setEchoChamberOpen] = useState(false);

  const networkPresence = useNetworkPresence(user?.pubkey);
  const echoes = useEchoes(user?.pubkey);
  const homeland = useHomeland(metadata?.nip05);
  const ledger = useStrangersLedger();
  const proofChain = useProofChain(user?.pubkey);
  const relayRegions = useRelayRegions();
  const deadLetter = useDeadLetterOffice();
  const echoChamber = useEchoChamber();
  const forgetting = useForgetting();

  useEffect(() => {
    const existing = loadMVPCharacter();
    if (existing) {
      setCharacter(existing);
      setScreen('home');
      return;
    }
    setScreen('creation');
  }, []);

  useEffect(() => {
    setTier3Policy(loadTier3Policy());
  }, []);

  useEffect(() => {
    if (!user?.pubkey) return;
    const chapterWindowId = getChapterWindowId();
    nostr.query(
      [{ kinds: [CHAPTER_PROOF_KIND], authors: [user.pubkey], '#window': [chapterWindowId], limit: 20 }],
      { signal: AbortSignal.timeout(5000) },
    ).then((events) => {
      const canonical = resolveCanonicalChoiceFromEvents(events, chapterWindowId, user.pubkey);
      if (canonical) trackTelemetry('proof_chain_loaded', { canonicalId: canonical.id });
    }).catch(() => {});
  }, [nostr, user?.pubkey]);

  const activeQuestId = 'market-money-001';
  const questBunchSteps: Array<{ questionId: string; title: string; prompt: string; options: Array<{ option: 'A' | 'B' | 'C'; label: string }> }> = [
    { questionId: `${activeQuestId}-q1`, title: 'Quest 1/10 - Waking', prompt: 'You open your eyes to moss and half-light. What color was your mother\'s hair?', options: [{ option: 'A', label: 'Copper-red and bright like embers' }, { option: 'B', label: 'Black as wet stone' }, { option: 'C', label: 'Silver like moonlit frost' }] },
    { questionId: `${activeQuestId}-q2`, title: 'Quest 2/10 - The Village', prompt: 'A woman offers you bread. What do you notice first about her face?', options: [{ option: 'A', label: 'A scar she does not hide' }, { option: 'B', label: 'Eyes that weigh every word' }, { option: 'C', label: 'A smile that feels borrowed' }] },
    { questionId: `${activeQuestId}-q3`, title: 'Quest 3/10 - A Family Finds You', prompt: 'The carpenter asks you to stay. If it were your choice, would you?', options: [{ option: 'A', label: 'Stay, and share their table' }, { option: 'B', label: 'Stay only until dawn' }, { option: 'C', label: 'Refuse and sleep outside' }] },
    { questionId: `${activeQuestId}-q4`, title: 'Quest 4/10 - A Simple Trade', prompt: 'Which craft feels least like a lie?', options: [{ option: 'A', label: 'Woodcutting and grainwork' }, { option: 'B', label: 'Mining and masonry' }, { option: 'C', label: 'Forging and hidden trade' }] },
    { questionId: `${activeQuestId}-q5`, title: 'Quest 5/10 - Slow Work of Days', prompt: 'If you could know one thing about your old life, what would it be?', options: [{ option: 'A', label: 'Who I once protected' }, { option: 'B', label: 'Who I betrayed' }, { option: 'C', label: 'What I stole from fate' }] },
    { questionId: `${activeQuestId}-q6`, title: 'Quest 6/10 - A Stranger\'s Fortune', prompt: 'The crone asks what you fear you left behind.', options: [{ option: 'A', label: 'A promise I could not keep' }, { option: 'B', label: 'A debt with my name on it' }, { option: 'C', label: 'A door that should stay closed' }] },
    { questionId: `${activeQuestId}-q7`, title: 'Quest 7/10 - The Night Before', prompt: 'What is the last thing you would save?', options: [{ option: 'A', label: 'A person' }, { option: 'B', label: 'A tool' }, { option: 'C', label: 'A secret' }] },
    { questionId: `${activeQuestId}-q8`, title: 'Quest 8/10 - The Fire', prompt: 'The cottage burns. You have time for one.', options: [{ option: 'A', label: 'Carry the carpenter' }, { option: 'B', label: 'Carry his wife' }, { option: 'C', label: 'Carry the daughter' }] },
    { questionId: `${activeQuestId}-q9`, title: 'Quest 9/10 - The Road', prompt: 'At the fork, which road feels most like regret avoided?', options: [{ option: 'A', label: 'North to old libraries' }, { option: 'B', label: 'East to the coast' }, { option: 'C', label: 'West toward the dream-door' }] },
    { questionId: `${activeQuestId}-q10`, title: 'Quest 10/10 - The First Night', prompt: 'The stone is warm in your pocket. What do you whisper before sleep?', options: [{ option: 'A', label: '“Let me become someone worthy.”' }, { option: 'B', label: '“Let me survive what comes.”' }, { option: 'C', label: '“Let me remember everything.”' }] },
  ];

  const pendingBunch = character?.pendingQuestBunch?.questId === activeQuestId ? character.pendingQuestBunch : { questId: activeQuestId, answers: [] as QuestBunchAnswer[] };
  const answeredQuestionIds = new Set(pendingBunch.answers.map((answer) => answer.questionId));
  const currentQuestStep = questBunchSteps.find((step) => !answeredQuestionIds.has(step.questionId));
  const hasChosenMarketQuest = character?.mainQuestChoices.some((choice) => choice.questId === activeQuestId) ?? false;
  const marketChoice = character?.mainQuestChoices.find((choice) => choice.questId === activeQuestId);
  const chapterLines = ['The village burns.', 'Smoke rolls across the market square.', 'A purse slips from a stranger\'s hand and lands near your feet.'];
  const hasUnreadChapter = !hasChosenMarketQuest;
  const myClassLabel = character?.className || marketChoice?.option;
  const convergence = useConvergence(myClassLabel, networkPresence.data?.topMembers);
  const scryingPool = useScryingPool(character?.discoveredLocations ?? [], networkPresence.data?.topMembers);

  const updateTier3Policy = (nextPolicy: Tier3PolicySettings) => {
    setTier3Policy(nextPolicy);
    saveTier3Policy(nextPolicy);
    trackTelemetry('tier3_policy_updated', { experimentalEnabled: nextPolicy.experimentalEnabled, visibility: nextPolicy.visibility });
  };

  const handleNewGame = () => {
    clearMVPCharacter();
    setCharacter(null);
    setScreen('creation');
    setActiveView('chronicle');
    setChapterOpened(false);
  };

  const handleCreateStranger = () => {
    const normalizedCharacterName = characterNameInput.trim() || 'Nameless Stranger';
    const npub = user ? nip19.npubEncode(user.pubkey) : undefined;
    const newCharacter: MVPCharacter = {
      id: user?.pubkey ?? `temp-${Date.now()}`,
      createdAt: Date.now(),
      level: 1,
      role: 'stranger',
      characterName: normalizedCharacterName,
      gender: 'Unknown',
      race: 'Human',
      profession: 'Farmer',
      startingCity: 'Dawnharbor',
      className: 'Wanderer',
      mainQuestChoices: [],
      discoveredLocations: ['market-square'],
      pubkey: user?.pubkey,
      npub,
    };
    saveMVPCharacter(newCharacter);
    setCharacter(newCharacter);
    setScreen('home');
    setActiveView('chronicle');

    if (user) {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);
      user.signer.signEvent({
        kind: 30000,
        content: JSON.stringify({
          app: 'no-stranger-game',
          level: 1,
          role: 'stranger',
          characterName: normalizedCharacterName,
          classLabel: 'Unchosen',
          discoveredLocations: ['market-square'],
          createdAt: newCharacter.createdAt,
        }),
        tags: [['d', 'opt-in'], ['t', 'no-stranger-game'], ['alt', 'No Stranger Game player presence opt-in']],
        created_at: Math.floor(Date.now() / 1000),
      }).then((signedEvent) => {
        presenceNostr.event(signedEvent).then(() => networkPresence.refetch()).catch(() => {});
      }).catch(() => {});
    }
  };

  const handleMainQuestChoice = (questionId: string, option: 'A' | 'B' | 'C') => {
    if (!character) return;
    const pendingAnswers = [...pendingBunch.answers.filter((answer) => answer.questionId !== questionId), { questionId, option }];
    const withPending: MVPCharacter = { ...character, pendingQuestBunch: { questId: activeQuestId, answers: pendingAnswers } };
    saveMVPCharacter(withPending);
    setCharacter(withPending);
    if (pendingAnswers.length < questBunchSteps.length) return;

    const chapterWindowId = getChapterWindowId();
    const identityKey = `${character.id}:${character.createdAt}`;
    if (hasCanonicalChoiceForWindow(chapterWindowId, identityKey)) {
      const withClearedPending: MVPCharacter = { ...character, pendingQuestBunch: undefined };
      saveMVPCharacter(withClearedPending);
      setCharacter(withClearedPending);
      return;
    }

    const finalChoice = pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q10`)?.option ?? option;
    const aCount = pendingAnswers.filter((answer) => answer.option === 'A').length;
    const bCount = pendingAnswers.filter((answer) => answer.option === 'B').length;
    const cCount = pendingAnswers.filter((answer) => answer.option === 'C').length;
    const identity = computeQuestBunchIdentity(pendingAnswers, `${character.id}:${chapterWindowId}:${pendingAnswers.map((answer) => `${answer.questionId}:${answer.option}`).join('|')}`);
    const consequenceByArc = finalChoice === 'A'
      ? `You choose duty at the edge of dawn. Your road carries ${aCount} vows and ${cCount} shadows. Fate marks you as ${identity.race}, ${identity.profession}, ${identity.className}.`
      : finalChoice === 'B'
        ? `You choose endurance over glory. Your road carries ${bCount} hard bargains and ${aCount} mercies. Fate marks you as ${identity.race}, ${identity.profession}, ${identity.className}.`
        : `You choose memory over comfort. Your road carries ${cCount} secrets and ${bCount} burdens. Fate marks you as ${identity.race}, ${identity.profession}, ${identity.className}.`;

    const updatedCharacter: MVPCharacter = {
      ...character,
      mainQuestChoices: [...character.mainQuestChoices, { questId: activeQuestId, prompt: 'Quest bunch: Chapter One arc completed.', option: finalChoice, consequence: consequenceByArc, chosenAt: Math.floor(Date.now() / 1000) }],
      level: character.level + 1,
      race: identity.race,
      profession: identity.profession,
      className: identity.className,
      discoveredLocations: Array.from(new Set([...(character.discoveredLocations ?? ['market-square']), (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'A' ? 'old-library' : (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'B' ? 'coin-vault' : 'silent-alley'])),
      chapterWindowIds: Array.from(new Set([...(character.chapterWindowIds ?? []), chapterWindowId])),
      pendingQuestBunch: undefined,
    };
    saveMVPCharacter(updatedCharacter);
    setCharacter(updatedCharacter);
    markCanonicalChoiceForWindow(chapterWindowId, identityKey, `${chapterWindowId}:${option}`);
    setActiveView('chronicle');
    setChapterOpened(false);

    if (user) {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);
      const questBunchId = `${activeQuestId}:${chapterWindowId}:${pendingAnswers.length}`;
      user.signer.signEvent({
        kind: 30000,
        content: JSON.stringify({
          app: 'no-stranger-game',
          level: updatedCharacter.level,
          role: 'stranger',
          characterName: updatedCharacter.characterName,
          classLabel: updatedCharacter.className,
          race: updatedCharacter.race,
          profession: updatedCharacter.profession,
          startingCity: updatedCharacter.startingCity,
          questBunchId,
          questAnswers: pendingAnswers,
          discoveredLocations: updatedCharacter.discoveredLocations ?? [],
          createdAt: updatedCharacter.createdAt,
        }),
        tags: [['d', 'opt-in'], ['t', 'no-stranger-game'], ['alt', 'No Stranger Game player presence opt-in']],
        created_at: Math.floor(Date.now() / 1000),
      }).then((signedEvent) => presenceNostr.event(signedEvent).catch(() => {})).catch(() => {});
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--void)' }}>
        <h1 className="font-cormorant text-5xl md:text-6xl font-light tracking-wide emerge" style={{ color: 'var(--ink)' }}>
          No Stranger Game
        </h1>
        <p className="mt-6 text-sm tracking-[0.25em] uppercase emerge emerge-delay-2" style={{ color: 'var(--ink-ghost)' }}>
          An RPG that lives inside your social network
        </p>
        <div className="mt-16 w-full max-w-xs emerge emerge-delay-4">
          <LoginArea className="w-full flex flex-col gap-3" />
        </div>
        <div className="mt-12 h-2 w-2 rounded-full smolder" style={{ background: 'var(--ember)' }} />
      </div>
    );
  }

  if (screen === 'creation') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--void)' }}>
        <p className="text-sm tracking-[0.25em] uppercase emerge" style={{ color: 'var(--ink-ghost)' }}>
          Season III
        </p>
        <h2 className="mt-12 font-cormorant text-3xl font-light emerge emerge-delay-1" style={{ color: 'var(--ink)' }}>
          What name will you carry?
        </h2>
        <div className="mt-10 w-full max-w-sm emerge emerge-delay-2">
          <input
            type="text"
            placeholder="Name your stranger"
            className="w-full bg-transparent border-0 border-b text-center font-cormorant text-2xl font-light tracking-wide focus:outline-none focus:ring-0"
            style={{ color: 'var(--ink)', borderColor: 'var(--ink-ghost)' }}
            value={characterNameInput}
            onChange={(event) => setCharacterNameInput(event.target.value)}
            autoFocus
          />
        </div>
        <p className="mt-8 text-xs emerge emerge-delay-3" style={{ color: 'var(--ink-ghost)' }}>
          Begin as a stranger. Discover who you are through your choices.
        </p>
        <button type="button" onClick={handleCreateStranger} className="mt-10 font-cormorant text-lg tracking-wide transition-all duration-500 hover:tracking-wider emerge emerge-delay-4" style={{ color: 'var(--ember)' }}>
          Step through →
        </button>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--void)' }}>
      <Guttering />
      <header className="flex items-center justify-between px-2 pt-6 pb-4">
        <div className="h-1.5 w-1.5 rounded-full smolder" style={{ background: 'var(--ember)' }} />
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-ghost)' }}>
          Season III
        </span>
        <div className="w-1.5" />
      </header>

      {activeView === 'chronicle' ? (
        <ChronicleView
          latestConsequence={character.mainQuestChoices[character.mainQuestChoices.length - 1]?.consequence}
          hasUnreadChapter={hasUnreadChapter}
          onOpenChapter={() => setActiveView('chapter')}
          echoes={echoes.data}
          homelandLine={homeland.homelandFlavorLine}
          ledger={ledger.data}
          totalWorldOptedIn={networkPresence.data?.totalWorldOptedIn}
          convergenceMatches={convergence.matches}
          topMembers={networkPresence.data?.topMembers ?? []}
          selectedNetworkMember={selectedNetworkMember}
          onSelectNetworkMember={setSelectedNetworkMember}
          glimmers={scryingPool.glimmers}
          onOpenEchoChamber={() => setEchoChamberOpen(true)}
          echoChamberEnabled={tier3Policy.echoChamberEnabled && !tier3Policy.killSwitchEnabled && Boolean(selectedNetworkMember)}
        />
      ) : null}

      {activeView === 'chapter' ? (
        <ChapterView
          chapterOpened={chapterOpened}
          onOpenChapter={() => setChapterOpened(true)}
          hasChosenMarketQuest={hasChosenMarketQuest}
          chapterLines={chapterLines}
          mainQuestFlavorLine={echoes.data?.mainQuestFlavorLine}
          marketConsequence={marketChoice?.consequence}
          marketOption={marketChoice?.option}
          currentQuestStep={currentQuestStep}
          pendingBunch={pendingBunch}
          questBunchStepsLength={questBunchSteps.length}
          onChoose={handleMainQuestChoice}
          deadLetterEnabled={tier3Policy.deadLetterEnabled && !tier3Policy.killSwitchEnabled}
          onOpenDeadLetter={() => setDeadLetterOpen(true)}
        />
      ) : null}

      {activeView === 'territory' ? (
        <TerritoryView discoveredLocations={character.discoveredLocations ?? []} glimmerLocationIds={scryingPool.glimmers.map((g) => g.locationId)} />
      ) : null}

      {activeView === 'self' ? (
        <SelfView
          character={character}
          proofNodes={proofChain.data ?? []}
          relayRegions={relayRegions}
          tier3Policy={tier3Policy}
          onUpdatePolicy={updateTier3Policy}
          onNewGame={handleNewGame}
          onForgetProof={(eventId) => {
            if (!tier3Policy.forgettingEnabled || tier3Policy.killSwitchEnabled) return;
            forgetting.mutate(eventId);
          }}
        />
      ) : null}

      <DeadLetterOverlay
        isOpen={deadLetterOpen}
        onClose={() => setDeadLetterOpen(false)}
        isPending={deadLetter.isPending}
        onSeal={(payload) => {
          deadLetter.mutate(payload, { onSuccess: () => setDeadLetterOpen(false) });
        }}
      />
      <EchoChamberOverlay
        isOpen={echoChamberOpen}
        targetName={selectedNetworkMember?.characterName ?? 'stranger'}
        onClose={() => setEchoChamberOpen(false)}
        isPending={echoChamber.isPending}
        onSend={(payload) => {
          if (!selectedNetworkMember) return;
          echoChamber.mutate({ targetPubkey: selectedNetworkMember.pubkey, ...payload }, { onSuccess: () => setEchoChamberOpen(false) });
        }}
      />

      <nav className="fixed inset-x-0 bottom-0 z-40" style={{ background: 'linear-gradient(to top, var(--void), transparent)' }}>
        <div className="mx-auto flex max-w-sm items-center justify-around px-6 py-3">
          {[
            { key: 'chronicle', icon: '⊙', label: 'Chronicle' },
            { key: 'chapter', icon: '✦', label: 'Chapter' },
            { key: 'territory', icon: '◈', label: 'Territory' },
            { key: 'self', icon: '◉', label: 'Self' },
          ].map((item) => {
            const isActive = activeView === item.key;
            const hasNotification = item.key === 'chapter' && hasUnreadChapter;
            return (
              <button key={item.key} type="button" onClick={() => setActiveView(item.key as ActiveView)} className="relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-300" aria-label={item.label}>
                <span className={`text-lg transition-all duration-300 ${hasNotification ? 'smolder' : ''}`} style={{ color: isActive ? 'var(--ember)' : 'var(--ink-ghost)' }}>
                  {item.icon}
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase transition-opacity" style={{ color: isActive ? 'var(--ink-dim)' : 'transparent' }}>
                  {item.label}
                </span>
                {isActive ? <div className="absolute -bottom-0 h-0.5 w-4 rounded-full" style={{ background: 'var(--ember)' }} /> : null}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
