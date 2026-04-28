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
import { trackTelemetry } from '@/lib/rpg/telemetry';
import {
  CHAPTER_PROOF_KIND,
  getChapterWindowId,
  markCanonicalChoiceForWindow,
  resolveCanonicalChoiceFromEvents,
} from '@/lib/rpg/proof';
import {
  clearMVPCharacter,
  loadMVPCharacter,
  saveMVPCharacter,
  isCharacterLikelyStuck,
  type MVPCharacter,
  type NetworkPresenceMember,
  type QuestBunchAnswer,
} from '@/lib/rpg/utils';
import { DEFAULT_TIER3_POLICY, loadTier3Policy, type Tier3PolicySettings } from '@/lib/rpg/policy';
import { getActiveChapter } from '@/lib/rpg/chapterCatalog';
import { AUTONOMOUS_SNAPSHOT_KIND } from '@/lib/rpg/autonomousSimulation';
import { applyProgression } from '@/lib/rpg/progression';
import { runRevelationPass } from '@/lib/rpg/revelationEngine';
import { getDayCountSince, getNextESTMidnight } from '@/lib/rpg/dailyReset';
import { ChapterView } from './ChapterView';
import { TerritoryView } from './TerritoryView';
import { SelfView } from './SelfView';
import { DeadLetterOverlay } from './DeadLetterOverlay';
import { EchoChamberOverlay } from './EchoChamberOverlay';
import { QuestBoardView } from './QuestBoardView';
import { DevTimePanel } from './DevTimePanel';
import { CharacterCreationFlow, type CreationResult } from './CharacterCreationFlow';
import { Guttering } from './Guttering';
import { WorldWelcome } from './WorldWelcome';

type ActiveView = 'play' | 'chapter' | 'map' | 'character' | 'settings' | 'quests' | 'inventory';

const CORE_NAV_ITEMS: Array<{ key: 'character' | 'play' | 'map' | 'inventory'; icon: string; label: string }> = [
  { key: 'character', icon: '◉', label: 'Character' },
  { key: 'play', icon: '✦', label: 'Play' },
  { key: 'map', icon: '◈', label: 'Map' },
  { key: 'inventory', icon: '▣', label: 'Inventory' },
];

const LAST_PUBLISHED_TICK_KEY = 'nsg:last-published-tick';

function CountdownToESTMidnight() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setSeconds(Math.max(0, Math.floor((getNextESTMidnight(now) - now) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return <p className="text-sm text-center">Tomorrow in <strong>{hrs}:{mins}:{secs}</strong></p>;
}

function SecondaryFeatureGrid({ onOpenBounties, onOpenJournal }: { onOpenBounties: () => void; onOpenJournal: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      <button type="button" className="rounded-md px-3 py-2 text-sm text-left" style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }} onClick={onOpenBounties}>
        Tavern Bounties
      </button>
      <button type="button" className="rounded-md px-3 py-2 text-sm text-left" style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }} onClick={onOpenJournal}>
        Journal
      </button>
    </div>
  );
}

