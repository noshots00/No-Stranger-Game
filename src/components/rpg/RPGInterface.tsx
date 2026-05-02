import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import {
  applyChoice,
  getCompletedQuestIds,
  getCurrentStep,
  getPlayerVisibleQuests,
  getQuestContext,
  getVisibleQuests,
  questNumberFromId,
  interpolateStepText,
  restartQuestProgress,
  startQuest,
  submitPlayerName,
} from '@/components/rpg/quests/engine';
import { SKILL_XP_KEYS, distributeDailySkillXp } from '@/components/rpg/quests/skills-config';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import {
  BRACELET_DAILY_FLAG,
  DELAYED_QUEST_UNLOCKS,
  DAILY_ITEM_QUEST_CHANCE,
  DILEMMA_DAILY_CHANCE,
  WOLF_ATTACK_DAILY_CHANCE,
  WOLF_ATTACK_DAILY_FLAG,
  EARRING_DAILY_FLAG,
  HAT_DAILY_FLAG,
  SHOE_DAILY_FLAG,
  TROLLEY_DAILY_FLAG,
  HEINZ_DAILY_FLAG,
  PRISONER_DAILY_FLAG,
  LIFEBOAT_DAILY_FLAG,
  SOPHIE_DAILY_FLAG,
  DAILY_XP,
  DAY_IN_MS,
  DIALOGUE_BREATHE_OVERFLOW_RATIO,
  DIALOGUE_SCROLL_PIN_EPS,
  HIDDEN_LOCATION_ACTIONS,
  INTRO_DEV_MESSAGE,
  locationActions,
  SILVER_LAKE_SCENE_ACTION_QUEST,
  PLAY_DIALOGUE_RECENT_MAX,
  PLAY_WORLD_RECENT_MAX,
} from './constants';
import type { MobileTab } from './constants';
import { appendDialogue, appendUniqueWorldEntries, buildDayReportDialogueLines, getLevelUpLines, getRewardLines } from './helpers';
import {
  formatPlayerChoiceDialogueLine,
  groupChronicleRows,
  groupDialogueLinesByVoice,
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
  QUEST_IMAGE_SPEAKER,
} from './dialogueFormat';
import type { ChronicleMergedRow } from './dialogueFormat';
import { useQuestState } from './hooks/useQuestState';
import { useDayCounter } from './hooks/useDayCounter';
import { useSocialQueries } from './hooks/useSocialQueries';
import { GameHeader } from './GameHeader';
import { ChronicleDialog } from './ChronicleDialog';
import { CharacterTab } from './tabs/CharacterTab';
import { QuestsTab } from './tabs/QuestsTab';
import { PlayTab } from './tabs/PlayTab';
import { MapTab } from './tabs/MapTab';
import { SocialTab } from './tabs/SocialTab';
import { useAmbientPad } from './audio/useAmbientPad';
import { publicAsset } from '@/lib/publicAsset';

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { logout } = useLoginActions();
  const navigate = useNavigate();

  const { questState, setQuestState, isQuestStateHydrated, persistQuestCheckpoint, resetQuestState } = useQuestState();
  const { dayCounter, setDevDayOffsetMs, resetTimestamp, nextDayResetMs } = useDayCounter();

  useAmbientPad({
    active: questState.currentLocation === 'Silver Lake',
    preferFile: publicAsset('music/silver-lake.mp3'),
  });
  const { socialStats, socialActivityQuery, socialKindredSignalsQuery, lobbyNameMap } = useSocialQueries();

  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);

  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  const eventLogScrollRef = useRef<HTMLDivElement | null>(null);
  const dialoguePinnedRef = useRef(true);
  const dialogueInstantScrollRef = useRef(false);
  const prevDialogueOverflowRatioRef = useRef<number | null>(null);
  const completedQuestCountRef = useRef(0);

  const handleDialogueScroll = () => {
    const el = dialogueScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      dialoguePinnedRef.current = true;
      return;
    }
    dialoguePinnedRef.current = el.scrollTop >= maxScroll - DIALOGUE_SCROLL_PIN_EPS;
  };

  const completedQuestIds = useMemo(() => getCompletedQuestIds(questState), [questState]);
  const questContext = useMemo(() => getQuestContext(questState, dayCounter), [questState, dayCounter]);
  const visibleQuests = useMemo(
    () => getPlayerVisibleQuests(allQuests, questContext, questState.unveiledQuestIds),
    [questContext, questState.unveiledQuestIds]
  );
  const activeQuest = questState.activeQuestId ? questById[questState.activeQuestId] : null;
  const activeStep = activeQuest ? getCurrentStep(questState, activeQuest) : null;
  const pendingQuestCount = useMemo(
    () => visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id)).length,
    [visibleQuests, completedQuestIds]
  );
  const visibleLocationActions = (locationActions[questState.currentLocation] ?? []).filter(
    (action) => !HIDDEN_LOCATION_ACTIONS.has(action)
  );
  const newestPendingQuestId = useMemo(() => {
    const pending = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
    if (pending.length === 0) return null;
    return [...pending].sort((a, b) => b.createdAt - a.createdAt)[0].id;
  }, [visibleQuests, completedQuestIds]);

  const chronicleDateTimeFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    []
  );
  const playDialogueLines = useMemo(
    () => questState.dialogueLog.slice(-PLAY_DIALOGUE_RECENT_MAX),
    [questState.dialogueLog]
  );
  const playDialogueBlocks = useMemo(
    () => groupDialogueLinesByVoice(playDialogueLines),
    [playDialogueLines]
  );
  const playWorldLines = useMemo(
    () => questState.worldEventLog.slice(-PLAY_WORLD_RECENT_MAX),
    [questState.worldEventLog]
  );
  const characterNameLabel = useMemo(() => {
    const trimmed = questState.playerName.trim();
    return trimmed.length > 0 ? trimmed : 'Stranger';
  }, [questState.playerName]);
  const locationIndicatorClass =
    questState.currentLocation === 'Forest'
      ? 'location-indicator-forest'
      : questState.currentLocation === 'Silver Lake'
        ? 'location-indicator-silver-lake'
        : 'candle-ink-muted';
  const showOriginStartHint =
    activeQuest?.id === 'quest-001-origin' && activeStep?.id === 'start' && activeStep.type === 'choice';

  const chronicleRows = useMemo((): ChronicleMergedRow[] => {
    if (!isChronicleOpen) return [];
    const dialogueRows: ChronicleMergedRow[] = questState.dialogueLog.map((line) => ({
      kind: 'dialogue' as const,
      atMs: line.atMs,
      id: line.id,
      speaker: line.speaker,
      text: line.text,
    }));
    const worldRows: ChronicleMergedRow[] = questState.worldEventLog.map((entry) => ({
      kind: 'world' as const,
      atMs: entry.atMs,
      text: entry.text,
    }));
    return [...dialogueRows, ...worldRows].sort((a, b) => {
      if (a.atMs !== b.atMs) return a.atMs - b.atMs;
      if (a.kind === b.kind) return 0;
      return a.kind === 'dialogue' ? -1 : 1;
    });
  }, [isChronicleOpen, questState.dialogueLog, questState.worldEventLog]);
  const chronicleSegments = useMemo(() => groupChronicleRows(chronicleRows), [chronicleRows]);

  useLayoutEffect(() => {
    if (activeTab !== 'play') return;
    const el = dialogueScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const ratio = el.clientHeight > 0 ? el.scrollHeight / el.clientHeight : 1;
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dialogueInstantScrollRef.current) {
      el.scrollTop = maxScroll;
      dialogueInstantScrollRef.current = false;
      dialoguePinnedRef.current = true;
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    if (!dialoguePinnedRef.current) {
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    const prevR = prevDialogueOverflowRatioRef.current;
    const crossedIntoBreathe =
      prevR !== null &&
      prevR < DIALOGUE_BREATHE_OVERFLOW_RATIO &&
      ratio >= DIALOGUE_BREATHE_OVERFLOW_RATIO &&
      maxScroll > 0;

    if (crossedIntoBreathe && !prefersReduced) {
      const target = Math.max(0, Math.min(maxScroll, Math.floor(maxScroll / 2)));
      el.scrollTo({ top: target, behavior: 'smooth' });
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    el.scrollTop = maxScroll;
    prevDialogueOverflowRatioRef.current = ratio;
  }, [questState.dialogueLog, activeTab]);

  useLayoutEffect(() => {
    if (activeTab !== 'play') return;
    const container = eventLogScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight - container.clientHeight;
  }, [questState.worldEventLog, activeTab]);

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (completedQuestIds.length > completedQuestCountRef.current) {
      void persistQuestCheckpoint(questState);
    }
    completedQuestCountRef.current = completedQuestIds.length;
  }, [completedQuestIds, isQuestStateHydrated, questState, persistQuestCheckpoint]);

  const getDeterministicDailyRoll = (day: number, seedOffset = 0): number => {
    const x = Math.sin(day * 12.9898 + 78.233 + seedOffset * 17.719) * 43758.5453;
    return x - Math.floor(x);
  };

  // One-time legacy backfill: if a returning player has quest progress but no unveil
  // tracking for currently-eligible quests, mark all currently-eligible quests as unveiled
  // so they aren't retroactively hidden by the new 2/day cap.
  const unveilBackfillDoneRef = useRef(false);
  useEffect(() => {
    if (!isQuestStateHydrated || unveilBackfillDoneRef.current) return;
    const hasProgress = Object.keys(questState.progressByQuestId).length > 0;
    if (!hasProgress) {
      unveilBackfillDoneRef.current = true;
      return;
    }
    const eligibleIds = getVisibleQuests(allQuests, questContext).map((q) => q.id);
    const merged = Array.from(new Set([...questState.unveiledQuestIds, ...eligibleIds]));
    if (merged.length !== questState.unveiledQuestIds.length) {
      const next = { ...questState, unveiledQuestIds: merged };
      setQuestState(next);
      void persistQuestCheckpoint(next);
    }
    unveilBackfillDoneRef.current = true;
  }, [isQuestStateHydrated, questState, questContext, persistQuestCheckpoint, setQuestState]);

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (dayCounter <= questState.lastDailyXpDay) return;

    const daysToGrant = dayCounter - questState.lastDailyXpDay;
    const xpToGrant = daysToGrant * DAILY_XP;
    const skillGrants = distributeDailySkillXp(xpToGrant, 'exploring');
    const nextSkills = { ...questState.skills };
    for (const key of SKILL_XP_KEYS) {
      nextSkills[key] = questState.skills[key] + (skillGrants[key] ?? 0);
    }
    const updatedState = {
      ...questState,
      experience: questState.experience + xpToGrant,
      skills: nextSkills,
      lastDailyXpDay: dayCounter,
    };
    const completedQuestIdSet = new Set(getCompletedQuestIds(updatedState));
    const dailyProbabilisticFlags: Array<{ flag: string; active: boolean }> = [
      { flag: WOLF_ATTACK_DAILY_FLAG, active: getDeterministicDailyRoll(dayCounter, 1) < WOLF_ATTACK_DAILY_CHANCE },
      { flag: EARRING_DAILY_FLAG, active: getDeterministicDailyRoll(dayCounter, 2) < DAILY_ITEM_QUEST_CHANCE },
      { flag: BRACELET_DAILY_FLAG, active: getDeterministicDailyRoll(dayCounter, 3) < DAILY_ITEM_QUEST_CHANCE },
      { flag: SHOE_DAILY_FLAG, active: getDeterministicDailyRoll(dayCounter, 4) < DAILY_ITEM_QUEST_CHANCE },
      { flag: HAT_DAILY_FLAG, active: getDeterministicDailyRoll(dayCounter, 5) < DAILY_ITEM_QUEST_CHANCE },
      {
        flag: TROLLEY_DAILY_FLAG,
        active:
          getDeterministicDailyRoll(dayCounter, 6) < DILEMMA_DAILY_CHANCE &&
          !completedQuestIdSet.has('quest-017-ironwood-switch'),
      },
      {
        flag: HEINZ_DAILY_FLAG,
        active:
          getDeterministicDailyRoll(dayCounter, 7) < DILEMMA_DAILY_CHANCE &&
          !completedQuestIdSet.has('quest-019-plaguebloom-phial'),
      },
      {
        flag: PRISONER_DAILY_FLAG,
        active:
          getDeterministicDailyRoll(dayCounter, 8) < DILEMMA_DAILY_CHANCE &&
          !completedQuestIdSet.has('quest-020-iron-cage'),
      },
      {
        flag: LIFEBOAT_DAILY_FLAG,
        active:
          getDeterministicDailyRoll(dayCounter, 9) < DILEMMA_DAILY_CHANCE &&
          !completedQuestIdSet.has('quest-021-nine-oar-raft'),
      },
      {
        flag: SOPHIE_DAILY_FLAG,
        active:
          getDeterministicDailyRoll(dayCounter, 10) < DILEMMA_DAILY_CHANCE &&
          !completedQuestIdSet.has('quest-022-warlords-choice'),
      },
    ];
    const FLAG_TO_QUEST_ID: Record<string, string> = {
      [WOLF_ATTACK_DAILY_FLAG]: 'quest-008-wolf-attack',
      [EARRING_DAILY_FLAG]: 'quest-010-find-earring',
      [BRACELET_DAILY_FLAG]: 'quest-011-find-bracelet',
      [SHOE_DAILY_FLAG]: 'quest-012-find-shoe',
      [HAT_DAILY_FLAG]: 'quest-013-find-hat',
      [TROLLEY_DAILY_FLAG]: 'quest-017-ironwood-switch',
      [HEINZ_DAILY_FLAG]: 'quest-019-plaguebloom-phial',
      [PRISONER_DAILY_FLAG]: 'quest-020-iron-cage',
      [LIFEBOAT_DAILY_FLAG]: 'quest-021-nine-oar-raft',
      [SOPHIE_DAILY_FLAG]: 'quest-022-warlords-choice',
    };
    const probabilisticFlagSet = new Set(Object.keys(FLAG_TO_QUEST_ID));
    const retainedFlags = updatedState.flags.filter((flag) => {
      if (!probabilisticFlagSet.has(flag)) return true;
      const questId = FLAG_TO_QUEST_ID[flag];
      return questId ? !completedQuestIdSet.has(questId) : false;
    });
    const candidateNewFlags = dailyProbabilisticFlags
      .filter((entry) => entry.active && !retainedFlags.includes(entry.flag))
      .slice(0, 1)
      .map((entry) => entry.flag);
    let promotedFlags = Array.from(new Set([...retainedFlags, ...candidateNewFlags]));
    for (const { pending, unlocked } of DELAYED_QUEST_UNLOCKS) {
      if (promotedFlags.includes(pending)) {
        promotedFlags = promotedFlags.filter((f) => f !== pending);
        if (!promotedFlags.includes(unlocked)) promotedFlags.push(unlocked);
      }
    }
    updatedState.flags = promotedFlags;

    const ctxAfterFlags = getQuestContext({ ...updatedState }, dayCounter);
    const eligibleIds = getVisibleQuests(allQuests, ctxAfterFlags).map((q) => q.id);
    const alreadyUnveiled = new Set(updatedState.unveiledQuestIds);
    const queue = eligibleIds.filter(
      (id) => !alreadyUnveiled.has(id) && !completedQuestIdSet.has(id)
    );
    queue.sort((a, b) => questNumberFromId(b) - questNumberFromId(a));
    const newToUnveil = queue.slice(0, 2);
    if (newToUnveil.length > 0) {
      updatedState.unveiledQuestIds = [...updatedState.unveiledQuestIds, ...newToUnveil];
    }

    const dayLine = `Day ${dayCounter} began.`;
    updatedState.worldEventLog = appendUniqueWorldEntries(updatedState.worldEventLog, [dayLine]);

    const reportLines = buildDayReportDialogueLines(dayCounter - 1, questState, updatedState, dayCounter);
    updatedState.dialogueLog = [...updatedState.dialogueLog, ...reportLines];

    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  }, [dayCounter, isQuestStateHydrated, questState, persistQuestCheckpoint, setQuestState]);

  useEffect(() => {
    setExpandedQuestId(newestPendingQuestId);
  }, [newestPendingQuestId]);

  useEffect(() => {
    if (questState.dialogueLog.length > 0) return;
    const quest = questById[questState.activeQuestId ?? ''];
    if (!quest) return;
    setQuestState((prev) => {
      if (prev.dialogueLog.length > 0) return prev;
      const started = startQuest(prev, quest);
      const firstStep = getCurrentStep(started, quest);
      return {
        ...started,
        dialogueLog: [
          appendDialogue(QUEST_IMAGE_SPEAKER, quest.title),
          appendDialogue('Narrator', interpolateStepText(firstStep.text, started.playerName)),
        ],
      };
    });
  }, [questState.activeQuestId, questState.dialogueLog.length, setQuestState]);

  const handleResetStory = async () => {
    resetQuestState();
    setNameInput('');
    setNameInputError(null);
    setDevDayOffsetMs(0);
    await resetTimestamp();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleStartQuest = (questId: string) => {
    const quest = questById[questId];
    if (!quest) return;
    setQuestState((prev) => {
      const started = startQuest(prev, quest);
      const firstStep = getCurrentStep(started, quest);
      return {
        ...started,
        dialogueLog: [
          ...started.dialogueLog,
          appendDialogue(QUEST_IMAGE_SPEAKER, quest.title),
          appendDialogue('Narrator', interpolateStepText(firstStep.text, started.playerName)),
        ],
      };
    });
    setNameInput('');
    setNameInputError(null);
  };

  const handleStepChoice = (choiceId: string) => {
    if (!activeQuest) return;
    setQuestState((prev) => {
      const currentStep = getCurrentStep(prev, activeQuest);
      if (currentStep.type !== 'choice') return prev;
      const selectedChoice = currentStep.choices.find((choice) => choice.id === choiceId);
      if (!selectedChoice) return prev;

      const nextState = applyChoice(prev, activeQuest, choiceId);
      const nextStep = getCurrentStep(nextState, activeQuest);
      const nextLog = [
        ...nextState.dialogueLog,
        appendDialogue(
          PLAYER_ACTION_SPEAKER,
          formatPlayerChoiceDialogueLine(prev.playerName, selectedChoice.label)
        ),
      ];

      if (nextStep.type === 'message') {
        nextLog.push(appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)));
      } else if (!nextState.progressByQuestId[activeQuest.id]?.isCompleted) {
        nextLog.push(appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)));
      }
      const wasCompleted = Boolean(prev.progressByQuestId[activeQuest.id]?.isCompleted);
      const isCompleted = Boolean(nextState.progressByQuestId[activeQuest.id]?.isCompleted);
      if (!wasCompleted && isCompleted) {
        nextLog.push(appendDialogue(QUEST_DIVIDER_SPEAKER, ''));
      }

      const rewardLines = getRewardLines(prev.modifiers, nextState.modifiers);
      const levelUpLines = getLevelUpLines(prev, nextState);
      const worldEventLog = appendUniqueWorldEntries(nextState.worldEventLog, [...rewardLines, ...levelUpLines]);

      return {
        ...nextState,
        dialogueLog: nextLog,
        worldEventLog,
      };
    });
  };

  const handleNameSubmit = () => {
    if (!activeQuest) return;
    const { nextState, error } = submitPlayerName(questState, activeQuest, nameInput);
    if (error) {
      setNameInputError(error);
      return;
    }
    setNameInputError(null);
    const nextStep = getCurrentStep(nextState, activeQuest);
    const submittedName = nameInput.trim();

    if (activeQuest.id === 'quest-001-origin') {
      const updatedState = {
        ...nextState,
        activeQuestId: null,
        flags: Array.from(new Set([...nextState.flags, 'quest001-complete'])),
        progressByQuestId: {
          ...nextState.progressByQuestId,
          [activeQuest.id]: {
            ...nextState.progressByQuestId[activeQuest.id],
            isCompleted: true,
          },
        },
        dialogueLog: [
          ...nextState.dialogueLog,
          appendDialogue('You', submittedName),
          appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)),
          appendDialogue('Dev Message', INTRO_DEV_MESSAGE),
        ],
      };
      setQuestState(updatedState);
      void persistQuestCheckpoint(updatedState);
      return;
    }

    const updatedState = {
      ...nextState,
      dialogueLog: [
        ...nextState.dialogueLog,
        appendDialogue('You', submittedName),
        appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)),
      ],
    };
    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  };

  const handleTrackQuest = (questId: string) => {
    dialogueInstantScrollRef.current = true;
    handleStartQuest(questId);
    setActiveTab('play');
  };

  const handleLocationSceneAction = (actionLabel: string) => {
    const questId = SILVER_LAKE_SCENE_ACTION_QUEST[actionLabel];
    if (!questId) return;
    const quest = questById[questId];
    if (!quest) return;

    setQuestState((prev) => {
      const ctx = getQuestContext(prev, dayCounter);
      if (!quest.isAvailable(ctx)) return prev;
      dialogueInstantScrollRef.current = true;
      const restarted = restartQuestProgress(prev, quest);
      const started = startQuest(restarted, quest);
      const firstStep = getCurrentStep(started, quest);
      return {
        ...started,
        dialogueLog: [
          ...started.dialogueLog,
          appendDialogue(QUEST_IMAGE_SPEAKER, quest.title),
          appendDialogue('Narrator', interpolateStepText(firstStep.text, started.playerName)),
        ],
      };
    });
    setActiveTab('play');
  };

  const navItems: Array<{ key: MobileTab; label: string; icon: string; isPrimary?: boolean }> = [
    { key: 'character', label: 'Character', icon: '◉' },
    { key: 'quests', label: 'Quests', icon: '☰' },
    { key: 'play', label: 'Play', icon: '✦', isPrimary: true },
    { key: 'map', label: 'Map', icon: '◈' },
    { key: 'social', label: 'Social', icon: '◎' },
  ];

  const renderTabPanel = () => {
    switch (activeTab) {
      case 'character':
        return (
          <CharacterTab
            questState={questState}
            userPubkey={user?.pubkey}
            onOpenChronicle={() => setIsChronicleOpen(true)}
          />
        );
      case 'quests':
        return (
          <QuestsTab
            visibleQuests={visibleQuests}
            completedQuestIds={completedQuestIds}
            expandedQuestId={expandedQuestId}
            onExpandQuest={setExpandedQuestId}
            onTrackQuest={handleTrackQuest}
          />
        );
      case 'map':
        return (
          <MapTab
            currentLocation={questState.currentLocation}
            flags={questState.flags}
            onLocationChange={(location) =>
              setQuestState((prev) => ({ ...prev, currentLocation: location }))
            }
          />
        );
      case 'social':
        return (
          <SocialTab
            socialStats={socialStats}
            activityRows={socialActivityQuery.data ?? []}
            activityStatus={socialActivityQuery.isPending ? 'pending' : socialActivityQuery.isError ? 'error' : 'success'}
            kindredSignalRows={socialKindredSignalsQuery.data ?? []}
            kindredSignalStatus={socialKindredSignalsQuery.isPending ? 'pending' : socialKindredSignalsQuery.isError ? 'error' : 'success'}
            lobbyNameMap={lobbyNameMap}
            characterNameLabel={characterNameLabel}
            hasCharacter={questState.playerName.trim().length > 0}
          />
        );
      default:
        return (
          <PlayTab
            playDialogueBlocks={playDialogueBlocks}
            playWorldLines={playWorldLines}
            activeQuest={activeQuest ?? null}
            activeStep={activeStep ?? null}
            dialogueLogLength={questState.dialogueLog.length}
            worldEventLogLength={questState.worldEventLog.length}
            nameInput={nameInput}
            onNameInputChange={setNameInput}
            nameInputError={nameInputError}
            onStepChoice={handleStepChoice}
            onNameSubmit={handleNameSubmit}
            dialogueScrollRef={dialogueScrollRef}
            eventLogScrollRef={eventLogScrollRef}
            onDialogueScroll={handleDialogueScroll}
            visibleLocationActions={visibleLocationActions}
            showOriginStartHint={showOriginStartHint}
            onLocationAction={handleLocationSceneAction}
            playerFlags={questState.flags}
            playerHealth={questState.health}
            nextDayResetMs={nextDayResetMs}
            currentLocation={questState.currentLocation}
            characterNameLabel={characterNameLabel}
            speakerNameMap={lobbyNameMap}
            hasCharacter={questState.playerName.trim().length > 0}
          />
        );
    }
  };

  return (
    <>
    <main className="candlelit-shell relative h-[100dvh] max-h-[100dvh] w-full overflow-x-hidden overflow-y-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex h-[100dvh] w-full max-w-2xl flex-col gap-1.5 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] sm:px-8 sm:pt-2">
        <GameHeader
          dayCounter={dayCounter}
          currentLocation={questState.currentLocation}
          locationIndicatorClass={locationIndicatorClass}
          onAdvanceDay={() => setDevDayOffsetMs((prev) => prev + DAY_IN_MS)}
          onLogout={handleLogout}
          onResetStory={handleResetStory}
        />
        <div
          className={`emerge min-h-0 flex-1 ${activeTab === 'play' ? 'overflow-hidden' : 'facsimile-scroll overflow-y-auto pr-1'}`}
        >
          {renderTabPanel()}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <nav className="candlelit-bottom-nav pointer-events-auto mx-auto w-full max-w-2xl" aria-label="Primary game navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`candlelit-nav-btn relative ${item.isPrimary ? 'is-primary' : ''} ${isActive ? 'is-active' : ''}`}
                aria-label={item.label}
              >
                {item.key === 'quests' && pendingQuestCount > 0 ? (
                  <span className="absolute right-2 top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[var(--candle-flame-soft)] bg-black/70 px-1 text-[9px] font-medium leading-none text-[var(--candle-ink)]">
                    {pendingQuestCount}
                  </span>
                ) : null}
                <span className="text-base leading-none" aria-hidden>
                  {item.icon}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
    <ChronicleDialog
      isOpen={isChronicleOpen}
      onOpenChange={setIsChronicleOpen}
      chronicleSegments={chronicleSegments}
      chronicleDateTimeFmt={chronicleDateTimeFmt}
    />
    </>
  );
}
