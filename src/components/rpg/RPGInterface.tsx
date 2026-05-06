import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import {
  applyChoice,
  getCompletedQuestIds,
  getCurrentStep,
  getQuestContext,
  getQuestListForUi,
  getVisibleQuests,
  questNumberFromId,
  interpolateStepText,
  restartQuestProgress,
  startQuest,
  submitPlayerName,
} from '@/components/rpg/quests/engine';
import { SKILL_XP_KEYS, distributeDailySkillXp } from '@/components/rpg/quests/skills-config';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import { mergeJournalRecapOnQuestComplete } from '@/components/rpg/quests/journalSummary';
import type { QuestState } from '@/components/rpg/quests/types';
import {
  APP_VERSION,
  BRACELET_DAILY_FLAG,
  CHARACTER_CREATION_DATE_STORAGE_KEY,
  CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY,
  characterCreationDateStorageKeyForPubkey,
  DAY_IN_MS,
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
  DIALOGUE_SCROLL_PIN_EPS,
  DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY,
  DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY,
  HIDDEN_LOCATION_ACTIONS,
  locationActions,
  SILVER_LAKE_SCENE_ACTION_QUEST,
  PLAY_DIALOGUE_RECENT_MAX,
  PLAY_JOURNAL_RECENT_MAX,
  PLAY_WORLD_RECENT_MAX,
} from './constants';
import type { MobileTab } from './constants';
import { appendDialogue, appendUniqueWorldEntries, buildDayReportDialogueLines, getLevelUpLines, getRewardLines } from './helpers';
import {
  dialogueHasQuestOpeningAtEnd,
  formatPlayerChoiceDialogueLine,
  groupChronicleRows,
  mergeDialogueAndWorldRows,
  mergePlayFeedRows,
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
  visualDialogueEntriesForQuestStep,
} from './dialogueFormat';
import type { ChronicleMergedRow } from './dialogueFormat';
import { useQuestState } from './hooks/useQuestState';
import { useDayCounter } from './hooks/useDayCounter';
import { useSocialQueries } from './hooks/useSocialQueries';
import { GameHeader } from './GameHeader';
import { CharacterTab } from './tabs/CharacterTab';
import { ChronicleTab } from './tabs/ChronicleTab';
import { PlayTab } from './tabs/PlayTab';
import { SocialTab } from './tabs/SocialTab';
import { useGameMusic } from './audio/useGameMusic';
import { publishCharacterCreation, publishMergedProfileDisplayName } from './gameProfile';
import { computeGameDayCounterFromCreationYmd, EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';
import { publicAsset } from '@/lib/publicAsset';
import { needsMandatoryCharacterReset } from './characterSaveVersion';
import { EarlyDevCharacterResetGate } from './EarlyDevCharacterResetGate';
import { GamePortraitViewport } from './GamePortraitViewport';

export function RPGInterface() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { logout } = useLoginActions();
  const navigate = useNavigate();

  const { questState, setQuestState, isQuestStateHydrated, persistQuestCheckpoint, resetQuestStateAndSync } =
    useQuestState();
  const {
    creationDateEastern,
    dayCounter,
    devFiveMinuteDays,
    setDevFiveMinuteDays,
    setDevDayOffsetMs,
    resetTimestamp,
    rapidDaySimulation,
    setRapidDaySimulation,
    isPacingResolved,
    useFiveMinuteTestPeriods,
  } = useDayCounter({ questCreationDateEastern: questState.characterCreationDateEastern });

  const showEarlyDevResetGate = isQuestStateHydrated && needsMandatoryCharacterReset(questState);
  const canShowGame = isQuestStateHydrated && isPacingResolved && !showEarlyDevResetGate;

  useGameMusic({
    active: !showEarlyDevResetGate,
    src: publicAsset('audio/music/SoaveSiaII.mp3'),
  });
  const { socialStats, socialActivityQuery, socialKindredSignalsQuery, lobbyNameMap } = useSocialQueries();

  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [nameInput, setNameInput] = useState('');
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [dismissedNewQuestIds, setDismissedNewQuestIds] = useState<string[]>([]);
  const [showModifierDetails, setShowModifierDetails] = useState(false);
  const [devUnlockAllQuests, setDevUnlockAllQuests] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY);
    if (raw === '1') setShowModifierDetails(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY, showModifierDetails ? '1' : '0');
  }, [showModifierDetails]);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY);
    if (raw === '1') setDevUnlockAllQuests(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY, devUnlockAllQuests ? '1' : '0');
  }, [devUnlockAllQuests]);

  useEffect(() => {
    setDismissedNewQuestIds([]);
  }, [dayCounter]);

  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  const dialoguePinnedRef = useRef(true);
  const dialogueInstantScrollRef = useRef(false);
  /** False until first bottom snap on Play; avoids scrollTop=0 on mount marking the feed "unpinned". */
  const dialogueScrollReadyRef = useRef(false);
  /** After switching to Play, keep snapping to bottom while layout/fonts grow until user scrolls up or timeout. */
  const playDialogueSnapInitialRef = useRef(false);
  const prevPlayTabRef = useRef(false);
  const completedQuestCountRef = useRef(0);
  const activeTabRef = useRef<MobileTab>(activeTab);
  activeTabRef.current = activeTab;

  const snapPlayDialogueBottom = useCallback(() => {
    const el = dialogueScrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    el.querySelector<HTMLElement>('[data-stick-scroll-bottom-sentinel]')?.scrollIntoView({
      block: 'end',
      behavior: 'auto',
    });
    dialoguePinnedRef.current = true;
    dialogueScrollReadyRef.current = true;
  }, []);

  const handleDialogueScroll = () => {
    if (!dialogueScrollReadyRef.current) return;
    const el = dialogueScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      dialoguePinnedRef.current = true;
      return;
    }
    dialoguePinnedRef.current = el.scrollTop >= maxScroll - DIALOGUE_SCROLL_PIN_EPS;
    if (!dialoguePinnedRef.current) {
      playDialogueSnapInitialRef.current = false;
    }
  };

  const completedQuestIds = useMemo(() => getCompletedQuestIds(questState), [questState]);
  const questContext = useMemo(() => getQuestContext(questState, dayCounter), [questState, dayCounter]);
  const visibleQuests = useMemo(
    () => getQuestListForUi(allQuests, questContext, questState.unveiledQuestIds, devUnlockAllQuests),
    [questContext, questState.unveiledQuestIds, devUnlockAllQuests]
  );
  const newQuestIds = useMemo(
    () =>
      visibleQuests
        .filter((quest) => quest.createdAt === dayCounter && !dismissedNewQuestIds.includes(quest.id))
        .map((quest) => quest.id),
    [visibleQuests, dayCounter, dismissedNewQuestIds]
  );
  const activeQuest = questState.activeQuestId ? questById[questState.activeQuestId] : null;
  const activeStep = activeQuest ? getCurrentStep(questState, activeQuest) : null;
  const visibleLocationActions = (locationActions[questState.currentLocation] ?? []).filter(
    (action) => !HIDDEN_LOCATION_ACTIONS.has(action)
  );
  const chronicleDateTimeFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    []
  );
  const playDialogueLines = useMemo(() => {
    const completed = new Set(completedQuestIds);
    const filtered = questState.dialogueLog.filter(
      (line) => !(line.sourceQuestId && completed.has(line.sourceQuestId))
    );
    return filtered.slice(-PLAY_DIALOGUE_RECENT_MAX);
  }, [questState.dialogueLog, completedQuestIds]);
  const playWorldLines = useMemo(
    () => questState.worldEventLog.slice(-PLAY_WORLD_RECENT_MAX),
    [questState.worldEventLog]
  );
  const playJournalLines = useMemo(
    () => questState.journalLog.slice(-PLAY_JOURNAL_RECENT_MAX),
    [questState.journalLog]
  );
  const playFeedSegments = useMemo(
    () => groupChronicleRows(mergePlayFeedRows(playDialogueLines, playWorldLines, [])),
    [playDialogueLines, playWorldLines]
  );

  const questTitleById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const q of allQuests) {
      m[q.id] = q.title;
    }
    return m;
  }, []);

  /** Drives bottom-stick retries after journal/composer layout shifts (expand quest, new lines). */
  const playScrollStickRevision = useMemo(
    () =>
      [
        playDialogueLines.length,
        questState.worldEventLog.length,
        questState.journalLog.length,
        visibleQuests.length,
        activeQuest?.id ?? '',
        playFeedSegments.length,
        playJournalLines.length,
      ].join('|'),
    [
      playDialogueLines.length,
      questState.worldEventLog.length,
      questState.journalLog.length,
      visibleQuests.length,
      activeQuest?.id,
      playFeedSegments.length,
      playJournalLines.length,
    ]
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
  /** Origin quest “click a choice” hint — off until copy/UI is finalized. */
  const showOriginStartHint = false;

  const chronicleRows = useMemo((): ChronicleMergedRow[] => {
    if (activeTab !== 'chronicle') return [];
    return mergeDialogueAndWorldRows(questState.dialogueLog, questState.worldEventLog);
  }, [activeTab, questState.dialogueLog, questState.worldEventLog]);
  const chronicleSegments = useMemo(() => groupChronicleRows(chronicleRows), [chronicleRows]);

  useLayoutEffect(() => {
    if (activeTab !== 'play') {
      prevPlayTabRef.current = false;
      dialogueScrollReadyRef.current = false;
      playDialogueSnapInitialRef.current = false;
      return;
    }

    const justEnteredPlay = !prevPlayTabRef.current;
    prevPlayTabRef.current = true;
    if (justEnteredPlay) {
      dialoguePinnedRef.current = true;
      dialogueScrollReadyRef.current = false;
      playDialogueSnapInitialRef.current = true;
    }

    const el = dialogueScrollRef.current;
    if (!el) return;

    let scheduleFollowUpSnap = false;

    if (dialogueInstantScrollRef.current) {
      snapPlayDialogueBottom();
      dialogueInstantScrollRef.current = false;
      playDialogueSnapInitialRef.current = true;
      scheduleFollowUpSnap = true;
    } else if (!dialoguePinnedRef.current) {
      dialogueScrollReadyRef.current = true;
    } else {
      snapPlayDialogueBottom();
      scheduleFollowUpSnap = true;
    }

    if (scheduleFollowUpSnap || justEnteredPlay) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (activeTabRef.current !== 'play') return;
          if (!playDialogueSnapInitialRef.current && !dialoguePinnedRef.current) return;
          snapPlayDialogueBottom();
        });
      });
    }
  }, [playScrollStickRevision, activeTab, snapPlayDialogueBottom]);

  /** Catch flex/font/layout growth after Play mounts so the latest line stays in view. */
  useEffect(() => {
    if (activeTab !== 'play') return;
    const el = dialogueScrollRef.current;
    if (!el) return;

    const maybeSnap = () => {
      if (activeTabRef.current !== 'play') return;
      if (!playDialogueSnapInitialRef.current && !dialoguePinnedRef.current) return;
      snapPlayDialogueBottom();
    };

    const ro = new ResizeObserver(maybeSnap);
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner) ro.observe(inner);

    maybeSnap();
    return () => ro.disconnect();
  }, [activeTab, snapPlayDialogueBottom, playScrollStickRevision]);

  /** Fonts + late image layout after refresh — re-pin when still following the tail. */
  useEffect(() => {
    if (activeTab !== 'play' || !canShowGame) return;
    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (cancelled || activeTabRef.current !== 'play') return;
      if (!playDialogueSnapInitialRef.current && !dialoguePinnedRef.current) return;
      snapPlayDialogueBottom();
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, canShowGame, snapPlayDialogueBottom, playScrollStickRevision]);

  useEffect(() => {
    if (activeTab !== 'play') return;
    const id = window.setTimeout(() => {
      playDialogueSnapInitialRef.current = false;
    }, 8000);
    return () => window.clearTimeout(id);
  }, [activeTab]);

  useEffect(() => {
    if (!isQuestStateHydrated || showEarlyDevResetGate) return;
    if (completedQuestIds.length > completedQuestCountRef.current) {
      void persistQuestCheckpoint(questState);
    }
    completedQuestCountRef.current = completedQuestIds.length;
  }, [completedQuestIds, isQuestStateHydrated, questState, persistQuestCheckpoint, showEarlyDevResetGate]);

  const getDeterministicDailyRoll = (day: number, seedOffset = 0): number => {
    const x = Math.sin(day * 12.9898 + 78.233 + seedOffset * 17.719) * 43758.5453;
    return x - Math.floor(x);
  };

  // One-time legacy backfill: if a returning player has quest progress but no unveil
  // tracking for currently-eligible quests, mark all currently-eligible quests as unveiled
  // so they aren't retroactively hidden by the new 2/day cap.
  const unveilBackfillDoneRef = useRef(false);
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || unveilBackfillDoneRef.current || showEarlyDevResetGate) return;
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
  }, [
    isQuestStateHydrated,
    isPacingResolved,
    questState,
    questContext,
    persistQuestCheckpoint,
    setQuestState,
    showEarlyDevResetGate,
  ]);

  // Catch-up on login/session: when the in-game day advances vs last grant, apply XP, report, unveil.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;

    const qc = questState.characterCreationDateEastern;
    const pacingAligned =
      creationDateEastern === null ? qc === null : qc === creationDateEastern;
    if (!pacingAligned) return;

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

    const reportLines = buildDayReportDialogueLines(dayCounter - 1, questState, updatedState);
    updatedState.dialogueLog = [...updatedState.dialogueLog, ...reportLines];

    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  }, [
    creationDateEastern,
    dayCounter,
    isQuestStateHydrated,
    isPacingResolved,
    questState,
    persistQuestCheckpoint,
    setQuestState,
    showEarlyDevResetGate,
  ]);

  useEffect(() => {
    if (!canShowGame) return;
    if (questState.dialogueLog.length > 0) return;
    const quest = questById[questState.activeQuestId ?? ''];
    if (!quest) return;
    setQuestState((prev) => {
      if (prev.dialogueLog.length > 0) return prev;
      const started = startQuest(prev, quest);
      const firstStep = getCurrentStep(started, quest);
      const openingText = interpolateStepText(firstStep.text, started.playerName);
      if (dialogueHasQuestOpeningAtEnd(started.dialogueLog, quest.title, openingText)) {
        return started;
      }
      return {
        ...started,
        dialogueLog: [
          ...visualDialogueEntriesForQuestStep(quest, quest.startStepId),
          appendDialogue('Narrator', openingText, { sourceQuestId: quest.id }),
        ],
      };
    });
  }, [canShowGame, questState.activeQuestId, questState.dialogueLog.length, setQuestState]);

  const handleResetStory = async () => {
    localStorage.setItem(CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY, '1');
    await resetTimestamp();
    setDevDayOffsetMs(0);
    setRapidDaySimulation(false);
    await resetQuestStateAndSync();
    setNameInput('');
    setNameInputError(null);
  };

  const handleMandatoryEarlyDevReset = async () => {
    localStorage.setItem(CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY, '1');
    await resetTimestamp();
    setDevDayOffsetMs(0);
    setRapidDaySimulation(false);
    await resetQuestStateAndSync();
    setNameInput('');
    setNameInputError(null);
    window.location.reload();
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
      const openingText = interpolateStepText(firstStep.text, started.playerName);
      if (dialogueHasQuestOpeningAtEnd(started.dialogueLog, quest.title, openingText)) {
        return started;
      }
      return {
        ...started,
        dialogueLog: [
          ...started.dialogueLog,
          ...visualDialogueEntriesForQuestStep(quest, quest.startStepId),
          appendDialogue('Narrator', openingText, { sourceQuestId: quest.id }),
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
      const qid = activeQuest.id;
      const qOpts = { sourceQuestId: qid };
      const nextLog = [
        ...nextState.dialogueLog,
        appendDialogue(
          PLAYER_ACTION_SPEAKER,
          formatPlayerChoiceDialogueLine(prev.playerName, selectedChoice.label),
          qOpts
        ),
        ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
      ];

      if (nextStep.type === 'message') {
        nextLog.push(
          appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName), qOpts)
        );
      } else if (
        nextStep.type !== 'input' &&
        !nextState.progressByQuestId[activeQuest.id]?.isCompleted
      ) {
        nextLog.push(
          appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName), qOpts)
        );
      }
      const wasCompleted = Boolean(prev.progressByQuestId[activeQuest.id]?.isCompleted);
      const isCompleted = Boolean(nextState.progressByQuestId[activeQuest.id]?.isCompleted);
      if (!wasCompleted && isCompleted) {
        nextLog.push(appendDialogue(QUEST_DIVIDER_SPEAKER, '', qOpts));
      }

      const rewardLines = getRewardLines(prev.modifiers, nextState.modifiers);
      const levelUpLines = getLevelUpLines(prev, nextState);
      const worldEventLog = appendUniqueWorldEntries(nextState.worldEventLog, [...rewardLines, ...levelUpLines]);

      let merged: QuestState = {
        ...nextState,
        dialogueLog: nextLog,
        worldEventLog,
      };
      merged = mergeJournalRecapOnQuestComplete(prev, merged, activeQuest);
      return merged;
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
      const creationYmd = formatInTimeZone(Date.now(), EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
      const characterCreationDateEastern = nextState.characterCreationDateEastern ?? creationYmd;
      const lastDailyXpDay = computeGameDayCounterFromCreationYmd(
        characterCreationDateEastern,
        Date.now(),
        useFiveMinuteTestPeriods
      );
      const updatedState = {
        ...nextState,
        characterCreationDateEastern,
        characterCreatedAtAppVersion: APP_VERSION,
        lastDailyXpDay,
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
          ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
          appendDialogue('You', interpolateStepText(nextStep.text, nextState.playerName), {
            sourceQuestId: activeQuest.id,
          }),
        ],
      };
      const withJournal = mergeJournalRecapOnQuestComplete(questState, updatedState, activeQuest);
      setQuestState(withJournal);
      void persistQuestCheckpoint(withJournal);
      if (updatedState.characterCreationDateEastern) {
        if (user?.pubkey) {
          localStorage.setItem(
            characterCreationDateStorageKeyForPubkey(user.pubkey),
            updatedState.characterCreationDateEastern
          );
          localStorage.removeItem(CHARACTER_CREATION_DATE_STORAGE_KEY);
        } else {
          localStorage.setItem(CHARACTER_CREATION_DATE_STORAGE_KEY, updatedState.characterCreationDateEastern);
        }
      }
      localStorage.removeItem(CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY);
      if (user?.signer && withJournal.characterCreationDateEastern) {
        void publishCharacterCreation(nostr, user.signer, withJournal.characterCreationDateEastern);
      }
      if (user?.signer && user.pubkey) {
        void (async () => {
          try {
            await publishMergedProfileDisplayName(nostr, user.signer, user.pubkey, submittedName);
            await queryClient.invalidateQueries({ queryKey: ['nostr', 'author', user.pubkey] });
          } catch (e) {
            console.warn('Failed to sync profile display name', e);
          }
        })();
      }
      return;
    }

    const updatedState = {
      ...nextState,
      dialogueLog: [
        ...nextState.dialogueLog,
        ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
        appendDialogue('You', interpolateStepText(nextStep.text, nextState.playerName), {
          sourceQuestId: activeQuest.id,
        }),
      ],
    };
    const withJournal = mergeJournalRecapOnQuestComplete(questState, updatedState, activeQuest);
    setQuestState(withJournal);
    void persistQuestCheckpoint(withJournal);
  };

  const handleTrackQuest = (questId: string) => {
    setDismissedNewQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
    dialogueInstantScrollRef.current = true;
    handleStartQuest(questId);
    setActiveTab('play');
  };

  const handleAcknowledgeQuest = (questId: string) => {
    setDismissedNewQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
  };

  const handleLocationSceneAction = (actionLabel: string) => {
    const questId = SILVER_LAKE_SCENE_ACTION_QUEST[actionLabel];
    if (!questId) return;
    const quest = questById[questId];
    if (!quest) return;

    setQuestState((prev) => {
      const ctx = getQuestContext(prev, dayCounter);
      if (!devUnlockAllQuests && !quest.isAvailable(ctx)) return prev;
      dialogueInstantScrollRef.current = true;
      const restarted = restartQuestProgress(prev, quest);
      const started = startQuest(restarted, quest);
      const firstStep = getCurrentStep(started, quest);
      const openingText = interpolateStepText(firstStep.text, started.playerName);
      if (dialogueHasQuestOpeningAtEnd(started.dialogueLog, quest.title, openingText)) {
        return started;
      }
      return {
        ...started,
        dialogueLog: [
          ...started.dialogueLog,
          ...visualDialogueEntriesForQuestStep(quest, quest.startStepId),
          appendDialogue('Narrator', openingText, { sourceQuestId: quest.id }),
        ],
      };
    });
    setActiveTab('play');
  };

  const navItems: Array<{ key: MobileTab; label: string; icon: string; isPrimary?: boolean }> = [
    { key: 'character', label: 'Character', icon: '◉' },
    { key: 'play', label: 'Play', icon: '✦', isPrimary: true },
    { key: 'social', label: 'Social', icon: '◎' },
  ];
  const navHighlightTab: MobileTab = activeTab === 'chronicle' ? 'character' : activeTab;

  const renderTabPanel = () => {
    switch (activeTab) {
      case 'character':
        return (
          <CharacterTab
            questState={questState}
            userPubkey={user?.pubkey}
            kindredSpirits={user ? socialStats.kindredSpirits : undefined}
            onOpenChronicle={() => setActiveTab('chronicle')}
            showModifierDetails={showModifierDetails}
            showDevTools
            onAdvanceDay={() => setDevDayOffsetMs((prev) => prev + DAY_IN_MS)}
            devFiveMinuteDays={devFiveMinuteDays}
            onDevFiveMinuteDaysChange={setDevFiveMinuteDays}
            rapidDaySimulation={rapidDaySimulation}
            onRapidDaySimulationChange={setRapidDaySimulation}
            onShowModifierDetailsChange={setShowModifierDetails}
            devUnlockAllQuests={devUnlockAllQuests}
            onDevUnlockAllQuestsChange={setDevUnlockAllQuests}
            onLogout={handleLogout}
            onResetStory={handleResetStory}
          />
        );
      case 'chronicle':
        return (
          <ChronicleTab chronicleSegments={chronicleSegments} chronicleDateTimeFmt={chronicleDateTimeFmt} />
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
            playFeedSegments={playFeedSegments}
            playJournalLines={playJournalLines}
            journalLog={questState.journalLog}
            newQuestIds={newQuestIds}
            questTitleById={questTitleById}
            visibleQuests={visibleQuests}
            completedQuestIds={completedQuestIds}
            onTrackQuest={handleTrackQuest}
            onAcknowledgeQuest={handleAcknowledgeQuest}
            activeQuest={activeQuest ?? null}
            activeStep={activeStep ?? null}
            nameInput={nameInput}
            onNameInputChange={setNameInput}
            nameInputError={nameInputError}
            onStepChoice={handleStepChoice}
            onNameSubmit={handleNameSubmit}
            dialogueScrollRef={dialogueScrollRef}
            onDialogueScroll={handleDialogueScroll}
            visibleLocationActions={visibleLocationActions}
            showOriginStartHint={showOriginStartHint}
            onLocationAction={handleLocationSceneAction}
            playerFlags={questState.flags}
          />
        );
    }
  };

  return (
    <>
    <GamePortraitViewport>
    <main className="candlelit-shell relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex min-h-0 flex-1 w-full flex-col gap-1.5 px-0 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
        {!isQuestStateHydrated ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-0 text-center">
            <p className="font-serif text-lg text-[var(--candle-ink-soft)]">Loading your ledger…</p>
            <p className="max-w-xs font-serif text-sm text-[var(--candle-ink-faint)]">
              Syncing character state so dates and quests stay matched to this account.
            </p>
          </div>
        ) : showEarlyDevResetGate ? (
          <EarlyDevCharacterResetGate onOkay={handleMandatoryEarlyDevReset} />
        ) : !isPacingResolved ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-0 text-center">
            <p className="font-serif text-lg text-[var(--candle-ink-soft)]">Loading your ledger…</p>
            <p className="max-w-xs font-serif text-sm text-[var(--candle-ink-faint)]">
              Syncing character state so dates and quests stay matched to this account.
            </p>
          </div>
        ) : (
          <>
        <GameHeader
          dayCounter={dayCounter}
          currentLocation={questState.currentLocation}
          locationIndicatorClass={locationIndicatorClass}
        />
        <div
          className={`min-h-0 flex-1 ${
            activeTab === 'play'
              ? 'play-surface-fade-in overflow-hidden'
              : activeTab === 'social'
                ? 'emerge flex h-full min-h-0 flex-1 flex-col overflow-hidden'
                : 'emerge facsimile-scroll overflow-y-auto pr-0'
          }`}
        >
          {renderTabPanel()}
        </div>
          </>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <nav
          className="candlelit-bottom-nav pointer-events-auto w-full"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
          aria-label="Primary game navigation"
        >
          {canShowGame
            ? navItems.map((item) => {
                const isActive = navHighlightTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`candlelit-nav-btn relative ${item.isPrimary ? 'is-primary' : ''} ${isActive ? 'is-active' : ''}`}
                    aria-label={item.label}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {item.icon}
                    </span>
                  </button>
                );
              })
            : null}
        </nav>
      </div>
    </main>
    </GamePortraitViewport>
    </>
  );
}