export function RPGInterface() {
  const { user, metadata } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home'>('creation');
  const [activeView, setActiveView] = useState<ActiveView>('play');
  const [selectedNetworkMember] = useState<NetworkPresenceMember | null>(null);
  const [chapterOpened, setChapterOpened] = useState(false);
  const [revealPhase, setRevealPhase] = useState<'idle' | 'revealing'>('idle');
  const [revealIdentity, setRevealIdentity] = useState<{ consequence: string; race: string; profession: string; className: string } | null>(null);
  const [tier3Policy, setTier3Policy] = useState<Tier3PolicySettings>(DEFAULT_TIER3_POLICY);
  const [deadLetterOpen, setDeadLetterOpen] = useState(false);
  const [echoChamberOpen, setEchoChamberOpen] = useState(false);
  const [showWorldWelcome, setShowWorldWelcome] = useState(false);
  const [showStuckRecovery, setShowStuckRecovery] = useState(false);
  const [skipDelta, setSkipDelta] = useState<{ goldDelta: number; healthDelta: number; fromLocation: string; toLocation: string } | null>(null);

  const wasTickPublished = (characterId: string, tick: string): boolean => {
    try {
      return localStorage.getItem(`${LAST_PUBLISHED_TICK_KEY}:${characterId}`) === tick;
    } catch {
      return false;
    }
  };

  const markTickPublished = (characterId: string, tick: string): void => {
    try {
      localStorage.setItem(`${LAST_PUBLISHED_TICK_KEY}:${characterId}`, tick);
    } catch {
      // Ignore storage quota issues for idempotency cache.
    }
  };

  const networkPresence = useNetworkPresence(user?.pubkey);
  const echoes = useEchoes(user?.pubkey);
  useHomeland(metadata?.nip05);
  useStrangersLedger();
  const proofChain = useProofChain(user?.pubkey);
  const relayRegions = useRelayRegions();
  const deadLetter = useDeadLetterOffice();
  const echoChamber = useEchoChamber();
  useForgetting();
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
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(`nsg:chapter-proof:${character.id}:`) || (character.pubkey && key.startsWith(`nsg:chapter-proof:${character.pubkey}:`))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors.
    }
    const repaired: MVPCharacter = {
      ...character,
      level: 1,
      className: character.className || 'Wanderer',
      profession: character.profession || 'Woodcutter',
      pendingQuestBunch: undefined,
      completedChapterIds: Array.isArray(character.completedChapterIds) ? character.completedChapterIds : [],
      mainQuestChoices: Array.isArray(character.mainQuestChoices) ? character.mainQuestChoices : [],
      hasCompletedFirstChapter: Boolean(character.hasCompletedFirstChapter),
      dayCount: character.dayCount ?? 1,
      region: character.region ?? 'Mysterious Village',
      currentActivity: character.currentActivity ?? 'idle',
      hourlyXp: character.hourlyXp ?? 0,
      hourlyCopper: character.hourlyCopper ?? 0,
      professionLocked: typeof character.professionLocked === 'boolean' ? character.professionLocked : true,
      nextQuestUnlockTime: character.nextQuestUnlockTime ?? 0,
      companionUnlocked: Boolean(character.companionUnlocked),
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
    const autoState = autonomous.state;
    if (character.lastSimulatedTick === autoState.lastSimulatedTick) return;
    const mergedCharacter: MVPCharacter = {
      ...character,
      gold: autoState.gold,
      health: autoState.health,
      locationId: autoState.locationId,
      visibleTraits: autoState.visibleTraits,
      hiddenTraits: autoState.hiddenTraits,
      injuries: autoState.injuries,
      inventory: autoState.inventory,
      dailyLogs: autoState.dailyLogs,
      lastSimulatedTick: autoState.lastSimulatedTick,
      exploreIntent: autoState.exploreIntent,
      profession: autoState.professionLabel || character.profession,
      dayCount: getDayCountSince(character.createdAt),
      region: character.region || 'Mysterious Village',
      currentActivity: autoState.exploreIntent ? 'exploring' : 'working',
    };
    const progression = applyProgression(character.xp ?? 0, autoState, autoState.gold - (character.gold ?? 0));
    mergedCharacter.xp = (character.xp ?? 0) + progression.xpGain;
    mergedCharacter.hourlyXp = progression.hourlyXp;
    mergedCharacter.hourlyCopper = Math.max(1, Math.floor((autoState.gold - (character.gold ?? 0)) / 24) || 1);
    if (progression.levelUp) mergedCharacter.level = progression.nextLevel;

    const revelation = runRevelationPass(autoState);
    if (revelation.logLines.length > 0) {
      mergedCharacter.visibleTraits = revelation.visibleTraits;
      mergedCharacter.hiddenTraits = revelation.hiddenTraits;
      mergedCharacter.dailyLogs = [
        ...revelation.logLines.map((line) => ({ tick: autoState.lastSimulatedTick ?? 'today', line })),
        ...(mergedCharacter.dailyLogs ?? []),
      ].slice(0, 40);
    }
    if (progression.logLine) {
      mergedCharacter.dailyLogs = [
        { tick: autoState.lastSimulatedTick ?? 'today', line: progression.logLine },
        ...(mergedCharacter.dailyLogs ?? []),
      ].slice(0, 40);
    }
    saveMVPCharacter(mergedCharacter);
    setCharacter(mergedCharacter);

    if (!user || !autoState.lastSimulatedTick) return;
    if (wasTickPublished(character.id, autoState.lastSimulatedTick)) return;
    user.signer.signEvent({
      kind: AUTONOMOUS_SNAPSHOT_KIND,
      content: JSON.stringify({
        version: 2,
        dayCount: mergedCharacter.dayCount,
        raceLocked: Boolean(mergedCharacter.raceLocked),
        nextQuestUnlockTime: mergedCharacter.nextQuestUnlockTime,
        companionUnlocked: mergedCharacter.companionUnlocked,
        state: autoState,
      }),
      tags: [
        ['t', 'no-stranger-game'],
        ['character', character.id],
        ['window', autoState.lastSimulatedTick],
        ['alt', 'No Stranger Game autonomous daily snapshot'],
      ],
      created_at: Math.floor(Date.now() / 1000),
    }).then((event) => {
      nostr.group([...PRESENCE_RELAYS]).event(event).then(() => {
        markTickPublished(character.id, autoState.lastSimulatedTick ?? '');
      }).catch(() => noteSyncFailure());
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
  useConvergence(myClassLabel, networkPresence.data?.topMembers);
  const scryingPool = useScryingPool(character?.discoveredLocations ?? [], networkPresence.data?.topMembers);

  const noteSyncFailure = () => {
    // Sync failures are non-blocking for local progression.
  };

  const renderBottomNav = (inChapterMode: boolean) => (
    <nav className="fixed inset-x-0 bottom-0 z-40 pb-safe" style={{ background: 'linear-gradient(to top, var(--void), transparent)' }}>
      <div className="mx-auto flex max-w-sm items-center justify-around px-6 py-3">
        {CORE_NAV_ITEMS.map((item) => {
          const isActive = inChapterMode
            ? ((item.key === 'play' && (activeView === 'play' || activeView === 'settings' || hasActiveMainQuest)) || activeView === item.key)
            : (activeView === item.key || (item.key === 'play' && activeView === 'settings'));
          return (
            <button key={item.key} type="button" onClick={() => setActiveView(item.key)} className="relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-300" aria-label={item.label}>
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
  );

  const handleNewGame = () => {
    clearMVPCharacter();
    setCharacter(null);
    setScreen('creation');
    setActiveView('play');
    setChapterOpened(false);
  };

  const handleCharacterUpdate = (nextCharacter: MVPCharacter) => {
    saveMVPCharacter(nextCharacter);
    setCharacter(nextCharacter);
  };

  const handleCreateStranger = (normalizedCharacterName: string, creation: CreationResult) => {
    const npub = user ? nip19.npubEncode(user.pubkey) : undefined;
    const newCharacter: MVPCharacter = {
      id: user?.pubkey ?? `temp-${Date.now()}`,
      createdAt: Date.now(),
      level: 1,
      role: 'stranger',
      characterName: normalizedCharacterName,
      gender: 'Unknown',
      race: creation.race || 'Unspoken',
      profession: 'Woodcutter',
      startingCity: 'Dawnharbor',
      className: 'Wanderer',
      profileTitle: 'Unnamed Drifter',
      profileBio: '',
      xp: 0,
      dayCount: 1,
      region: 'Mysterious Village',
      currentActivity: 'idle',
      hourlyXp: 0,
      hourlyCopper: 0,
      mainQuestChoices: [],
      completedChapterIds: [],
      discoveredLocations: ['market-square'],
      hiddenAttributes: creation.hiddenAttributes,
      raceProgress: creation.raceProgress,
      raceLocked: creation.raceLocked,
      professionLocked: true,
      nextQuestUnlockTime: 0,
      companionUnlocked: false,
      companionAffinities: { elara: 0, bran: 0, mira: 0, sera: 0 },
      shelterType: 'shared',
      inventory: [],
      postedQuests: [],
      acceptedQuests: [],
      completedQuests: [],
      escrowedGold: 0,
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
          raceLocked: true,
          nextQuestUnlockTime: 0,
          companionUnlocked: false,
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
    if ((character.nextQuestUnlockTime ?? 0) > Date.now()) {
      toast({
        title: 'Quest unavailable',
        description: 'New main quest choices unlock after daily reset.',
      });
      return;
    }
    const pendingAnswers = [...pendingBunch.answers.filter((answer) => answer.questionId !== questionId), { questionId, option }];
    const withPending: MVPCharacter = { ...character, pendingQuestBunch: { questId: activeQuestId, answers: pendingAnswers } };
    saveMVPCharacter(withPending);
    setCharacter(withPending);
    if (pendingAnswers.length < questBunchSteps.length) return;

    const chapterWindowId = getChapterWindowId();
    const identityKey = `${character.id}:${character.createdAt}:${activeQuestId}`;
    const finalStepQuestionId = questBunchSteps[questBunchSteps.length - 1]?.questionId;
    const finalChoice = pendingAnswers.find((a) => a.questionId === finalStepQuestionId)?.option ?? option;
    const aCount = pendingAnswers.filter((answer) => answer.option === 'A').length;
    const bCount = pendingAnswers.filter((answer) => answer.option === 'B').length;
    const cCount = pendingAnswers.filter((answer) => answer.option === 'C').length;
    const dCount = pendingAnswers.filter((answer) => answer.option === 'D').length;
    const eCount = pendingAnswers.filter((answer) => answer.option === 'E').length;
    const consequenceByArc = finalChoice === 'A'
      ? `You choose duty at the edge of dawn. Your road carries ${aCount} vows and ${cCount} shadows.`
      : finalChoice === 'B'
        ? `You choose endurance over glory. Your road carries ${bCount} hard bargains and ${aCount} mercies.`
        : finalChoice === 'C'
          ? `You choose memory over comfort. Your road carries ${cCount} secrets and ${bCount} burdens.`
          : finalChoice === 'D'
            ? `You choose risk without witness. Your road carries ${dCount} dangerous turns and ${eCount} quiet debts.`
            : `You choose silence and resolve. Your road carries ${eCount} buried vows and ${dCount} unanswered names.`;

    const updatedCharacter: MVPCharacter = {
      ...character,
      mainQuestChoices: [...character.mainQuestChoices, { questId: activeQuestId, prompt: 'Quest bunch: Chapter One arc completed.', option: finalChoice, consequence: consequenceByArc, chosenAt: Math.floor(Date.now() / 1000) }],
      level: character.level + 1,
      race: character.race,
      profession: character.profession,
      className: character.className,
      discoveredLocations: Array.from(new Set([...(character.discoveredLocations ?? ['market-square']), (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'A' ? 'old-library' : (pendingAnswers.find((a) => a.questionId === `${activeQuestId}-q1`)?.option ?? 'A') === 'B' ? 'coin-vault' : 'silent-alley'])),
      chapterWindowIds: Array.from(new Set([...(character.chapterWindowIds ?? []), chapterWindowId])),
      completedChapterIds: Array.from(new Set([...(character.completedChapterIds ?? []), activeQuestId])),
      pendingQuestBunch: undefined,
      hasCompletedFirstChapter: true,
      nextQuestUnlockTime: getNextESTMidnight(),
      companionUnlocked: (Array.from(new Set([...(character.completedChapterIds ?? []), activeQuestId])).length + 1) >= 3,
      companionAffinities: {
        ...(character.companionAffinities ?? { elara: 0, bran: 0, mira: 0, sera: 0 }),
        elara: (character.companionAffinities?.elara ?? 0) + (finalChoice === 'B' ? 2 : 0),
        bran: (character.companionAffinities?.bran ?? 0) + (finalChoice === 'A' ? 2 : 0),
        mira: (character.companionAffinities?.mira ?? 0) + (finalChoice === 'C' ? 2 : 0),
        sera: (character.companionAffinities?.sera ?? 0) + (finalChoice === 'D' || finalChoice === 'E' ? 2 : 0),
      },
    };
    const now = Math.floor(Date.now() / 1000);
    saveMVPCharacter(updatedCharacter);
    setCharacter(updatedCharacter);
    markCanonicalChoiceForWindow(chapterWindowId, identityKey, `${chapterWindowId}:${finalChoice}`);
    setRevealIdentity({
      consequence: consequenceByArc,
      race: character.race,
      profession: character.profession,
      className: character.className,
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
          raceLocked: Boolean(updatedCharacter.raceLocked),
          nextQuestUnlockTime: updatedCharacter.nextQuestUnlockTime,
          companionUnlocked: updatedCharacter.companionUnlocked,
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
    return <CharacterCreationFlow onComplete={handleCreateStranger} />;
  }

  if (!character) return null;

  const regionLabel = character.region || 'Mysterious Village';
  const rateXp = character.hourlyXp ?? 0;
  const rateGold = character.hourlyCopper ?? 0;
  const currentActivity = autonomous.state?.professionLabel || character.profession || 'Working';
  const canOpenMainQuest = (character.nextQuestUnlockTime ?? 0) <= Date.now();
  const hasActiveMainQuest = hasUnreadChapter && canOpenMainQuest;
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
        <button
          type="button"
          onClick={() => setActiveView('settings')}
          className="fixed right-4 top-4 z-50 text-xs px-2 py-1 rounded-md"
          style={{ background: 'var(--surface-dim)', color: 'var(--ink-dim)' }}
        >
          Settings
        </button>
        <ChapterView
          chapterTitle={activeChapter.title}
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
        {renderBottomNav(true)}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--void)' }}>
      <Guttering />
      <button
        type="button"
        onClick={() => setActiveView('settings')}
        className="fixed right-4 top-4 z-50 text-xs px-2 py-1 rounded-md"
        style={{ background: 'var(--surface-dim)', color: 'var(--ink-dim)' }}
      >
        Settings
      </button>
      <div className="mx-auto max-w-2xl px-4 pt-8 space-y-5">
        {activeView === 'play' ? (
          <section className="space-y-4">
            <p className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>Day {character.dayCount} · {regionLabel}</p>
            <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>{String(character.currentActivity || currentActivity).toUpperCase()}</p>
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              +{rateXp} XP/hr · +{rateGold} copper/hr · Payment arrives tomorrow
            </p>
            <CountdownToESTMidnight />
            {hasUnreadChapter && !canOpenMainQuest ? (
              <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
                Main quest unlocks at next daily reset.
              </p>
            ) : null}
            <div className="h-px w-full" style={{ background: 'var(--ink-ghost)' }} />
            <div className="rounded-md p-3 space-y-2" style={{ background: 'var(--surface)' }}>
              {!character.companionUnlocked ? (
                <p className="font-cormorant text-lg" style={{ color: 'var(--ink-dim)' }}>
                  A companion has not yet joined your story.
                </p>
              ) : (
                <>
                  <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>Companion Dialogue</p>
                  {[
                    'Ask about the old tower dreams',
                    'Ask who in town owes you a debt',
                    'Ask where hunters vanish at dusk',
                  ].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="w-full text-left rounded-md px-3 py-3 font-cormorant text-lg"
                      style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
                      onClick={() => autonomous.queueExploreIntent(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </>
              )}
            </div>
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
            <SecondaryFeatureGrid
              onOpenBounties={() => setActiveView('quests')}
              onOpenJournal={() => setActiveView('character')}
            />
          </section>
        ) : null}

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
          }}
        />
      ) : null}

        {activeView === 'quests' ? (
          <QuestBoardView
            character={character}
            activePlayersCount={networkPresence.data?.totalWorldOptedIn ?? 0}
            followsPlayingCount={networkPresence.data?.totalOptedIn ?? 0}
            topMembers={networkPresence.data?.topMembers ?? []}
            onUpdateCharacter={handleCharacterUpdate}
          />
        ) : null}

        {activeView === 'character' ? (
        <SelfView
          character={character}
          proofNodes={proofChain.data ?? []}
          relayRegions={relayRegions}
          onUpdateCharacter={handleCharacterUpdate}
        />
      ) : null}

        {activeView === 'inventory' ? (
          <section className="rounded-xl p-5 space-y-3" style={{ background: 'var(--surface)' }}>
            <p className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>Inventory</p>
            {(character.inventory ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>Your pack is light today.</p>
            ) : character.inventory.map((entry) => (
              <p key={entry.itemId} className="text-sm" style={{ color: 'var(--ink-dim)' }}>
                {entry.itemId}: {entry.quantity}
              </p>
            ))}
          </section>
        ) : null}

        {activeView === 'settings' ? (
          <section className="rounded-xl p-5 space-y-4" style={{ background: 'var(--surface)' }}>
            <p className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>Settings</p>
            <button
              type="button"
              onClick={handleNewGame}
              className="text-xs tracking-wider uppercase transition-colors"
              style={{ color: 'var(--crimson)' }}
            >
              Create new character
            </button>
          </section>
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
      {renderBottomNav(false)}
      <DevTimePanel
        enabled={Boolean(import.meta.env.DEV) && Boolean(character)}
        onSkipDays={async (days) => {
          if (!character || !autonomous.state) return null;
          const before = autonomous.state;
          const after = await autonomous.skipDays(days);
          if (!after) return null;
          const nextCharacter: MVPCharacter = {
            ...character,
            gold: after.gold,
            health: after.health,
            locationId: after.locationId,
            visibleTraits: after.visibleTraits,
            hiddenTraits: after.hiddenTraits,
            injuries: after.injuries,
            inventory: after.inventory,
            dailyLogs: after.dailyLogs,
            lastSimulatedTick: after.lastSimulatedTick,
            exploreIntent: after.exploreIntent,
            profession: after.professionLabel || character.profession,
            dayCount: getDayCountSince(character.createdAt),
            region: character.region,
            currentActivity: 'working',
          };
          handleCharacterUpdate(nextCharacter);
          const delta = {
            goldDelta: after.gold - before.gold,
            healthDelta: after.health - before.health,
            fromLocation: before.locationId,
            toLocation: after.locationId,
          };
          setSkipDelta(delta);
          setTimeout(() => setSkipDelta(null), 4000);
          return delta;
        }}
      />
      {skipDelta ? (
        <div
          className="fixed right-3 bottom-40 z-50 rounded-md px-3 py-2 text-xs"
          style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--ink-ghost)' }}
        >
          Δ Gold {skipDelta.goldDelta >= 0 ? '+' : ''}{skipDelta.goldDelta} · Δ Health {skipDelta.healthDelta >= 0 ? '+' : ''}{skipDelta.healthDelta}
          <br />
          {skipDelta.fromLocation} → {skipDelta.toLocation}
        </div>
      ) : null}
    </div>
  );
}
