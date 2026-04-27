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
import { useAutonomousState } from '@/hooks/useAutonomousState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  isCharacterLikelyStuck,
  type MVPCharacter,
  type NetworkPresenceMember,
  type QuestBunchAnswer,
} from '@/lib/rpg/utils';
import { DEFAULT_TIER3_POLICY, loadTier3Policy, saveTier3Policy, type Tier3PolicySettings } from '@/lib/rpg/policy';
import { getActiveChapter } from '@/lib/rpg/chapterCatalog';
import { AUTONOMOUS_SNAPSHOT_KIND } from '@/lib/rpg/autonomousSimulation';
import { ChronicleView } from './ChronicleView';
import { ChapterView } from './ChapterView';
import { TerritoryView } from './TerritoryView';
import { SelfView } from './SelfView';
import { DeadLetterOverlay } from './DeadLetterOverlay';
import { EchoChamberOverlay } from './EchoChamberOverlay';
import { Guttering } from './Guttering';
import { WorldWelcome } from './WorldWelcome';

type ActiveView = 'play' | 'chapter' | 'map' | 'profile';

export function RPGInterface() {
  const { user, metadata } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home'>('creation');
  const [activeView, setActiveView] = useState<ActiveView>('play');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [selectedNetworkMember, setSelectedNetworkMember] = useState<NetworkPresenceMember | null>(null);
  const [chapterOpened, setChapterOpened] = useState(false);
  const [revealPhase, setRevealPhase] = useState<'idle' | 'revealing'>('idle');
  const [revealIdentity, setRevealIdentity] = useState<{ consequence: string; race: string; profession: string; className: string } | null>(null);
  const [tier3Policy, setTier3Policy] = useState<Tier3PolicySettings>(DEFAULT_TIER3_POLICY);
  const [deadLetterOpen, setDeadLetterOpen] = useState(false);
  const [echoChamberOpen, setEchoChamberOpen] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [showWorldWelcome, setShowWorldWelcome] = useState(false);
  const [showStuckRecovery, setShowStuckRecovery] = useState(false);

  const networkPresence = useNetworkPresence(user?.pubkey);
  const echoes = useEchoes(user?.pubkey);
  const homeland = useHomeland(metadata?.nip05);
  const ledger = useStrangersLedger();
  const proofChain = useProofChain(user?.pubkey);
  const relayRegions = useRelayRegions();
  const deadLetter = useDeadLetterOffice();
  const echoChamber = useEchoChamber();
  const forgetting = useForgetting();
  const autonomous = useAutonomousState(character, user?.pubkey);

  useEffect(() => {
    const existing = loadMVPCharacter();
    if (existing) {
      if (isCharacterLikelyStuck(existing)) {
        setShowStuckRecovery(true);
      }
      setCharacter(existing);
      setScreen('home');
      return;
    }
    setScreen('creation');
  }, []);

  const repairCharacter = () => {
    if (!character) return;
    const repaired: MVPCharacter = {
      ...character,
      level: 1,
      className: character.className || 'Wanderer',
      profession: character.profession || 'Woodcutter',
      pendingQuestBunch: undefined,
      completedChapterIds: Array.isArray(character.completedChapterIds) ? character.completedChapterIds : [],
      mainQuestChoices: Array.isArray(character.mainQuestChoices) ? character.mainQuestChoices : [],
      hasCompletedFirstChapter: Boolean(character.hasCompletedFirstChapter),
    };
    saveMVPCharacter(repaired);
    setCharacter(repaired);
    setShowStuckRecovery(false);
  };

  useEffect(() => {
    setTier3Policy(loadTier3Policy());
  }, []);

  useEffect(() => {
    if (!character?.hasCompletedFirstChapter) return;
    if (localStorage.getItem('nsg:welcomed') === 'true') return;
    setShowWorldWelcome(true);
  }, [character?.hasCompletedFirstChapter]);

  useEffect(() => {
    if (!user?.pubkey) return;
    const chapterWindowId = getChapterWindowId();
    nostr.query(
      [{ kinds: [CHAPTER_PROOF_KIND], authors: [user.pubkey], '#window': [chapterWindowId], limit: 20 }],
      { signal: AbortSignal.timeout(5000) },
    ).then((events) => {
      const canonical = resolveCanonicalChoiceFromEvents(events, chapterWindowId, user.pubkey);
      if (canonical) trackTelemetry('proof_chain_loaded', { canonicalId: canonical.id });
    }).catch(() => noteSyncFailure());
  }, [nostr, user?.pubkey]);

  useEffect(() => {
    if (!character || !autonomous.state || !autonomous.relayLoaded) return;
    if (character.lastSimulatedTick === autonomous.state.lastSimulatedTick) return;
    const mergedCharacter: MVPCharacter = {
      ...character,
      gold: autonomous.state.gold,
      health: autonomous.state.health,
      locationId: autonomous.state.locationId,
      visibleTraits: autonomous.state.visibleTraits,
      hiddenTraits: autonomous.state.hiddenTraits,
      injuries: autonomous.state.injuries,
      dailyLogs: autonomous.state.dailyLogs,
      lastSimulatedTick: autonomous.state.lastSimulatedTick,
      exploreIntent: autonomous.state.exploreIntent,
      profession: autonomous.state.professionLabel || character.profession,
    };
    saveMVPCharacter(mergedCharacter);
    setCharacter(mergedCharacter);

    if (!user || !autonomous.state.lastSimulatedTick) return;
    user.signer.signEvent({
      kind: AUTONOMOUS_SNAPSHOT_KIND,
      content: JSON.stringify(autonomous.state),
      tags: [
        ['t', 'no-stranger-game'],
        ['character', character.id],
        ['window', autonomous.state.lastSimulatedTick],
        ['alt', 'No Stranger Game autonomous daily snapshot'],
      ],
      created_at: Math.floor(Date.now() / 1000),
    }).then((event) => {
      nostr.group([...PRESENCE_RELAYS]).event(event).catch(() => noteSyncFailure());
    }).catch(() => noteSyncFailure());
  }, [autonomous.relayLoaded, autonomous.state, character, nostr, user]);

  useEffect(() => {
    if (!character) return;
    autonomous.runTick().catch(() => {});
  }, [character?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!character) return;
    const interval = setInterval(() => {
      autonomous.runTick().catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [character?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChapter = getActiveChapter(character?.completedChapterIds ?? []);
  const activeQuestId = activeChapter.id;
  const questBunchSteps = activeChapter.questBunch;

  const pendingBunch = character?.pendingQuestBunch?.questId === activeQuestId ? character.pendingQuestBunch : { questId: activeQuestId, answers: [] as QuestBunchAnswer[] };
  const answeredQuestionIds = new Set(pendingBunch.answers.map((answer) => answer.questionId));
  const currentQuestStep = questBunchSteps.find((step) => !answeredQuestionIds.has(step.questionId));
  const hasChosenActiveChapter = character?.mainQuestChoices.some((choice) => choice.questId === activeQuestId) ?? false;
  const activeChapterChoice = character?.mainQuestChoices.find((choice) => choice.questId === activeQuestId);
  const chapterLines = activeChapter.chapterLines;
  const hasUnreadChapter = !hasChosenActiveChapter;
  const myClassLabel = character?.className || activeChapterChoice?.option;
  const convergence = useConvergence(myClassLabel, networkPresence.data?.topMembers);
  const scryingPool = useScryingPool(character?.discoveredLocations ?? [], networkPresence.data?.topMembers);

  const updateTier3Policy = (nextPolicy: Tier3PolicySettings) => {
    setTier3Policy(nextPolicy);
    saveTier3Policy(nextPolicy);
    trackTelemetry('tier3_policy_updated', { experimentalEnabled: nextPolicy.experimentalEnabled, visibility: nextPolicy.visibility });
  };

  const noteSyncFailure = () => {
    setSyncFailed(true);
    setTimeout(() => setSyncFailed(false), 10000);
  };

  const handleNewGame = () => {
    clearMVPCharacter();
    setCharacter(null);
    setScreen('creation');
    setActiveView('play');
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
      race: 'Unspoken',
      profession: 'Woodcutter',
      startingCity: 'Dawnharbor',
      className: 'Wanderer',
      profileTitle: 'Unnamed Drifter',
      profileBio: '',
      mainQuestChoices: [],
      completedChapterIds: [],
      discoveredLocations: ['market-square'],
      pubkey: user?.pubkey,
      npub,
    };
    saveMVPCharacter(newCharacter);
    setCharacter(newCharacter);
    setScreen('home');
    setActiveView('chapter');
    setChapterOpened(false);
    setRevealPhase('idle');
    setRevealIdentity(null);

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
        presenceNostr.event(signedEvent).then(() => networkPresence.refetch()).catch(() => noteSyncFailure());
      }).catch(() => noteSyncFailure());
    }
  };

  const handleMainQuestChoice = (questionId: string, option: string) => {
    navigator.vibrate?.(15);
    if (!character) return;
    const pendingAnswers = [...pendingBunch.answers.filter((answer) => answer.questionId !== questionId), { questionId, option }];
    const withPending: MVPCharacter = { ...character, pendingQuestBunch: { questId: activeQuestId, answers: pendingAnswers } };
    saveMVPCharacter(withPending);
    setCharacter(withPending);
    if (pendingAnswers.length < questBunchSteps.length) return;

    const chapterWindowId = getChapterWindowId();
    const identityKey = `${character.id}:${character.createdAt}:${activeQuestId}`;
    if (hasCanonicalChoiceForWindow(chapterWindowId, identityKey)) {
      const withClearedPending: MVPCharacter = { ...character, pendingQuestBunch: undefined };
      saveMVPCharacter(withClearedPending);
      setCharacter(withClearedPending);
      return;
    }

    const finalStepQuestionId = questBunchSteps[questBunchSteps.length - 1]?.questionId;
    const finalChoice = pendingAnswers.find((a) => a.questionId === finalStepQuestionId)?.option ?? option;
    const aCount = pendingAnswers.filter((answer) => answer.option === 'A').length;
    const bCount = pendingAnswers.filter((answer) => answer.option === 'B').length;
    const cCount = pendingAnswers.filter((answer) => answer.option === 'C').length;
    const dCount = pendingAnswers.filter((answer) => answer.option === 'D').length;
    const eCount = pendingAnswers.filter((answer) => answer.option === 'E').length;
    const identity = computeQuestBunchIdentity(pendingAnswers, `${character.id}:${chapterWindowId}:${pendingAnswers.map((answer) => `${answer.questionId}:${answer.option}`).join('|')}`);
    const basicArchetype = finalChoice === 'A' ? 'Shieldbearer' : finalChoice === 'B' ? 'Magician' : finalChoice === 'C' ? 'Thief' : finalChoice === 'D' ? 'Soldier' : 'Wanderer';
    const basicProfession = finalChoice === 'A' ? 'Woodcutter' : finalChoice === 'B' ? 'Miner' : finalChoice === 'C' ? 'Hunter' : finalChoice === 'D' ? 'Tanner' : 'Beggar';
    const isChapterOne = activeQuestId === 'market-money-001';
    const consequenceByArc = finalChoice === 'A'
      ? `You choose duty at the edge of dawn. Your road carries ${aCount} vows and ${cCount} shadows. ${identity.hook}`
      : finalChoice === 'B'
        ? `You choose endurance over glory. Your road carries ${bCount} hard bargains and ${aCount} mercies. ${identity.hook}`
        : finalChoice === 'C'
          ? `You choose memory over comfort. Your road carries ${cCount} secrets and ${bCount} burdens. ${identity.hook}`
          : finalChoice === 'D'
            ? `You choose risk without witness. Your road carries ${dCount} dangerous turns and ${eCount} quiet debts. ${identity.hook}`
            : `You choose silence and resolve. Your road carries ${eCount} buried vows and ${dCount} unanswered names. ${identity.hook}`;

    const updatedCharacter: MVPCharacter = {
      ...character,
      mainQuestChoices: [...character.mainQuestChoices, { questId: activeQuestId, prompt: 'Quest bunch: Chapter One arc completed.', option: finalChoice, consequence: consequenceByArc, chosenAt: Math.floor(Date.now() / 1000) }],
      level: isChapterOne ? 1 : character.level + 1,
      race: isChapterOne ? 'Unspoken' : identity.race,
      profession: isChapterOne ? basicProfession : identity.profession,
      className: isChapterOne ? basicArchetype : identity.className,
      discoveredLocations: Array.from(new Set([...(character.discoveredLocations ?? ['market-square']), (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'A' ? 'old-library' : (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'B' ? 'coin-vault' : 'silent-alley'])),
      chapterWindowIds: Array.from(new Set([...(character.chapterWindowIds ?? []), chapterWindowId])),
      completedChapterIds: Array.from(new Set([...(character.completedChapterIds ?? []), activeQuestId])),
      pendingQuestBunch: undefined,
      hasCompletedFirstChapter: true,
    };
    const now = Math.floor(Date.now() / 1000);
    saveMVPCharacter(updatedCharacter);
    setCharacter(updatedCharacter);
    markCanonicalChoiceForWindow(chapterWindowId, identityKey, `${chapterWindowId}:${finalChoice}`);
    setRevealIdentity({
      consequence: consequenceByArc,
      race: isChapterOne ? 'Unspoken' : identity.race,
      profession: isChapterOne ? basicProfession : identity.profession,
      className: isChapterOne ? basicArchetype : identity.className,
    });
    setRevealPhase('revealing');
    setChapterOpened(true);

    if (user) {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);
      const questBunchId = `${activeQuestId}:${chapterWindowId}:${pendingAnswers.length}`;
      const prevProofHead = character.chapterProofHead ?? 'genesis';
      const proofPayload = {
        app: 'no-stranger-game',
        chapterId: activeQuestId,
        chapterWindowId,
        selectedOption: finalChoice,
        prompt: 'Quest bunch: Chapter One arc completed.',
        consequence: consequenceByArc,
        characterId: character.id,
        recordedAt: now,
      };
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
        created_at: now,
      }).then((signedEvent) => presenceNostr.event(signedEvent).catch(() => noteSyncFailure())).catch(() => noteSyncFailure());

      user.signer.signEvent({
        kind: CHAPTER_PROOF_KIND,
        content: JSON.stringify(proofPayload),
        tags: [
          ['chapter', activeQuestId],
          ['window', chapterWindowId],
          ['choice', finalChoice],
          ['prev', prevProofHead],
          ['t', 'no-stranger-game'],
          ['alt', 'No Stranger Game chapter choice proof'],
        ],
        created_at: now,
      }).then((signedProofEvent) => {
        presenceNostr.event(signedProofEvent).catch(() => noteSyncFailure());
        const withHead: MVPCharacter = { ...updatedCharacter, chapterProofHead: signedProofEvent.id };
        saveMVPCharacter(withHead);
        setCharacter(withHead);
      }).catch(() => noteSyncFailure());
    }

    setTimeout(() => {
      setRevealPhase('idle');
      setActiveView('play');
      setChapterOpened(false);
    }, 12000);
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
        <div className="mt-8 space-y-4 max-w-xs text-center">
          <p className="font-cormorant text-sm italic emerge emerge-delay-2" style={{ color: 'var(--ink-ghost)' }}>
            Every day, a letter arrives.
          </p>
          <p className="font-cormorant text-sm italic emerge emerge-delay-3" style={{ color: 'var(--ink-ghost)' }}>
            Every choice closes a door.
          </p>
          <p className="font-cormorant text-sm italic emerge emerge-delay-4" style={{ color: 'var(--ink-ghost)' }}>
            No one else could be here.
          </p>
        </div>
        <div className="mt-12 w-full max-w-xs emerge emerge-delay-5 game-login">
          <LoginArea className="w-full flex flex-col gap-3" />
        </div>
        <details className="mt-8 max-w-xs text-center emerge emerge-delay-5">
          <summary className="text-xs cursor-pointer" style={{ color: 'var(--ink-ghost)' }}>
            New to Nostr? Start here.
          </summary>
          <div className="mt-3 space-y-2 text-xs" style={{ color: 'var(--ink-ghost)' }}>
            <p>Nostr is a protocol for sovereign identity. Your account belongs to you - not a company.</p>
            <p>
              <strong>On mobile:</strong> create an account with{' '}
              <a href="https://primal.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--ember-dim)' }}>Primal</a>
              {' '}then sign in here.
            </p>
            <p>
              <strong>On desktop:</strong> install{' '}
              <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--ember-dim)' }}>Alby</a>
              {' '}or{' '}
              <a href="https://nos2x.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--ember-dim)' }}>nos2x</a>.
            </p>
          </div>
        </details>
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

  const estDayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(Date.now());
  const activeLocationLabel = autonomous.state?.locationId?.replaceAll('_', ' ') ?? 'market square';
  const publicSnippet = `${character.characterName}, Level ${character.level} ${character.className}, in ${activeLocationLabel}`;
  const rateXp = Math.max(1, Math.floor((autonomous.state?.visibleTraits.length ?? 1) * 0.4));
  const rateGold = Math.max(1, Math.floor((autonomous.state?.gold ?? 0) / Math.max(1, character.level)));
  const hasActiveMainQuest = hasUnreadChapter;
  const socialAccomplishments = (networkPresence.data?.topMembers ?? []).slice(0, 4).map((member) => {
    const discovery = member.discoveredLocations?.[0] ?? 'a forgotten place';
    return `${member.characterName} discovered ${discovery}.`;
  });

  if (showStuckRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--void)' }}>
        <div className="max-w-md space-y-4 rounded-xl p-6" style={{ background: 'var(--surface)' }}>
          <p className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>A torn page was found.</p>
          <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
            This character comes from an older season build and can no longer continue safely.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={repairCharacter} className="px-3 py-2 rounded-md text-sm" style={{ background: 'var(--ember)', color: 'var(--void)' }}>
              Repair Character
            </button>
            <button type="button" onClick={handleNewGame} className="px-3 py-2 rounded-md text-sm" style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}>
              Hard Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasActiveMainQuest || activeView === 'chapter') {
    return (
      <div className="min-h-screen pb-24 pb-safe" style={{ background: 'var(--void)' }}>
        <Guttering />
        <ChapterView
          chapterOpened={chapterOpened}
          onOpenChapter={() => setChapterOpened(true)}
          hasChosenMarketQuest={hasChosenActiveChapter}
          chapterLines={chapterLines}
          mainQuestFlavorLine={echoes.data?.mainQuestFlavorLine}
          marketConsequence={activeChapterChoice?.consequence}
          marketOption={activeChapterChoice?.option}
          currentQuestStep={currentQuestStep}
          pendingBunch={pendingBunch}
          questBunchStepsLength={questBunchSteps.length}
          onChoose={handleMainQuestChoice}
          deadLetterEnabled={tier3Policy.deadLetterEnabled && !tier3Policy.killSwitchEnabled}
          onOpenDeadLetter={() => setDeadLetterOpen(true)}
          revealPhase={revealPhase}
          revealIdentity={revealIdentity ?? undefined}
        />
        <nav className="fixed inset-x-0 bottom-0 z-40 pb-safe" style={{ background: 'linear-gradient(to top, var(--void), transparent)' }}>
          <div className="mx-auto flex max-w-sm items-center justify-around px-6 py-3">
            {[
              { key: 'profile', icon: '◉', label: 'Profile' },
              { key: 'play', icon: '✦', label: 'Play' },
              { key: 'map', icon: '◈', label: 'Map' },
            ].map((item) => {
              const isActive = (item.key === 'play' && (activeView === 'play' || hasActiveMainQuest)) || activeView === item.key;
              return (
                <button key={item.key} type="button" onClick={() => setActiveView(item.key as ActiveView)} className="relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-300" aria-label={item.label}>
                  <span className="text-lg transition-all duration-300" style={{ color: isActive ? 'var(--ember)' : 'var(--ink-ghost)' }}>
                    {item.icon}
                  </span>
                  <span className="text-[9px] tracking-[0.2em] uppercase transition-opacity" style={{ color: isActive ? 'var(--ink-dim)' : 'var(--ink-ghost)', opacity: isActive ? 1 : 0.5 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--void)' }}>
      <Guttering />
      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-5">
        <header className="rounded-xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <p className="font-cormorant text-xl" style={{ color: 'var(--ink)' }}>{character.characterName}</p>
            <p className="text-xs tracking-[0.16em] uppercase" style={{ color: 'var(--ink-ghost)' }}>Day · {estDayLabel}</p>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-dim)' }}>
            {activeLocationLabel}
          </p>
          <button
            type="button"
            className="mt-3 w-full text-left rounded-md p-3"
            style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
            onClick={() => setActiveView('profile')}
          >
            <p className="font-cormorant text-base">{publicSnippet}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-ghost)' }}>
              Click to open full public profile
            </p>
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            {(networkPresence.data?.topMembers ?? []).slice(0, 3).map((member) => (
              <button
                key={member.pubkey}
                type="button"
                className="text-xs rounded-full px-2 py-1"
                style={{ background: 'var(--surface-dim)', color: 'var(--ink-dim)' }}
                onClick={() => {
                  setSelectedNetworkMember(member);
                  setActiveView('profile');
                }}
              >
                {member.characterName}
              </button>
            ))}
          </div>
        </header>

        <section className="rounded-xl p-5 text-center" style={{ background: 'var(--surface)' }}>
          <button
            type="button"
            className="mx-auto h-28 w-28 rounded-full font-cormorant text-2xl"
            style={{ background: 'var(--ember)', color: 'var(--void)' }}
            onClick={() => setActiveView('play')}
          >
            Play
          </button>
          <p className="mt-4 text-sm" style={{ color: 'var(--ink-dim)' }}>
            Gaining experience at a rate of {rateXp}/hr · Gold {rateGold}/hr
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-ghost)' }}>
            {autonomous.state?.injuries?.length ? `Negative effects: ${autonomous.state.injuries.join(', ')}` : 'No severe injuries today.'}
          </p>
        </section>

        <section className="rounded-xl p-4 space-y-2" style={{ background: 'var(--surface)' }}>
          <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>Mundane Log</p>
          {(autonomous.state?.dailyLogs ?? []).slice(0, 5).map((entry, idx) => (
            <p key={`${entry.tick}-${idx}`} className="font-cormorant text-lg leading-relaxed" style={{ color: 'var(--ink)' }}>
              {entry.line}
            </p>
          ))}
        </section>

        <div className="h-px" style={{ background: 'var(--ink-ghost)' }} />

        <section className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface)' }}>
          <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>Companion</p>
          {[
            'Ask about the old tower dreams',
            'Ask who in town owes you a debt',
            'Ask where hunters vanish at dusk',
          ].map((choice) => (
            <button
              key={choice}
              type="button"
              className="w-full text-left rounded-md px-3 py-2 font-cormorant text-lg"
              style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
              onClick={() => {
                autonomous.queueExploreIntent(choice);
                toast({ title: 'The memory takes root.', description: 'Your companion will bring this thread back later.' });
              }}
            >
              {choice}
            </button>
          ))}
        </section>

        <div className="h-px" style={{ background: 'var(--ink-ghost)' }} />

        <div className="h-px" style={{ background: 'var(--ink-ghost)' }} />

        <section className="space-y-1">
          <p className="text-sm" style={{ color: 'var(--ink)' }}>- Real-money shop (coming soon)</p>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>- Guild registry (coming soon)</p>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>- Caravan contracts (coming soon)</p>
        </section>

        {activeView === 'map' ? (
        <TerritoryView
          discoveredLocations={character.discoveredLocations ?? []}
          glimmerLocationIds={scryingPool.glimmers.map((g) => g.locationId)}
          level={character.level}
          visibleTraits={character.visibleTraits}
          onExplore={(intent) => {
            autonomous.queueExploreIntent(intent);
            const nextCharacter = { ...character, exploreIntent: intent };
            saveMVPCharacter(nextCharacter);
            setCharacter(nextCharacter);
            toast({
              title: 'The road receives your intention',
              description: 'Your character will carry this impulse into the next dawn.',
            });
          }}
        />
      ) : null}

      {activeView === 'profile' ? (
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
          onUpdateCharacter={(nextCharacter) => {
            saveMVPCharacter(nextCharacter);
            setCharacter(nextCharacter);
          }}
        />
      ) : null}

      {showWorldWelcome ? (
        <WorldWelcome
          characterName={character.characterName}
          onDismiss={() => {
            localStorage.setItem('nsg:welcomed', 'true');
            setShowWorldWelcome(false);
          }}
        />
      ) : null}

      <section className="rounded-xl p-4 space-y-2" style={{ background: 'var(--surface)' }}>
        <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>Across the World</p>
        {socialAccomplishments.length > 0 ? socialAccomplishments.map((line) => (
          <p key={line} className="font-cormorant text-sm" style={{ color: 'var(--ink-dim)' }}>{line}</p>
        )) : (
          <p className="font-cormorant text-sm" style={{ color: 'var(--ink-dim)' }}>
            The roads are quiet tonight, but not empty.
          </p>
        )}
      </section>
      </div>

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
      <nav className="fixed inset-x-0 bottom-0 z-40 pb-safe" style={{ background: 'linear-gradient(to top, var(--void), transparent)' }}>
        <div className="mx-auto flex max-w-sm items-center justify-around px-6 py-3">
          {[
            { key: 'profile', icon: '◉', label: 'Profile' },
            { key: 'play', icon: '✦', label: 'Play' },
            { key: 'map', icon: '◈', label: 'Map' },
          ].map((item) => {
            const isActive = activeView === item.key || (item.key === 'play' && activeView !== 'profile' && activeView !== 'map');
            return (
              <button key={item.key} type="button" onClick={() => setActiveView(item.key as ActiveView)} className="relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-300" aria-label={item.label}>
                <span className="text-lg transition-all duration-300" style={{ color: isActive ? 'var(--ember)' : 'var(--ink-ghost)' }}>
                  {item.icon}
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase transition-opacity" style={{ color: isActive ? 'var(--ink-dim)' : 'var(--ink-ghost)', opacity: isActive ? 1 : 0.5 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
