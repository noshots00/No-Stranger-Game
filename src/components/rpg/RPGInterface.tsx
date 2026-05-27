import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import {
  advanceQuestMessage,
  applyChoice,
  applyDirectModifiersDelta,
  getCompletedQuestIds,
  getCurrentStep,
  getQuestContext,
  getQuestListForUi,
  interpolateStepText,
  isDayPacingActive,
  reconcileVillagePhaseState,
  restartQuestProgress,
  startQuest,
  submitPlayerName,
} from '@/components/rpg/quests/engine';
import { SKILL_XP_KEYS, distributeDailySkillXp } from '@/components/rpg/quests/skills-config';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import {
  catchUpSagaUnveilIds,
  catchUpVillageUnveilId,
  computeNextUnveilIdsAfterCompletion,
  pickNextSideQuestToUnveilOnDayRoll,
} from '@/components/rpg/quests/quest-saga';
import { mergeJournalRecapOnQuestComplete } from '@/components/rpg/quests/journalSummary';
import type { DialogueLogEntry, ModifierMap, QuestDefinition, QuestState } from '@/components/rpg/quests/types';
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
  DEV_USE_QUEST_POPUP_STORAGE_KEY,
  DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY,
  HIDDEN_LOCATION_ACTIONS,
  locationActions,
  QUEST001_NAMED_FLAG,
  QUEST_ORIGIN_ID,
  QUEST_003B_MEET_MERCHANT_ID,
  QUEST_004_B_CARL_HUB_STEP_ID,
  QUEST_004_B_THE_DOOR_ID,
  ORIGIN_QUEST_OPENED_FLAG,
  SILVER_LAKE_SCENE_ACTION_QUEST,
  PLAY_DIALOGUE_RECENT_MAX,
  PLAY_JOURNAL_RECENT_MAX,
  PLAY_WORLD_RECENT_MAX,
  LOCATION_LABEL_DISPLAY,
  DISCOVERED_CEMETERY_FLAG,
  DISCOVERED_MINE_FLAG,
  DISCOVERED_QUARRY_FLAG,
  VILLAGE_PHASE_FLAG,
} from './constants';
import type { MobileTab } from './constants';
import {
  appendDialogue,
  appendUniqueWorldEntries,
  buildDayReportDialogueLines,
  getCopperFromModifiers,
} from './helpers';
import {
  dialogueHasQuestOpeningAtEnd,
  formatPlayerChoiceDialogueLine,
  groupChronicleRows,
  mergeDialogueAndWorldRows,
  mergePlayFeedRows,
  NARRATOR_RESPONSE_SPEAKER,
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
  QUEST_IMAGE_SPEAKER,
  QUEST_NARRATOR_PROMPT_SPEAKER,
  QUEST_VISUAL_SPEAKER,
  visualDialogueEntriesForQuestStep,
} from './dialogueFormat';
import type { ChronicleMergedRow } from './dialogueFormat';
import { useQuestState } from './hooks/useQuestState';
import { useDayCounter } from './hooks/useDayCounter';
import { useSocialQueries } from './hooks/useSocialQueries';
import {
  applyStoryCheckpoint,
  devCompleteQuestById,
  STORY_CHECKPOINT_LABELS,
  STORY_CHECKPOINT_ORDER,
  type StoryCheckpointId,
} from './dev/devStoryCheckpoints';
import { GameHeader } from './GameHeader';
import { CharacterTab } from './tabs/CharacterTab';
import { ChronicleTab } from './tabs/ChronicleTab';
import { PlayTab } from './tabs/PlayTab';
import { VillagePlaySurface } from './village/VillagePlaySurface';
import { SocialTab } from './tabs/SocialTab';
import { useGameMusic } from './audio/useGameMusic';
import { publishCharacterCreation, publishMergedProfileDisplayName } from './gameProfile';
import { EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';
import { publicAsset } from '@/lib/publicAsset';
import { needsMandatoryCharacterReset } from './characterSaveVersion';
import { EarlyDevCharacterResetGate } from './EarlyDevCharacterResetGate';
import { GamePortraitViewport } from './GamePortraitViewport';
import { MerchantPanel } from './merchant/MerchantPanel';
import { MERCHANT_TRADE_GOODS } from './merchant/merchantEconomy';
import { CarlDoorNpcPanel } from './quests/CarlDoorNpcPanel';
import { ArenaPanel } from './arena/ArenaPanel';
import { useArenaTournament } from './arena/useArenaTournament';
import { useArenaSyncPersonalRecord } from './arena/useArenaSyncPersonalRecord';
import { GuildAlleyPanel } from './guild/GuildAlleyPanel';
import { useGuildAlley } from './guild/useGuildAlley';
import { TavernPanel } from './tavern/TavernPanel';
import { useTavern } from './tavern/useTavern';
import { MarketPanel } from './market/MarketPanel';
import { useMarket } from './market/useMarket';
import { MayorsHutPanel } from './mayorsHut/MayorsHutPanel';
import { useMayorsHut } from './mayorsHut/useMayorsHut';
import { JobsHallPanel } from './jobs/JobsHallPanel';
import { switchActiveJob } from './jobs/applyJobAction';
import { getJobDefinition } from './jobs/registry';
import { VillageProjectsPanel } from './villageProjects/VillageProjectsPanel';
import { useVillageProjects } from './villageProjects/useVillageProjects';
import { CraftersCornerPanel } from './crafter/CraftersCornerPanel';
import { applyWolfHideDailyGrants } from './tavern/wolfHidesDaily';
import { getDeterministicDailyRoll } from '@/lib/deterministicDailyRoll';

/**
 * Session guard for ledger loading overlay.
 * Keeps "Loading your ledger…" from reappearing on transient remounts.
 */
let hasShownGameOnceInSession = false;

/** localStorage `nsg:dev-header-tools=1` enables header dev tools in production builds. */
const DEV_HEADER_TOOLS_STORAGE_KEY = 'nsg:dev-header-tools';

/** Credits daily XP when the main `mainDailyQuest` arc first completes; sets `quest001-complete`. */
function applyMainDailyQuestCompletionIfNeeded(
  prev: QuestState,
  merged: QuestState,
  quest: QuestDefinition,
  calendarDay: number
): QuestState {
  if (!quest.mainDailyQuest) return merged;
  const wasCompleted = Boolean(prev.progressByQuestId[quest.id]?.isCompleted);
  const nowCompleted = Boolean(merged.progressByQuestId[quest.id]?.isCompleted);
  if (wasCompleted || !nowCompleted) return merged;
  const flags = Array.from(new Set([...merged.flags, 'quest001-complete']));
  if (!isDayPacingActive(merged.flags)) {
    return { ...merged, flags };
  }
  const daysToGrant = Math.max(1, calendarDay - prev.lastDailyXpDay);
  const xpToGrant = daysToGrant * DAILY_XP;
  const skillGrants = distributeDailySkillXp(xpToGrant, 'exploring');
  const nextSkills = { ...merged.skills };
  for (const key of SKILL_XP_KEYS) {
    nextSkills[key] = merged.skills[key] + (skillGrants[key] ?? 0);
  }
  return {
    ...merged,
    flags,
    experience: merged.experience + xpToGrant,
    skills: nextSkills,
    lastDailyXpDay: calendarDay,
  };
}

function mergeDiscoveryUnveils(
  merged: QuestState,
  completedQuestId: string,
  calendarDay: number
): QuestState {
  const ctx = getQuestContext(merged, calendarDay);
  const completed = getCompletedQuestIds(merged);
  const add = computeNextUnveilIdsAfterCompletion(
    completedQuestId,
    merged.unveiledQuestIds,
    completed,
    ctx
  );
  if (add.length === 0) return merged;
  return {
    ...merged,
    unveiledQuestIds: Array.from(new Set([...merged.unveiledQuestIds, ...add])),
  };
}

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
  const [questPopupQuestId, setQuestPopupQuestId] = useState<string | null>(null);
  const [showModifierDetails, setShowModifierDetails] = useState(false);
  const [devUnlockAllQuests, setDevUnlockAllQuests] = useState(false);
  const [useQuestPopupFallback, setUseQuestPopupFallback] = useState(false);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [guildAlleyOpen, setGuildAlleyOpen] = useState(false);
  const [tavernOpen, setTavernOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [mayorsHutOpen, setMayorsHutOpen] = useState(false);
  const [craftersCornerOpen, setCraftersCornerOpen] = useState(false);
  const [jobsHallOpen, setJobsHallOpen] = useState(false);
  const [villageProjectsOpen, setVillageProjectsOpen] = useState(false);
  const [hasShownGameOnce, setHasShownGameOnce] = useState(() => hasShownGameOnceInSession);

  const arenaTournament = useArenaTournament({
    enabled: arenaOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
  });

  useArenaSyncPersonalRecord({
    enabled: canShowGame && Boolean(user?.pubkey),
    matches: arenaTournament.feed.matches,
    myPubkey: user?.pubkey,
    setQuestState,
    persistQuestCheckpoint,
  });

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
    const raw = localStorage.getItem(DEV_USE_QUEST_POPUP_STORAGE_KEY);
    if (raw === '1') setUseQuestPopupFallback(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_USE_QUEST_POPUP_STORAGE_KEY, useQuestPopupFallback ? '1' : '0');
  }, [useQuestPopupFallback]);

  useEffect(() => {
    if (!questPopupQuestId) return;
    const completed = getCompletedQuestIds(questState);
    if (completed.includes(questPopupQuestId)) setQuestPopupQuestId(null);
  }, [questPopupQuestId, questState]);

  useEffect(() => {
    if (canShowGame && !hasShownGameOnce) {
      hasShownGameOnceInSession = true;
      setHasShownGameOnce(true);
    }
  }, [canShowGame, hasShownGameOnce]);

  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  /** When true, play-feed snap uses smooth scroll instead of instant scrollTop (quest choice visual transition). */
  const questChoiceVisualActiveRef = useRef(false);
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
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    if (questChoiceVisualActiveRef.current) {
      el.scrollTo({ top: maxScroll, behavior: 'smooth' });
    } else {
      el.scrollTop = maxScroll;
      const sentinels = el.querySelectorAll<HTMLElement>('[data-stick-scroll-bottom-sentinel]');
      const sentinel = sentinels.length > 0 ? sentinels[sentinels.length - 1] : null;
      sentinel?.scrollIntoView({ block: 'end', behavior: 'auto' });
    }
    dialoguePinnedRef.current = true;
    dialogueScrollReadyRef.current = true;
  }, []);

  const handleQuestChoiceVisualPhase = useCallback((phase: 'start' | 'end') => {
    if (phase === 'start') {
      questChoiceVisualActiveRef.current = true;
      return;
    }
    questChoiceVisualActiveRef.current = false;
    if (activeTabRef.current !== 'play') return;
    dialoguePinnedRef.current = true;
    playDialogueSnapInitialRef.current = true;
    snapPlayDialogueBottom();
  }, [snapPlayDialogueBottom]);

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
  const merchantTravelUnlocked = completedQuestIds.includes(QUEST_003B_MEET_MERCHANT_ID);
  const formatLocationLabel = useCallback((loc: string) => LOCATION_LABEL_DISPLAY[loc] ?? loc, []);
  const travelLocations = useMemo(() => {
    const villageEndgame = questState.flags.includes(VILLAGE_PHASE_FLAG);
    const out: string[] = [];
    const add = (s: string) => {
      if (!out.includes(s)) out.push(s);
    };
    if (villageEndgame) {
      add('Village');
      add('Forest');
      if (questState.flags.includes(DISCOVERED_CEMETERY_FLAG)) add('Cemetery');
      if (questState.flags.includes(DISCOVERED_QUARRY_FLAG)) add('Quarry');
      if (questState.flags.includes(DISCOVERED_MINE_FLAG)) add('Mine');
      const cur = questState.currentLocation;
      if (cur && !out.includes(cur)) add(cur);
      return out;
    }
    add('Forest');
    if (merchantTravelUnlocked) add('Merchant');
    const cur = questState.currentLocation;
    if (cur && !out.includes(cur)) add(cur);
    return out;
  }, [merchantTravelUnlocked, questState.currentLocation, questState.flags]);
  const handleTravelLocationSelect = useCallback(
    (nextLocation: string) => {
      setQuestState((prev) => {
        const next = { ...prev, currentLocation: nextLocation };
        void persistQuestCheckpoint(next);
        return next;
      });
    },
    [setQuestState, persistQuestCheckpoint]
  );
  const handleMerchantApplyModifiers = useCallback(
    (delta: ModifierMap) => {
      setQuestState((prev) => {
        const next = applyDirectModifiersDelta(prev, delta);
        void persistQuestCheckpoint(next);
        return next;
      });
    },
    [setQuestState, persistQuestCheckpoint]
  );

  const guildAlley = useGuildAlley({
    enabled: guildAlleyOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
    setQuestState,
    persistQuestCheckpoint,
    onApplyModifiers: handleMerchantApplyModifiers,
  });

  const tavern = useTavern({
    enabled: tavernOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
    setQuestState,
    persistQuestCheckpoint,
  });

  const market = useMarket({
    enabled: marketOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
    setQuestState,
    persistQuestCheckpoint,
  });

  const mayorsHut = useMayorsHut({
    enabled: (mayorsHutOpen || villageProjectsOpen) && canShowGame,
    questState,
    myPubkey: user?.pubkey,
  });

  const villageProjects = useVillageProjects({
    enabled: villageProjectsOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
    election: mayorsHut.election,
    setQuestState,
    persistQuestCheckpoint,
  });
  const handleMerchantDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleTravelLocationSelect('Forest');
    },
    [handleTravelLocationSelect]
  );

  const [devHeaderToolsFromStorage, setDevHeaderToolsFromStorage] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(DEV_HEADER_TOOLS_STORAGE_KEY) === '1') setDevHeaderToolsFromStorage(true);
    } catch {
      /* private / blocked storage */
    }
  }, []);
  const showHeaderDevTools = import.meta.env.DEV || devHeaderToolsFromStorage;

  const sortedQuestsForDev = useMemo(
    () => [...allQuests].sort((a, b) => a.title.localeCompare(b.title)),
    []
  );
  const [devCompleteQuestSelection, setDevCompleteQuestSelection] = useState(
    () => sortedQuestsForDev[0]?.id ?? ''
  );
  useEffect(() => {
    if (sortedQuestsForDev.length === 0) return;
    setDevCompleteQuestSelection((cur) =>
      cur && sortedQuestsForDev.some((q) => q.id === cur) ? cur : sortedQuestsForDev[0]!.id
    );
  }, [sortedQuestsForDev]);

  const handleDevCheckpoint = useCallback(
    (checkpoint: StoryCheckpointId) => {
      setQuestState((prev) => {
        const next = applyStoryCheckpoint(prev, checkpoint, questById);
        void persistQuestCheckpoint(next);
        return next;
      });
    },
    [setQuestState, persistQuestCheckpoint]
  );

  const handleDevCompleteQuest = useCallback(() => {
    if (!devCompleteQuestSelection) return;
    setQuestState((prev) => {
      let next = devCompleteQuestById(prev, devCompleteQuestSelection, questById);
      next = mergeDiscoveryUnveils(next, devCompleteQuestSelection, dayCounter);
      void persistQuestCheckpoint(next);
      return next;
    });
  }, [devCompleteQuestSelection, dayCounter, setQuestState, persistQuestCheckpoint]);

  const headerDevPanel = useMemo(() => {
    if (!showHeaderDevTools) return null;
    return (
      <div className="flex flex-col gap-2 font-serif text-xs text-[var(--candle-ink)]">
        <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">Story checkpoints</p>
        <div className="flex flex-col gap-1">
          {STORY_CHECKPOINT_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className="rounded border border-[var(--candle-rule)] bg-black/20 px-2 py-1.5 text-left text-[0.7rem] text-[var(--candle-ink-soft)] hover:bg-[var(--candle-flame)]/15"
              onClick={() => handleDevCheckpoint(id)}
            >
              {STORY_CHECKPOINT_LABELS[id]}
            </button>
          ))}
        </div>
        <div className="mt-1 border-t border-[var(--candle-rule)] pt-2">
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
            Mark quest complete
          </p>
          <div className="flex flex-col gap-1.5">
            <select
              className="max-w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1 text-[0.7rem] text-[var(--candle-ink)]"
              value={devCompleteQuestSelection}
              onChange={(e) => setDevCompleteQuestSelection(e.target.value)}
            >
              {sortedQuestsForDev.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.id})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded border border-[var(--candle-wax)]/40 bg-[var(--candle-flame)]/20 px-2 py-1 text-[0.7rem] text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/30"
              onClick={handleDevCompleteQuest}
            >
              Mark selected complete
            </button>
          </div>
        </div>
        <p className="mt-1 text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
          Day pacing & unlock-all: Character tab …
        </p>
      </div>
    );
  }, [
    showHeaderDevTools,
    handleDevCheckpoint,
    handleDevCompleteQuest,
    sortedQuestsForDev,
    devCompleteQuestSelection,
  ]);

  const walletCopper = useMemo(() => getCopperFromModifiers(questState.modifiers), [questState.modifiers]);
  const merchantItemCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of MERCHANT_TRADE_GOODS) {
      m[g.itemKey] = questState.modifiers[g.itemKey] ?? 0;
    }
    return m;
  }, [questState.modifiers]);
  const questContext = useMemo(() => getQuestContext(questState, dayCounter), [questState, dayCounter]);
  const visibleQuests = useMemo(
    () => getQuestListForUi(allQuests, questContext, questState.unveiledQuestIds, devUnlockAllQuests),
    [questContext, questState.unveiledQuestIds, devUnlockAllQuests]
  );
  /** Incomplete visible quests keep the New badge until completed. */
  const newQuestIds = useMemo(
    () => visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id)).map((quest) => quest.id),
    [visibleQuests, completedQuestIds]
  );
  const activeQuest = questState.activeQuestId ? questById[questState.activeQuestId] : null;
  const activeStep = activeQuest ? getCurrentStep(questState, activeQuest) : null;
  const activeQuestTranscript = useMemo((): DialogueLogEntry[] => {
    if (!activeQuest) return [];
    return questState.dialogueLog.filter(
      (e) =>
        e.sourceQuestId === activeQuest.id &&
        e.speaker !== QUEST_IMAGE_SPEAKER &&
        e.speaker !== QUEST_VISUAL_SPEAKER &&
        e.speaker !== QUEST_DIVIDER_SPEAKER
    );
  }, [questState.dialogueLog, activeQuest]);
  const visibleLocationActions = (locationActions[questState.currentLocation] ?? []).filter(
    (action) => !HIDDEN_LOCATION_ACTIONS.has(action)
  );
  const chronicleDateTimeFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    []
  );
  const playDialogueLines = useMemo(() => {
    const filtered = questState.dialogueLog.filter((line) => !line.sourceQuestId);
    return filtered.slice(-PLAY_DIALOGUE_RECENT_MAX);
  }, [questState.dialogueLog]);
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
        activeStep?.id ?? '',
        activeStep?.type ?? '',
        activeQuestTranscript.length,
        questPopupQuestId ?? '',
        playFeedSegments.length,
        playJournalLines.length,
      ].join('|'),
    [
      playDialogueLines.length,
      questState.worldEventLog.length,
      questState.journalLog.length,
      visibleQuests.length,
      activeQuest?.id,
      activeStep?.id,
      activeStep?.type,
      activeQuestTranscript.length,
      questPopupQuestId,
      playFeedSegments.length,
      playJournalLines.length,
    ]
  );

  /** Pin play feed to the latest dialogue + quest options whenever new lines or choices appear. */
  useLayoutEffect(() => {
    if (activeTab !== 'play') return;
    dialoguePinnedRef.current = true;
    playDialogueSnapInitialRef.current = true;
    snapPlayDialogueBottom();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (activeTabRef.current !== 'play') return;
        snapPlayDialogueBottom();
      });
    });
  }, [
    activeTab,
    activeQuestTranscript.length,
    activeStep?.id,
    activeStep?.type,
    questPopupQuestId,
    snapPlayDialogueBottom,
  ]);
  const characterNameLabel = useMemo(() => {
    const trimmed = questState.playerName.trim();
    return trimmed.length > 0 ? trimmed : 'Stranger';
  }, [questState.playerName]);
  const handleJobsSwitch = useCallback(
    (jobSlug: string) => {
      setQuestState((prev) => {
        const next = switchActiveJob(prev, jobSlug);
        if (!next) return prev;
        void persistQuestCheckpoint(next);
        return next;
      });
    },
    [setQuestState, persistQuestCheckpoint]
  );

  const handleReturnToForest = useCallback(() => {
    handleTravelLocationSelect('Forest');
    setActiveTab('play');
  }, [handleTravelLocationSelect]);

  const locationIndicatorClass =
    questState.currentLocation === 'Forest'
      ? 'location-indicator-forest'
      : questState.currentLocation === 'Silver Lake'
        ? 'location-indicator-silver-lake'
        : questState.currentLocation === 'Merchant'
          ? 'location-indicator-merchant'
          : questState.currentLocation === 'Village'
            ? 'location-indicator-village'
            : questState.currentLocation === 'Cemetery' ||
                questState.currentLocation === 'Quarry' ||
                questState.currentLocation === 'Mine'
              ? 'location-indicator-forest'
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

  // One-shot catch-up: unveils the next main-saga step when an older save already completed the prior step.
  const unveilBackfillDoneRef = useRef(false);
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || unveilBackfillDoneRef.current || showEarlyDevResetGate) return;
    const hasProgress = Object.keys(questState.progressByQuestId).length > 0;
    if (!hasProgress) {
      unveilBackfillDoneRef.current = true;
      return;
    }
    const completed = getCompletedQuestIds(questState);
    const catchUp = [
      ...catchUpSagaUnveilIds(questState.unveiledQuestIds, completed, questContext),
      ...(() => {
        const village = catchUpVillageUnveilId(questState.unveiledQuestIds, completed, questContext);
        return village ? [village] : [];
      })(),
    ];
    unveilBackfillDoneRef.current = true;
    if (catchUp.length === 0) return;
    const merged = Array.from(new Set([...questState.unveiledQuestIds, ...catchUp]));
    if (merged.length === questState.unveiledQuestIds.length) return;
    const next = { ...questState, unveiledQuestIds: merged };
    setQuestState(next);
    void persistQuestCheckpoint(next);
  }, [
    isQuestStateHydrated,
    isPacingResolved,
    questState,
    questContext,
    persistQuestCheckpoint,
    setQuestState,
    showEarlyDevResetGate,
  ]);

  // Village saves: ensure day-pacing flag + hub location; anchor daily XP when pacing first activates.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;
    setQuestState((prev) => {
      const next = reconcileVillagePhaseState(prev, dayCounter);
      if (
        next.flags === prev.flags &&
        next.currentLocation === prev.currentLocation &&
        next.lastDailyXpDay === prev.lastDailyXpDay
      ) {
        return prev;
      }
      void persistQuestCheckpoint(next);
      return next;
    });
  }, [
    isQuestStateHydrated,
    isPacingResolved,
    dayCounter,
    showEarlyDevResetGate,
    persistQuestCheckpoint,
    setQuestState,
  ]);

  // Catch-up on login/session: when the in-game day advances vs last grant, apply XP/report/flags.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;

    const qc = questState.characterCreationDateEastern;
    const pacingAligned =
      creationDateEastern === null ? qc === null : qc === creationDateEastern;
    if (!pacingAligned) return;

    if (!isDayPacingActive(questState.flags)) return;

    if (dayCounter <= questState.lastDailyXpDay) return;

    const daysToGrant = dayCounter - questState.lastDailyXpDay;
    const xpToGrant = daysToGrant * DAILY_XP;
    const skillGrants = distributeDailySkillXp(xpToGrant, 'exploring');
    const nextSkills = { ...questState.skills };
    for (const key of SKILL_XP_KEYS) {
      nextSkills[key] = questState.skills[key] + (skillGrants[key] ?? 0);
    }
    let updatedState = {
      ...questState,
      experience: questState.experience + xpToGrant,
      skills: nextSkills,
      lastDailyXpDay: dayCounter,
    };
    const activeJob = updatedState.activeJobSlug ? getJobDefinition(updatedState.activeJobSlug) : undefined;
    if (activeJob && daysToGrant > 0) {
      const nextResources = { ...(updatedState.resources ?? {}) };
      for (const [resourceKey, amountPerDay] of Object.entries(activeJob.dailyYields)) {
        if (!amountPerDay || amountPerDay <= 0) continue;
        nextResources[resourceKey] = (nextResources[resourceKey] ?? 0) + amountPerDay * daysToGrant;
      }
      updatedState.resources = nextResources;
    }
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

    if (isDayPacingActive(updatedState.flags)) {
      const ctxAfterDay = getQuestContext({ ...updatedState }, dayCounter);
      const completedIdsAfter = getCompletedQuestIds(updatedState);
      const sideUnveilCatchup = pickNextSideQuestToUnveilOnDayRoll(
        updatedState.unveiledQuestIds,
        completedIdsAfter,
        ctxAfterDay
      );
      if (sideUnveilCatchup) {
        updatedState.unveiledQuestIds = Array.from(
          new Set([...updatedState.unveiledQuestIds, sideUnveilCatchup])
        );
      }
    }

    const wolfGrant = applyWolfHideDailyGrants(updatedState, dayCounter);
    updatedState = wolfGrant.state;
    if (wolfGrant.lines.length > 0) {
      updatedState.worldEventLog = appendUniqueWorldEntries(updatedState.worldEventLog, wolfGrant.lines);
    }

    const reportLines = buildDayReportDialogueLines(dayCounter - 1, questState, updatedState);
    updatedState.dialogueLog = [...updatedState.dialogueLog, ...reportLines];
    updatedState.worldEventLog = appendUniqueWorldEntries(updatedState.worldEventLog, [
      `Day ${dayCounter} began.`,
    ]);

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
        worldEventLog: appendUniqueWorldEntries(started.worldEventLog, [`Day ${dayCounter} began.`]),
        dialogueLog: [
          ...visualDialogueEntriesForQuestStep(quest, quest.startStepId),
          appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, openingText, { sourceQuestId: quest.id }),
        ],
      };
    });
  }, [canShowGame, dayCounter, questState.activeQuestId, questState.dialogueLog.length, setQuestState]);

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
          appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, openingText, { sourceQuestId: quest.id }),
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

      const nextState = applyChoice(prev, activeQuest, choiceId, dayCounter);
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
        const narr = interpolateStepText(nextStep.text, nextState.playerName);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(NARRATOR_RESPONSE_SPEAKER, narr, qOpts));
        }
      } else if (
        nextStep.type !== 'input' &&
        !nextState.progressByQuestId[activeQuest.id]?.isCompleted
      ) {
        const narr = interpolateStepText(nextStep.text, nextState.playerName);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, narr, qOpts));
        }
      }
      const wasCompleted = Boolean(prev.progressByQuestId[activeQuest.id]?.isCompleted);
      const isCompleted = Boolean(nextState.progressByQuestId[activeQuest.id]?.isCompleted);
      if (!wasCompleted && isCompleted) {
        nextLog.push(appendDialogue(QUEST_DIVIDER_SPEAKER, '', qOpts));
      }

      let merged: QuestState = {
        ...nextState,
        dialogueLog: nextLog,
        worldEventLog: nextState.worldEventLog,
      };
      merged = mergeJournalRecapOnQuestComplete(prev, merged, activeQuest);
      merged = applyMainDailyQuestCompletionIfNeeded(prev, merged, activeQuest, dayCounter);
      if (!wasCompleted && isCompleted) {
        merged = mergeDiscoveryUnveils(merged, activeQuest.id, dayCounter);
      }
      return merged;
    });
  };

  const handleAdvanceQuestMessage = () => {
    if (!activeQuest) return;
    setQuestState((prev) => {
      const currentStep = getCurrentStep(prev, activeQuest);
      if (currentStep.type !== 'message') return prev;
      const advanced = advanceQuestMessage(prev, activeQuest);
      if (!advanced) return prev;
      const nextStep = getCurrentStep(advanced, activeQuest);
      const qOpts = { sourceQuestId: activeQuest.id };
      const nextLog = [
        ...advanced.dialogueLog,
        ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
      ];

      if (nextStep.type === 'message') {
        const narr = interpolateStepText(nextStep.text, advanced.playerName);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(NARRATOR_RESPONSE_SPEAKER, narr, qOpts));
        }
      } else if (
        nextStep.type !== 'input' &&
        !advanced.progressByQuestId[activeQuest.id]?.isCompleted
      ) {
        const narr = interpolateStepText(nextStep.text, advanced.playerName);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, narr, qOpts));
        }
      }
      const wasCompleted = Boolean(prev.progressByQuestId[activeQuest.id]?.isCompleted);
      const isCompleted = Boolean(advanced.progressByQuestId[activeQuest.id]?.isCompleted);
      if (!wasCompleted && isCompleted) {
        nextLog.push(appendDialogue(QUEST_DIVIDER_SPEAKER, '', qOpts));
      }

      let merged: QuestState = {
        ...advanced,
        dialogueLog: nextLog,
        worldEventLog: advanced.worldEventLog,
      };
      merged = mergeJournalRecapOnQuestComplete(prev, merged, activeQuest);
      merged = applyMainDailyQuestCompletionIfNeeded(prev, merged, activeQuest, dayCounter);
      if (!wasCompleted && isCompleted) {
        merged = mergeDiscoveryUnveils(merged, activeQuest.id, dayCounter);
      }
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

    if (activeQuest.id === QUEST_ORIGIN_ID) {
      const creationYmd = formatInTimeZone(Date.now(), EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
      const characterCreationDateEastern = nextState.characterCreationDateEastern ?? creationYmd;
      const priorOriginProg = nextState.progressByQuestId[QUEST_ORIGIN_ID];
      const originProgress = priorOriginProg ?? {
        currentStepId: 'four',
        isCompleted: false,
        choiceHistory: [] as string[],
      };
      const nameRecap =
        "You find yourself in a forest.  You can't remember anything, except...\n\n...your name is {playerName}.";
      const narrated = interpolateStepText(
        `${nameRecap}\n\nYou steady your breathing. Whatever comes next, you will meet it as yourself.`,
        nextState.playerName
      );

      const updatedState: QuestState = {
        ...nextState,
        characterCreationDateEastern,
        characterCreatedAtAppVersion: APP_VERSION,
        flags: Array.from(new Set([...nextState.flags, QUEST001_NAMED_FLAG])),
        activeQuestId: null,
        unveiledQuestIds: nextState.unveiledQuestIds,
        progressByQuestId: {
          ...nextState.progressByQuestId,
          [QUEST_ORIGIN_ID]: {
            ...originProgress,
            isCompleted: true,
            currentStepId: activeQuest.startStepId,
            choiceHistory: originProgress.choiceHistory ?? [],
          },
        },
        dialogueLog: [
          ...nextState.dialogueLog,
          ...visualDialogueEntriesForQuestStep(activeQuest, 'four'),
          appendDialogue(NARRATOR_RESPONSE_SPEAKER, narrated, {
            sourceQuestId: activeQuest.id,
          }),
        ],
      };
      let withJournal = mergeJournalRecapOnQuestComplete(questState, updatedState, activeQuest);
      withJournal = mergeDiscoveryUnveils(withJournal, QUEST_ORIGIN_ID, dayCounter);
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
    dialogueInstantScrollRef.current = true;
    handleStartQuest(questId);
    setActiveTab('play');
  };

  const handleOpenQuestPopup = (questId: string) => {
    if (questId === 'quest-001-origin' && !questState.flags.includes(ORIGIN_QUEST_OPENED_FLAG)) {
      const nextFlags = [...questState.flags, ORIGIN_QUEST_OPENED_FLAG];
      const nextState = { ...questState, flags: nextFlags };
      setQuestState(nextState);
      void persistQuestCheckpoint(nextState);
    }
    if (questState.activeQuestId !== questId) {
      handleTrackQuest(questId);
    } else {
      setActiveTab('play');
    }
    setQuestPopupQuestId(questId);
  };

  const handleCloseQuestPopup = () => {
    setQuestPopupQuestId(null);
  };

  const handleAcknowledgeQuest = (_questId: string) => {};

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
          appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, openingText, { sourceQuestId: quest.id }),
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
        if (questState.currentLocation === 'Village') {
          return (
            <VillagePlaySurface
              dayCounter={dayCounter}
              characterNameLabel={characterNameLabel}
              onOpenArena={() => setArenaOpen(true)}
              onOpenGuildAlley={() => setGuildAlleyOpen(true)}
              onOpenTavern={() => setTavernOpen(true)}
              onOpenMarket={() => setMarketOpen(true)}
              onOpenMayorsHut={() => setMayorsHutOpen(true)}
              onOpenCraftersCorner={() => setCraftersCornerOpen(true)}
              onOpenJobsHall={() => setJobsHallOpen(true)}
              onOpenVillageProjects={() => setVillageProjectsOpen(true)}
              onReturnToForest={handleReturnToForest}
            />
          );
        }
        return (
          <PlayTab
            playFeedSegments={playFeedSegments}
            playJournalLines={playJournalLines}
            newQuestIds={newQuestIds}
            questTitleById={questTitleById}
            questById={questById}
            visibleQuests={visibleQuests}
            completedQuestIds={completedQuestIds}
            onOpenQuestPopup={handleOpenQuestPopup}
            onCloseQuestPopup={handleCloseQuestPopup}
            questPopupQuestId={questPopupQuestId}
            onAcknowledgeQuest={handleAcknowledgeQuest}
            activeQuest={activeQuest ?? null}
            activeStep={activeStep ?? null}
            nameInput={nameInput}
            onNameInputChange={setNameInput}
            nameInputError={nameInputError}
            onStepChoice={handleStepChoice}
            onNameSubmit={handleNameSubmit}
            onAdvanceQuestMessage={handleAdvanceQuestMessage}
            dialogueScrollRef={dialogueScrollRef}
            onDialogueScroll={handleDialogueScroll}
            visibleLocationActions={visibleLocationActions}
            showOriginStartHint={showOriginStartHint}
            committedPlayerName={questState.playerName}
            onLocationAction={handleLocationSceneAction}
            playerFlags={questState.flags}
            playerModifiers={questState.modifiers}
            activeQuestTranscript={activeQuestTranscript}
            useQuestPopupFallback={useQuestPopupFallback}
            onQuestChoiceVisualPhase={handleQuestChoiceVisualPhase}
            onSnapPlayFeedBottom={snapPlayDialogueBottom}
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
        {!hasShownGameOnce && !isQuestStateHydrated ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-0 text-center">
            <p className="font-serif text-lg text-[var(--candle-ink-soft)]">Loading your ledger…</p>
            <p className="max-w-xs font-serif text-sm text-[var(--candle-ink-faint)]">
              Syncing character state so dates and quests stay matched to this account.
            </p>
          </div>
        ) : showEarlyDevResetGate ? (
          <EarlyDevCharacterResetGate onOkay={handleMandatoryEarlyDevReset} />
        ) : !isPacingResolved && !hasShownGameOnce ? (
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
          dayPacingActive={questContext.dayPacingActive}
          currentLocation={questState.currentLocation}
          formatLocationLabel={formatLocationLabel}
          locationIndicatorClass={locationIndicatorClass}
          travelLocations={travelLocations}
          onTravelLocationSelect={handleTravelLocationSelect}
          showHeaderDevTools={showHeaderDevTools}
          devToolsPanel={headerDevPanel}
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
    {canShowGame ? (
      <>
        <CarlDoorNpcPanel
          open={
            questPopupQuestId === QUEST_004_B_THE_DOOR_ID &&
            activeStep?.id === QUEST_004_B_CARL_HUB_STEP_ID
          }
          onOpenChange={(next) => {
            if (!next) handleCloseQuestPopup();
          }}
          onFarewell={() => handleStepChoice('carl-farewell')}
        />
        <MerchantPanel
          open={questState.currentLocation === 'Merchant'}
          onOpenChange={handleMerchantDialogOpenChange}
          walletCopper={walletCopper}
          itemCounts={merchantItemCounts}
          onApplyModifiers={handleMerchantApplyModifiers}
        />
        <ArenaPanel
          open={arenaOpen}
          onOpenChange={setArenaOpen}
          questState={questState}
          myPubkey={user?.pubkey}
          tournament={arenaTournament}
        />
        <GuildAlleyPanel
          open={guildAlleyOpen}
          onOpenChange={setGuildAlleyOpen}
          myPubkey={user?.pubkey}
          guildAlley={guildAlley}
        />
        <TavernPanel
          open={tavernOpen}
          onOpenChange={setTavernOpen}
          questState={questState}
          myPubkey={user?.pubkey}
          tavern={tavern}
        />
        <MarketPanel
          open={marketOpen}
          onOpenChange={setMarketOpen}
          questState={questState}
          myPubkey={user?.pubkey}
          market={market}
          onApplyModifiers={handleMerchantApplyModifiers}
        />
        <CraftersCornerPanel
          open={craftersCornerOpen}
          onOpenChange={setCraftersCornerOpen}
          questState={questState}
          onApplyModifiers={handleMerchantApplyModifiers}
        />
        <MayorsHutPanel
          open={mayorsHutOpen}
          onOpenChange={setMayorsHutOpen}
          myPubkey={user?.pubkey}
          mayorsHut={mayorsHut}
        />
        <JobsHallPanel
          open={jobsHallOpen}
          onOpenChange={setJobsHallOpen}
          questState={questState}
          onSwitchJob={handleJobsSwitch}
        />
        <VillageProjectsPanel
          open={villageProjectsOpen}
          onOpenChange={setVillageProjectsOpen}
          questState={questState}
          villageProjects={villageProjects}
        />
      </>
    ) : null}
    </>
  );
}
