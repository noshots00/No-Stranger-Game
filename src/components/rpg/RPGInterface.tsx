import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useToast } from '@/hooks/useToast';
import {
  advanceQuestMessage,
  collectContinueBridgeChainTexts,
  applyChoice,
  applyDirectModifiersDelta,
  ensureQuestProgress,
  getCompletedQuestIds,
  getCurrentStep,
  getQuestContext,
  getQuestListForUi,
  interpolateStepText,
  isDayPacingActive,
  isVillagePhase,
  markQuestCompleted,
  offerNextTrackedForestQuest,
  resolveDisplayDay,
  shouldShowDayInHeader,
  catchUpVillageQuestAfterTheDoor,
  introduceVillageQuestAfterTheDoor,
  introduceMayorQuestAfterPickJob,
  reconcileVillagePhaseState,
  restartQuestProgress,
  resumeLocationQuestAtStep,
  startQuest,
  submitPlayerName,
  submitQuestInventoryPick,
} from '@/components/rpg/quests/engine';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import {
  catchUpManualSagaUnveilIds,
  catchUpMayorQuestUnveilId,
  catchUpPickJobQuestUnveilId,
  catchUpSagaUnveilIds,
  catchUpVillageUnveilId,
  computeNextUnveilIdsAfterCompletion,
} from '@/components/rpg/quests/quest-saga';
import { mergeJournalRecapOnQuestComplete } from '@/components/rpg/quests/journalSummary';
import type { ModifierMap, QuestDefinition, QuestState } from '@/components/rpg/quests/types';
import {
  APP_VERSION,
  CHARACTER_CREATION_DATE_STORAGE_KEY,
  CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY,
  characterCreationDateStorageKeyForPubkey,
  DAY_IN_MS,
  DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY,
  DEV_SHOW_QUEST_CHOICE_EFFECTS_STORAGE_KEY,
  DEV_RELAY_STATUS_OVERLAY_STORAGE_KEY,
  DEV_USE_QUEST_POPUP_STORAGE_KEY,
  DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY,
  HIDDEN_LOCATION_ACTIONS,
  locationActions,
  QUEST001_NAMED_FLAG,
  QUEST_ORIGIN_ID,
  QUEST_DYERS_CRYPT_ID,
  QUEST_003B_MEET_MERCHANT_ID,
  QUEST_004_B_THE_DOOR_ID,
  QUEST_VILLAGE_ARRIVAL_ID,
  QUEST_PICK_A_JOB_ID,
  QUEST_MAYOR_ID,
  JOB_SLUG_EXPLORER,
  ORIGIN_QUEST_OPENED_FLAG,
  SILVER_LAKE_SCENE_ACTION_QUEST,
  PLAY_DIALOGUE_RECENT_MAX,
  PLAY_JOURNAL_RECENT_MAX,
  PLAY_WORLD_RECENT_MAX,
  LOCATION_LABEL_DISPLAY,
  FOREST_PARENT_LOCATION,
  ANCIENT_CEMETERY_LOCATION,
  OLD_WELL_LOCATION,
  QUEST_002B_WELL_HUB_STEP_ID,
  QUEST_002B_WELL_OPENED_FLAG,
  QUEST_002B_WILL_I_STARVE_ID,
  thrownItemLabelFromFlags,
  DISCOVERED_CEMETERY_FLAG,
  DISCOVERED_MINE_FLAG,
  DISCOVERED_QUARRY_FLAG,
  VILLAGE_PHASE_FLAG,
  WORLD_EVENT_PRINTS_ENABLED,
} from './constants';
import type { MobileTab } from './constants';
import {
  applyCalendarDayCatchUp,
  applyInSessionDayAdvanceAfterMainQuest,
  isForestAutoTrackBlockedByDayRoll,
  reconcileForestSessionDay,
  stageInSessionDayAdvanceAfterMainQuest,
} from './dayPacing';
import { applyQuestLevelMilestoneIfNeeded } from './dayMilestones';
import {
  dialogueLinesForPlayFeed,
  journalLinesForPlayFeed,
  isPlayDayMarkerText,
  worldLinesForPlayFeed,
} from './playLedgerSchema';
import { appendDialogue, appendUniqueWorldEntries, getCopperFromModifiers } from './helpers';
import { createPlayFeedScrollController } from './playFeedScroll';
import {
  dialogueHasQuestOpeningAtEnd,
  formatPlayerChoiceDialogueLine,
  groupChronicleRows,
  mergeDialogueAndWorldRows,
  mergePlayFeedRows,
  NARRATOR_RESPONSE_SPEAKER,
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
  QUEST_NARRATOR_PROMPT_SPEAKER,
  visualDialogueEntriesForQuestStep,
} from './dialogueFormat';
import type { ChronicleMergedRow } from './dialogueFormat';
import { useQuestState } from './hooks/useQuestState';
import { useDayCounter } from './hooks/useDayCounter';
import { useSocialQueries } from './hooks/useSocialQueries';
import { useGameRelayHealth } from '@/hooks/useGameRelayHealth';
import { GameRelayStatusOverlay } from './dev/GameRelayStatusOverlay';
import { QuestCheckpointRestoreDialog } from './dev/QuestCheckpointRestoreDialog';
import { questCheckpointDisplayDay, type QuestCheckpointRecord } from './gameProfile';
import {
  devResetQuestById,
  devRestartFromQuest,
  MAIN_B_ARC_QUEST_IDS,
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
import {
  applyTravelLocationChange,
  headerDisplayLocation,
  travelMenuHighlightLocation,
} from './locationPresence';
import {
  acknowledgeAncientCemeteryTravelDiscovery,
  acknowledgeOldWellTravelDiscovery,
  acknowledgeTravelLocation,
  buildForestTravelMenuItems,
  forestTravelNotificationsPending,
  hasAcknowledgedTravelLocation,
  type TravelMenuItem,
} from './travelLocations';
import { EarlyDevCharacterResetGate } from './EarlyDevCharacterResetGate';
import { GamePortraitViewport } from './GamePortraitViewport';
import { MerchantPanel } from './merchant/MerchantPanel';
import { MERCHANT_TRADE_GOODS } from './merchant/merchantEconomy';
import { ArenaPanel } from './arena/ArenaPanel';
import { useArenaTournament } from './arena/useArenaTournament';
import { useArenaSyncPersonalRecord } from './arena/useArenaSyncPersonalRecord';
import { BlobbiFightingPanel } from './blobbiFighting/BlobbiFightingPanel';
import { useBlobbiFight } from './blobbiFighting/useBlobbiFight';
import { useBlobbiSyncFightMemories } from './blobbiFighting/useBlobbiSyncFightMemories';
import { usePlayerBlobbis } from './blobbiFighting/usePlayerBlobbis';
import { useGuildAlley } from './guild/useGuildAlley';
import { TavernPanel } from './tavern/TavernPanel';
import { useTavern } from './tavern/useTavern';
import { MarketPanel } from './market/MarketPanel';
import { useMarket } from './market/useMarket';
import { useMayorsHut } from './mayorsHut/useMayorsHut';
import { switchActiveJob } from './jobs/applyJobAction';
import { getJobDefinition } from './jobs/registry';
import { getVillageJournalQuests } from './village/villageJournal';
import { TownHallPanel } from './village/townHall/TownHallPanel';
import { useVillageProjects } from './villageProjects/useVillageProjects';
import { CraftersCornerPanel } from './crafter/CraftersCornerPanel';

/**
 * Session guard for ledger loading overlay.
 * Keeps "Loading your ledger…" from reappearing on transient remounts.
 */
let hasShownGameOnceInSession = false;

/** localStorage `nsg:dev-header-tools=1` enables header dev tools in production builds. */
const DEV_HEADER_TOOLS_STORAGE_KEY = 'nsg:dev-header-tools';

/** Main daily quest complete: `quest001-complete`, in-session day roll (report + next day marker). */
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
  const withFlags = { ...merged, flags };
  if (isVillagePhase(withFlags.flags) && !isDayPacingActive(withFlags.flags)) {
    return withFlags;
  }
  const sessionOnly = !isVillagePhase(withFlags.flags);
  const rollCalendarDay = sessionOnly ? Math.max(1, prev.lastDailyXpDay) : calendarDay;
  if (sessionOnly) {
    return stageInSessionDayAdvanceAfterMainQuest(prev, withFlags, rollCalendarDay, quest.id, true);
  }
  return applyInSessionDayAdvanceAfterMainQuest(prev, withFlags, rollCalendarDay, sessionOnly);
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
  const withUnveils =
    add.length === 0
      ? merged
      : {
          ...merged,
          unveiledQuestIds: Array.from(new Set([...merged.unveiledQuestIds, ...add])),
        };
  const displayDay = resolveDisplayDay(withUnveils, calendarDay);
  let next = offerNextTrackedForestQuest(withUnveils, getQuestContext(withUnveils, displayDay));
  if (add.includes(QUEST_VILLAGE_ARRIVAL_ID)) {
    next = introduceVillageQuestAfterTheDoor(next);
  }
  if (add.includes(QUEST_MAYOR_ID)) {
    next = introduceMayorQuestAfterPickJob(next);
  }
  return next;
}

function notifyVillageQuestAvailable(toast: ReturnType<typeof useToast>['toast']) {
  toast({
    title: 'New quest',
    description: 'The Village — open it from your quest list.',
  });
}

function finishMayorQuestIfInProgress(
  prev: QuestState,
  state: QuestState,
  dayCounter: number
): QuestState | null {
  const mayorQuest = questById[QUEST_MAYOR_ID];
  if (!mayorQuest) return null;
  const mayorProg = state.progressByQuestId[QUEST_MAYOR_ID];
  if (!mayorProg || mayorProg.isCompleted) return null;

  const marked = markQuestCompleted(state, QUEST_MAYOR_ID);
  if (!marked) return null;

  let merged: QuestState = {
    ...marked,
    worldEventLog: appendUniqueWorldEntries(marked.worldEventLog, [
      'You cast your vote for village mayor.',
    ]),
  };
  merged = mergeJournalRecapOnQuestComplete(prev, merged, mayorQuest);
  merged = applyQuestLevelMilestoneIfNeeded(prev, merged, QUEST_MAYOR_ID);
  merged = mergeDiscoveryUnveils(merged, QUEST_MAYOR_ID, resolveDisplayDay(merged, dayCounter));
  return merged;
}

function revertMayorQuestAfterVoteRetracted(state: QuestState): QuestState | null {
  const prog = state.progressByQuestId[QUEST_MAYOR_ID];
  if (!prog?.isCompleted) return null;

  return {
    ...state,
    activeQuestId: QUEST_MAYOR_ID,
    progressByQuestId: {
      ...state.progressByQuestId,
      [QUEST_MAYOR_ID]: {
        ...prog,
        isCompleted: false,
        currentStepId: 'await-vote',
      },
    },
  };
}

export function RPGInterface() {
  const { toast } = useToast();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { logout } = useLoginActions();
  const navigate = useNavigate();

  const { questState, setQuestState, isQuestStateHydrated, persistQuestCheckpoint, resetQuestStateAndSync, restoreQuestCheckpoint } =
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
  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [nameInput, setNameInput] = useState('');
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [playSceneQuestId, setPlaySceneQuestId] = useState<string | null>(null);
  const [showModifierDetails, setShowModifierDetails] = useState(false);
  const [showQuestChoiceEffects, setShowQuestChoiceEffects] = useState(false);
  const [devUnlockAllQuests, setDevUnlockAllQuests] = useState(false);
  const [useQuestPopupFallback, setUseQuestPopupFallback] = useState(false);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [blobbiFightingOpen, setBlobbiFightingOpen] = useState(false);
  const [tavernOpen, setTavernOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [craftersCornerOpen, setCraftersCornerOpen] = useState(false);
  const [townHallOpen, setTownHallOpen] = useState(false);
  const [hasShownGameOnce, setHasShownGameOnce] = useState(() => hasShownGameOnceInSession);

  const socialQueriesEnabled = activeTab === 'social' && canShowGame;
  const { socialStats, socialActivityQuery, socialKindredSignalsQuery, lobbyNameMap } = useSocialQueries({
    enabled: socialQueriesEnabled,
  });

  const arenaTournament = useArenaTournament({
    enabled: arenaOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
  });

  const playerBlobbis = usePlayerBlobbis({
    enabled: blobbiFightingOpen && canShowGame,
    pubkey: user?.pubkey,
  });

  const blobbiFight = useBlobbiFight({
    enabled: blobbiFightingOpen && canShowGame && Boolean(user?.pubkey),
    myPubkey: user?.pubkey,
    ownerName: questState.playerName,
  });

  useBlobbiSyncFightMemories({
    enabled: blobbiFightingOpen && canShowGame && Boolean(user?.pubkey),
    matches: blobbiFight.feed.matches,
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
    const raw = localStorage.getItem(DEV_SHOW_QUEST_CHOICE_EFFECTS_STORAGE_KEY);
    if (raw === '1') setShowQuestChoiceEffects(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY, showModifierDetails ? '1' : '0');
  }, [showModifierDetails]);

  useEffect(() => {
    localStorage.setItem(DEV_SHOW_QUEST_CHOICE_EFFECTS_STORAGE_KEY, showQuestChoiceEffects ? '1' : '0');
  }, [showQuestChoiceEffects]);

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
    if (!playSceneQuestId) return;
    const completed = getCompletedQuestIds(questState);
    if (!completed.includes(playSceneQuestId)) return;
    const quest = questById[playSceneQuestId];
    if (quest?.locationRepeats) return;
    setPlaySceneQuestId(null);
  }, [playSceneQuestId, questState]);

  useEffect(() => {
    if (canShowGame && !hasShownGameOnce) {
      hasShownGameOnceInSession = true;
      setHasShownGameOnce(true);
    }
  }, [canShowGame, hasShownGameOnce]);

  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  const playFeedScroll = useMemo(() => createPlayFeedScrollController(), []);
  const prevPlayTabRef = useRef(false);
  const completedQuestCountRef = useRef(0);
  const activeTabRef = useRef<MobileTab>(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => () => playFeedScroll.dispose(), [playFeedScroll]);

  const handleDialogueScroll = useCallback(() => {
    playFeedScroll.updatePinnedFromScroll();
  }, [playFeedScroll]);

  const completedQuestIds = useMemo(() => getCompletedQuestIds(questState), [questState]);
  const merchantTravelUnlocked = completedQuestIds.includes(QUEST_003B_MEET_MERCHANT_ID);
  const formatLocationLabel = useCallback((loc: string) => LOCATION_LABEL_DISPLAY[loc] ?? loc, []);
  const forestTravelPings = useMemo(
    () => forestTravelNotificationsPending(questState),
    [questState]
  );
  const travelMenuItems = useMemo(() => {
    const villageEndgame = questState.flags.includes(VILLAGE_PHASE_FLAG);
    if (villageEndgame) {
      const out: TravelMenuItem[] = [];
      const add = (locationId: string, showNew = false) => {
        if (!out.some((item) => item.locationId === locationId)) {
          out.push({ locationId, label: formatLocationLabel(locationId), showNew });
        }
      };
      add('Village', !hasAcknowledgedTravelLocation(questState, 'Village'));
      add('Forest');
      if (questState.flags.includes(DISCOVERED_CEMETERY_FLAG)) add('Cemetery');
      if (questState.flags.includes(DISCOVERED_QUARRY_FLAG)) add('Quarry');
      if (questState.flags.includes(DISCOVERED_MINE_FLAG)) add('Mine');
      if (merchantTravelUnlocked) add('Merchant');
      const cur = questState.currentLocation;
      if (cur) add(cur);
      return out;
    }
    const items: TravelMenuItem[] = [
      { locationId: FOREST_PARENT_LOCATION, label: formatLocationLabel(FOREST_PARENT_LOCATION) },
      ...buildForestTravelMenuItems(formatLocationLabel, questState),
    ];
    if (merchantTravelUnlocked) {
      items.push({ locationId: 'Merchant', label: formatLocationLabel('Merchant') });
    }
    const cur = questState.currentLocation;
    if (
      cur &&
      cur !== FOREST_PARENT_LOCATION &&
      cur !== OLD_WELL_LOCATION &&
      cur !== ANCIENT_CEMETERY_LOCATION &&
      cur !== 'Merchant' &&
      !items.some((item) => item.locationId === cur)
    ) {
      items.push({ locationId: cur, label: formatLocationLabel(cur) });
    }
    return items;
  }, [formatLocationLabel, merchantTravelUnlocked, questState]);
  const locationMenuNotify = useMemo(() => {
    if (questState.flags.includes(VILLAGE_PHASE_FLAG)) {
      return !hasAcknowledgedTravelLocation(questState, 'Village');
    }
    return forestTravelPings.header;
  }, [forestTravelPings.header, questState]);
  const interpolateQuestCopy = useCallback((text: string, state: QuestState) => {
    const thrown = thrownItemLabelFromFlags(state.flags);
    return interpolateStepText(text, state.playerName, thrown ? { thrownItem: thrown } : undefined);
  }, []);

  const handleTravelLocationSelect = useCallback(
    (nextLocation: string) => {
      let shouldOpenWellPopup = false;
      setQuestState((prev) => {
        let next = applyTravelLocationChange(prev, nextLocation);
        next = acknowledgeTravelLocation(next, nextLocation);
        if (nextLocation === ANCIENT_CEMETERY_LOCATION) {
          next = acknowledgeAncientCemeteryTravelDiscovery(next);
        }
        if (nextLocation === OLD_WELL_LOCATION) {
          next = acknowledgeOldWellTravelDiscovery(next);
          const wellQuest = questById[QUEST_002B_WILL_I_STARVE_ID];
          if (wellQuest) {
            const ctx = getQuestContext(next, resolveDisplayDay(next, dayCounter));
            if (devUnlockAllQuests || wellQuest.isAvailable(ctx)) {
              next = ensureQuestProgress(next, wellQuest);
              const hadOpenedBefore = next.flags.includes(QUEST_002B_WELL_OPENED_FLAG);
              if (!hadOpenedBefore) {
                next = { ...next, flags: [...next.flags, QUEST_002B_WELL_OPENED_FLAG] };
              }
              const wellDone = getCompletedQuestIds(next).includes(QUEST_002B_WILL_I_STARVE_ID);
              next =
                wellDone || hadOpenedBefore
                  ? resumeLocationQuestAtStep(next, wellQuest, QUEST_002B_WELL_HUB_STEP_ID)
                  : startQuest(next, wellQuest);
              shouldOpenWellPopup = true;
            }
          }
        }
        if (next !== prev) {
          window.queueMicrotask(() => void persistQuestCheckpoint(next));
        }
        return next;
      });
      if (shouldOpenWellPopup) {
        setActiveTab('play');
      }
    },
    [dayCounter, devUnlockAllQuests, persistQuestCheckpoint, setQuestState]
  );
  const handleMerchantApplyModifiers = useCallback(
    (delta: ModifierMap) => {
      setQuestState((prev) => {
        const next = applyDirectModifiersDelta(prev, delta);
        if (next !== prev) {
          window.queueMicrotask(() => void persistQuestCheckpoint(next));
        }
        return next;
      });
    },
    [setQuestState, persistQuestCheckpoint]
  );

  const guildAlley = useGuildAlley({
    enabled: (townHallOpen || activeTab === 'character') && canShowGame,
    questState,
    myPubkey: user?.pubkey,
    setQuestState,
    persistQuestCheckpoint,
    onApplyModifiers: handleMerchantApplyModifiers,
  });

  const guildDisplayName = useMemo(() => {
    const membership = questState.guildMembership;
    if (membership && membership.leftAtMs === undefined) {
      const fromState = membership.guildName.trim();
      if (fromState) return fromState;
    }
    const slug = guildAlley.myActiveMembershipSlug;
    if (!slug) return null;
    return guildAlley.feed.guilds.find((g) => g.slug === slug)?.name ?? null;
  }, [questState.guildMembership, guildAlley.myActiveMembershipSlug, guildAlley.feed.guilds]);

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
    enabled: townHallOpen && canShowGame,
    questState,
    myPubkey: user?.pubkey,
  });

  const villageProjects = useVillageProjects({
    enabled: townHallOpen && canShowGame,
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
  const [showRelayStatusOverlay, setShowRelayStatusOverlay] = useState(false);
  const [checkpointRestoreOpen, setCheckpointRestoreOpen] = useState(false);
  const [restoringCheckpointEventId, setRestoringCheckpointEventId] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (localStorage.getItem(DEV_HEADER_TOOLS_STORAGE_KEY) === '1') setDevHeaderToolsFromStorage(true);
      if (localStorage.getItem(DEV_RELAY_STATUS_OVERLAY_STORAGE_KEY) === '1') {
        setShowRelayStatusOverlay(true);
      }
    } catch {
      /* private / blocked storage */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(DEV_RELAY_STATUS_OVERLAY_STORAGE_KEY, showRelayStatusOverlay ? '1' : '0');
  }, [showRelayStatusOverlay]);
  const showHeaderDevTools = import.meta.env.DEV || devHeaderToolsFromStorage;
  const showRelayHealthOverlay = showHeaderDevTools && showRelayStatusOverlay;
  const relayHealthQuery = useGameRelayHealth();
  const [devToolsMenuOpen, setDevToolsMenuOpen] = useState(false);

  const orderedQuestsForDev = useMemo(() => {
    const arcOrder = (id: string) => {
      const i = MAIN_B_ARC_QUEST_IDS.indexOf(id as (typeof MAIN_B_ARC_QUEST_IDS)[number]);
      return i < 0 ? 999 : i;
    };
    return [...allQuests].sort(
      (a, b) => arcOrder(a.id) - arcOrder(b.id) || a.title.localeCompare(b.title)
    );
  }, []);
  const [devQuestSelection, setDevQuestSelection] = useState(() => orderedQuestsForDev[0]?.id ?? '');
  useEffect(() => {
    if (orderedQuestsForDev.length === 0) return;
    setDevQuestSelection((cur) =>
      cur && orderedQuestsForDev.some((q) => q.id === cur) ? cur : orderedQuestsForDev[0]!.id
    );
  }, [orderedQuestsForDev]);

  const appendQuestOpeningDialogue = useCallback((state: QuestState, quest: QuestDefinition): QuestState => {
    const firstStep = getCurrentStep(state, quest);
    const openingText = interpolateStepText(firstStep.text, state.playerName);
    if (dialogueHasQuestOpeningAtEnd(state.dialogueLog, quest.title, openingText)) {
      return state;
    }
    return {
      ...state,
      dialogueLog: [
        ...state.dialogueLog,
        ...visualDialogueEntriesForQuestStep(quest, quest.startStepId),
        appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, openingText, { sourceQuestId: quest.id }),
      ],
    };
  }, []);

  const handleDevTestQuest = useCallback(
    (questId: string) => {
      if (!questId) return;
      const quest = questById[questId];
      if (!quest) return;
      setQuestState((prev) => {
        const orderedIds = orderedQuestsForDev.map((q) => q.id);
        let next = devResetQuestById(prev, questId, questById, { orderedQuestIds: orderedIds });
        next = appendQuestOpeningDialogue(next, quest);
        void persistQuestCheckpoint(next);
        return next;
      });
      setPlaySceneQuestId(null);
      setActiveTab('play');
    },
    [appendQuestOpeningDialogue, orderedQuestsForDev, setQuestState, persistQuestCheckpoint]
  );

  const handleDevRestartFromQuest = useCallback(
    (questId: string) => {
      if (!questId) return;
      const quest = questById[questId];
      if (!quest) return;
      const orderedIds = orderedQuestsForDev.map((q) => q.id);
      setQuestState((prev) => {
        let next = devRestartFromQuest(prev, questId, questById, orderedIds);
        next = appendQuestOpeningDialogue(next, quest);
        void persistQuestCheckpoint(next);
        return next;
      });
      setPlaySceneQuestId(questId);
      setActiveTab('play');
      setDevToolsMenuOpen(false);
    },
    [appendQuestOpeningDialogue, orderedQuestsForDev, setQuestState, persistQuestCheckpoint]
  );

  const handleRestoreCheckpoint = useCallback(
    async (record: QuestCheckpointRecord) => {
      setRestoringCheckpointEventId(record.eventId);
      try {
        await restoreQuestCheckpoint(record.state);
        const name = record.state.playerName.trim() || 'Character';
        const day = questCheckpointDisplayDay(record.state);
        toast({
          title: 'Checkpoint restored',
          description: `${name} · Day ${day} is now your active save.`,
        });
        setCheckpointRestoreOpen(false);
        void queryClient.invalidateQueries({ queryKey: ['dev-quest-checkpoints', user?.pubkey] });
      } catch (error) {
        toast({
          title: 'Restore failed',
          description: error instanceof Error ? error.message : 'Could not publish restored save.',
        });
      } finally {
        setRestoringCheckpointEventId(null);
      }
    },
    [restoreQuestCheckpoint, toast, queryClient, user?.pubkey]
  );

  const headerDevPanel = useMemo(() => {
    if (!showHeaderDevTools) return null;
    return (
      <div className="flex flex-col gap-2 font-serif text-xs text-[var(--candle-ink)]">
        <div>
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">Quest</p>
          <div className="flex flex-col gap-1.5">
            <select
              className="max-w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1 text-[0.7rem] text-[var(--candle-ink)]"
              value={devQuestSelection}
              onChange={(e) => setDevQuestSelection(e.target.value)}
            >
              {orderedQuestsForDev.map((q) => (
                <option
                  key={q.id}
                  value={q.id}
                  style={{ color: completedQuestIds.includes(q.id) ? '#111111' : '#8b8b8b' }}
                >
                  {q.title} ({q.id})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                className="rounded border border-amber-500/50 bg-amber-500/15 px-2 py-1.5 text-[0.7rem] font-medium text-[var(--candle-ink)] hover:bg-amber-500/25"
                onClick={() => handleDevRestartFromQuest(devQuestSelection)}
                disabled={!devQuestSelection}
              >
                Restart from
              </button>
              <button
                type="button"
                className="rounded border border-[var(--candle-wax)]/40 bg-[var(--candle-flame)]/20 px-2 py-1.5 text-[0.7rem] font-medium text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/30"
                onClick={() => handleDevTestQuest(devQuestSelection)}
                disabled={!devQuestSelection}
              >
                Test
              </button>
            </div>
            <p className="text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
              Restart from rewinds story progress and modifiers to before this quest (later quests cleared).
              Test replays one quest without clearing later progress.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">Play</p>
          <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--candle-rule)]/60 bg-black/25 px-2 py-1.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={showQuestChoiceEffects}
              onChange={(e) => setShowQuestChoiceEffects(e.target.checked)}
            />
            <span className="text-[0.7rem] leading-snug text-[var(--candle-ink-soft)]">
              Show choice modifiers &amp; flags
              <span className="mt-0.5 block text-[0.6rem] text-[var(--candle-ink-faint)]">
                Lists modifiersDelta, flagsSet, and gating under each quest choice.
              </span>
            </span>
          </label>
        </div>
        <div>
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
            Save
          </p>
          <button
            type="button"
            className="w-full rounded border border-[var(--candle-rule)]/70 bg-black/25 px-2 py-1.5 text-left text-[0.7rem] text-[var(--candle-ink-soft)] hover:bg-black/40 hover:text-[var(--candle-wax)]"
            onClick={() => setCheckpointRestoreOpen(true)}
          >
            Restore kind 10032 checkpoint…
          </button>
          <p className="mt-1 text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
            Lists relay save history for your npub; loading one re-publishes it as the newest checkpoint.
          </p>
        </div>
        <div>
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
            Network
          </p>
          <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--candle-rule)]/60 bg-black/25 px-2 py-1.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={showRelayStatusOverlay}
              onChange={(e) => setShowRelayStatusOverlay(e.target.checked)}
            />
            <span className="text-[0.7rem] leading-snug text-[var(--candle-ink-soft)]">
              Show relay status overlay
              <span className="mt-0.5 block text-[0.6rem] text-[var(--candle-ink-faint)]">
                Floating up/down indicator for game relays (top right).
              </span>
            </span>
          </label>
        </div>
      </div>
    );
  }, [
    showHeaderDevTools,
    handleDevRestartFromQuest,
    handleDevTestQuest,
    orderedQuestsForDev,
    devQuestSelection,
    completedQuestIds,
    showQuestChoiceEffects,
    showRelayStatusOverlay,
  ]);

  const walletCopper = useMemo(() => getCopperFromModifiers(questState.modifiers), [questState.modifiers]);
  const merchantItemCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of MERCHANT_TRADE_GOODS) {
      m[g.itemKey] = questState.modifiers[g.itemKey] ?? 0;
    }
    return m;
  }, [questState.modifiers]);
  const displayDay = resolveDisplayDay(questState, dayCounter);
  const showDayInHeader = shouldShowDayInHeader(questState);
  const questContext = useMemo(
    () => getQuestContext(questState, displayDay),
    [questState, displayDay]
  );
  const visibleQuests = useMemo(
    () => getQuestListForUi(allQuests, questContext, questState.unveiledQuestIds, devUnlockAllQuests),
    [questContext, questState.unveiledQuestIds, devUnlockAllQuests]
  );
  const villageJournalQuests = useMemo(
    () => getVillageJournalQuests(allQuests, questContext, questState.unveiledQuestIds, devUnlockAllQuests),
    [questContext, questState.unveiledQuestIds, devUnlockAllQuests]
  );
  /** Incomplete visible quests keep the New badge until completed. */
  const newQuestIds = useMemo(
    () => visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id)).map((quest) => quest.id),
    [visibleQuests, completedQuestIds]
  );
  const villageNewQuestIds = useMemo(
    () =>
      villageJournalQuests
        .filter((quest) => !completedQuestIds.includes(quest.id))
        .map((quest) => quest.id),
    [villageJournalQuests, completedQuestIds]
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
  const playDialogueLines = useMemo(
    () => dialogueLinesForPlayFeed(questState.dialogueLog, questState.flags, PLAY_DIALOGUE_RECENT_MAX),
    [questState.dialogueLog, questState.flags]
  );
  const playWorldLines = useMemo(
    () => worldLinesForPlayFeed(questState.worldEventLog, questState.flags, PLAY_WORLD_RECENT_MAX),
    [questState.worldEventLog, questState.flags]
  );
  const playJournalLines = useMemo(
    () => journalLinesForPlayFeed(questState.journalLog, questState.flags, PLAY_JOURNAL_RECENT_MAX),
    [questState.journalLog, questState.flags]
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

  /** Narrow signals that change Play feed height (ledger + inline quest). */
  const playScrollContentRevision = useMemo(
    () =>
      [
        activeStep?.id ?? '',
        activeQuest?.id ?? '',
        playJournalLines.length,
        playFeedSegments.length,
        playSceneQuestId ?? '',
      ].join('|'),
    [
      activeStep?.id,
      activeQuest?.id,
      playJournalLines.length,
      playFeedSegments.length,
      playSceneQuestId,
    ]
  );
  const characterNameLabel = useMemo(() => {
    const trimmed = questState.playerName.trim();
    return trimmed.length > 0 ? trimmed : 'Stranger';
  }, [questState.playerName]);
  const handleJobsSwitch = useCallback(
    (jobSlug: string) => {
      const pickJobQuest = questById[QUEST_PICK_A_JOB_ID];
      setQuestState((prev) => {
        const switched = switchActiveJob(prev, jobSlug);
        if (!switched) return prev;

        const pickProg = switched.progressByQuestId[QUEST_PICK_A_JOB_ID];
        const pickJobInProgress = Boolean(pickProg && !pickProg.isCompleted);
        const isProfession = jobSlug !== JOB_SLUG_EXPLORER;

        if (!pickJobInProgress || !isProfession || !pickJobQuest) {
          window.queueMicrotask(() => void persistQuestCheckpoint(switched));
          return switched;
        }

        const marked = markQuestCompleted(switched, QUEST_PICK_A_JOB_ID);
        if (!marked) {
          window.queueMicrotask(() => void persistQuestCheckpoint(switched));
          return switched;
        }

        const job = getJobDefinition(jobSlug);
        let merged: QuestState = job
          ? {
              ...marked,
              worldEventLog: appendUniqueWorldEntries(marked.worldEventLog, [
                `You took up work as a ${job.displayName}.`,
              ]),
            }
          : marked;

        merged = mergeJournalRecapOnQuestComplete(prev, merged, pickJobQuest);
        merged = applyQuestLevelMilestoneIfNeeded(prev, merged, QUEST_PICK_A_JOB_ID);
        merged = applyMainDailyQuestCompletionIfNeeded(prev, merged, pickJobQuest, dayCounter);
        merged = mergeDiscoveryUnveils(
          merged,
          QUEST_PICK_A_JOB_ID,
          resolveDisplayDay(merged, dayCounter)
        );

        window.queueMicrotask(() => {
          void persistQuestCheckpoint(merged);
          setPlaySceneQuestId(null);
        });
        return merged;
      });
    },
    [setQuestState, persistQuestCheckpoint, dayCounter]
  );

  const handleMayorVoteRecorded = useCallback(() => {
    setQuestState((prev) => {
      const merged = finishMayorQuestIfInProgress(prev, prev, dayCounter);
      if (!merged) return prev;
      window.queueMicrotask(() => {
        void persistQuestCheckpoint(merged);
        setPlaySceneQuestId(null);
      });
      return merged;
    });
  }, [setQuestState, persistQuestCheckpoint, dayCounter]);

  const handleMayorVoteRetracted = useCallback(() => {
    setQuestState((prev) => {
      const merged = revertMayorQuestAfterVoteRetracted(prev);
      if (!merged) return prev;
      window.queueMicrotask(() => void persistQuestCheckpoint(merged));
      return merged;
    });
  }, [setQuestState, persistQuestCheckpoint]);

  const closeVillagePanels = useCallback(() => {
    setArenaOpen(false);
    setBlobbiFightingOpen(false);
    setTavernOpen(false);
    setMarketOpen(false);
    setCraftersCornerOpen(false);
    setTownHallOpen(false);
  }, []);

  const handleVillageTravel = useCallback(
    (locationId: string) => {
      closeVillagePanels();
      handleTravelLocationSelect(locationId);
      setActiveTab('play');
    },
    [closeVillagePanels, handleTravelLocationSelect]
  );

  const locationIndicatorClass =
    headerDisplayLocation(questState) === FOREST_PARENT_LOCATION
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
    const worldForChronicle = WORLD_EVENT_PRINTS_ENABLED
      ? questState.worldEventLog.filter((entry) => !isPlayDayMarkerText(entry.text))
      : [];
    return mergeDialogueAndWorldRows(questState.dialogueLog, worldForChronicle);
  }, [activeTab, questState.dialogueLog, questState.worldEventLog]);
  const chronicleSegments = useMemo(() => groupChronicleRows(chronicleRows), [chronicleRows]);

  useLayoutEffect(() => {
    playFeedScroll.bindScrollElement(dialogueScrollRef.current);

    if (activeTab !== 'play') {
      if (prevPlayTabRef.current) playFeedScroll.onTabLeavePlay();
      prevPlayTabRef.current = false;
      return;
    }

    const justEnteredPlay = !prevPlayTabRef.current;
    prevPlayTabRef.current = true;

    if (justEnteredPlay) {
      playFeedScroll.onTabEnterPlay();
      playFeedScroll.scheduleSnap({ force: true });
      return;
    }

    if (playFeedScroll.consumeInstantScrollIntent()) {
      playFeedScroll.scheduleSnap({ force: true });
      return;
    }

    playFeedScroll.scheduleSnap();
  }, [activeTab, playScrollContentRevision, playFeedScroll]);

  /** Inner feed growth (quest expand, new lines) — snap only when user is pinned to tail. */
  useEffect(() => {
    if (activeTab !== 'play') return;
    const inner = dialogueScrollRef.current?.firstElementChild;
    if (!inner) return;

    const ro = new ResizeObserver(() => {
      if (activeTabRef.current !== 'play') return;
      playFeedScroll.scheduleSnap();
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, [activeTab, playScrollContentRevision, playFeedScroll]);

  useEffect(() => {
    if (activeTab !== 'play' || !canShowGame) return;
    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (cancelled || activeTabRef.current !== 'play') return;
      playFeedScroll.scheduleSnap();
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, canShowGame, playScrollContentRevision, playFeedScroll]);

  useEffect(() => {
    if (!isQuestStateHydrated || showEarlyDevResetGate) return;
    if (completedQuestIds.length > completedQuestCountRef.current) {
      void persistQuestCheckpoint(questState);
    }
    completedQuestCountRef.current = completedQuestIds.length;
  }, [completedQuestIds, isQuestStateHydrated, questState, persistQuestCheckpoint, showEarlyDevResetGate]);

  // Catch-up: unveil the next saga step and auto-track it when an older save is stuck after a day report.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;

    setQuestState((prev) => {
      if (Object.keys(prev.progressByQuestId).length === 0) return prev;
      if (isForestAutoTrackBlockedByDayRoll(prev)) return prev;
      const completed = getCompletedQuestIds(prev);
      const ctx = getQuestContext(prev, resolveDisplayDay(prev, dayCounter));
      const catchUp = [
        ...catchUpSagaUnveilIds(prev.unveiledQuestIds, completed, ctx),
        ...catchUpManualSagaUnveilIds(prev.unveiledQuestIds, completed, ctx),
        ...(() => {
          const village = catchUpVillageUnveilId(prev.unveiledQuestIds, completed, ctx);
          return village ? [village] : [];
        })(),
        ...(() => {
          const pickJob = catchUpPickJobQuestUnveilId(prev.unveiledQuestIds, completed, ctx);
          return pickJob ? [pickJob] : [];
        })(),
        ...(() => {
          const mayor = catchUpMayorQuestUnveilId(prev.unveiledQuestIds, completed, ctx);
          return mayor ? [mayor] : [];
        })(),
      ];
      let next = prev;
      if (catchUp.length > 0) {
        const merged = Array.from(new Set([...prev.unveiledQuestIds, ...catchUp]));
        if (merged.length !== prev.unveiledQuestIds.length) {
          next = { ...prev, unveiledQuestIds: merged };
        }
      }
      if (catchUp.includes(QUEST_VILLAGE_ARRIVAL_ID)) {
        next = introduceVillageQuestAfterTheDoor(next);
      }
      if (catchUp.includes(QUEST_MAYOR_ID)) {
        next = introduceMayorQuestAfterPickJob(next);
      }
      const tracked = offerNextTrackedForestQuest(
        next,
        getQuestContext(next, resolveDisplayDay(next, dayCounter))
      );
      if (tracked === prev) return prev;
      window.queueMicrotask(() => void persistQuestCheckpoint(tracked));
      return tracked;
    });
  }, [
    isQuestStateHydrated,
    isPacingResolved,
    showEarlyDevResetGate,
    completedQuestIds,
    questState.unveiledQuestIds,
    questState.activeQuestId,
    dayCounter,
    persistQuestCheckpoint,
    setQuestState,
  ]);

  // Forest: backfill Day 1 Report / Day 2 if first night was completed before in-session day rolls.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;
    setQuestState((prev) => {
      const next = reconcileForestSessionDay(prev);
      if (next === prev) return prev;
      window.queueMicrotask(() => void persistQuestCheckpoint(next));
      return next;
    });
  }, [isQuestStateHydrated, isPacingResolved, showEarlyDevResetGate, persistQuestCheckpoint, setQuestState]);

  // Village saves: ensure day-pacing flag + hub location; anchor daily XP when pacing first activates.
  useEffect(() => {
    if (!isQuestStateHydrated || !isPacingResolved || showEarlyDevResetGate) return;
    setQuestState((prev) => {
      let next = catchUpVillageQuestAfterTheDoor(prev);
      next = reconcileVillagePhaseState(next, dayCounter);
      if (
        next.flags === prev.flags &&
        next.currentLocation === prev.currentLocation &&
        next.lastDailyXpDay === prev.lastDailyXpDay
      ) {
        return prev;
      }
      window.queueMicrotask(() => void persistQuestCheckpoint(next));
      return next;
    });
  }, [
    isQuestStateHydrated,
    isPacingResolved,
    dayCounter,
    completedQuestIds,
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

    const updatedState = applyCalendarDayCatchUp(questState, dayCounter);

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

      const nextState = applyChoice(prev, activeQuest, choiceId, resolveDisplayDay(prev, dayCounter));
      const nextStep = getCurrentStep(nextState, activeQuest);
      const qid = activeQuest.id;
      const qOpts = { sourceQuestId: qid };
      const bridgeStartId = selectedChoice.nextStepId ?? currentStep.id;
      const finalStepId = nextState.progressByQuestId[qid]?.currentStepId ?? bridgeStartId;
      const nextLog = [
        ...nextState.dialogueLog,
        appendDialogue(
          PLAYER_ACTION_SPEAKER,
          formatPlayerChoiceDialogueLine(prev.playerName, selectedChoice.label),
          qOpts
        ),
        ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
      ];

      for (const raw of collectContinueBridgeChainTexts(activeQuest, bridgeStartId, finalStepId)) {
        const narr = interpolateQuestCopy(raw, nextState);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(NARRATOR_RESPONSE_SPEAKER, narr, qOpts));
        }
      }

      if (
        nextStep.type === 'choice' &&
        !nextState.progressByQuestId[activeQuest.id]?.isCompleted &&
        nextStep.text.trim().length > 0
      ) {
        const narr = interpolateQuestCopy(nextStep.text, nextState);
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
      merged = applyQuestLevelMilestoneIfNeeded(prev, merged, activeQuest.id);
      merged = applyMainDailyQuestCompletionIfNeeded(prev, merged, activeQuest, dayCounter);
      if (!wasCompleted && isCompleted) {
        merged = mergeDiscoveryUnveils(merged, activeQuest.id, resolveDisplayDay(merged, dayCounter));
      }
      if (!wasCompleted && isCompleted && activeQuest.id === QUEST_DYERS_CRYPT_ID) {
        merged = acknowledgeAncientCemeteryTravelDiscovery({ ...merged, forestSubLocation: null });
      }
      const villageQuestUnveiled =
        !wasCompleted &&
        isCompleted &&
        activeQuest.id === QUEST_004_B_THE_DOOR_ID &&
        merged.unveiledQuestIds.includes(QUEST_VILLAGE_ARRIVAL_ID) &&
        !prev.unveiledQuestIds.includes(QUEST_VILLAGE_ARRIVAL_ID);
      void persistQuestCheckpoint(merged);
      if (!wasCompleted && isCompleted) {
        setPlaySceneQuestId(null);
      }
      if (villageQuestUnveiled) {
        window.queueMicrotask(() => {
          notifyVillageQuestAvailable(toast);
          setPlaySceneQuestId(QUEST_VILLAGE_ARRIVAL_ID);
          setActiveTab('play');
        });
      }
      return merged;
    });
  };

  const handleInventoryPickSubmit = (itemLabel: string) => {
    if (!activeQuest) return;
    setQuestState((prev) => {
      const priorStep = getCurrentStep(prev, activeQuest);
      const { nextState, error } = submitQuestInventoryPick(
        prev,
        activeQuest,
        itemLabel,
        resolveDisplayDay(prev, dayCounter)
      );
      if (error) return prev;
      const nextStep = getCurrentStep(nextState, activeQuest);
      const qOpts = { sourceQuestId: activeQuest.id };
      const nextLog = [
        ...nextState.dialogueLog,
        appendDialogue(
          PLAYER_ACTION_SPEAKER,
          formatPlayerChoiceDialogueLine(prev.playerName, `Throw ${itemLabel.trim()} in`),
          qOpts
        ),
        ...visualDialogueEntriesForQuestStep(activeQuest, nextStep.id),
      ];
      const pickBridgeStart =
        priorStep.type === 'inventoryPick' ? priorStep.nextStepId : undefined;
      const pickFinalId = nextState.progressByQuestId[activeQuest.id]?.currentStepId ?? pickBridgeStart;
      if (pickBridgeStart) {
        for (const raw of collectContinueBridgeChainTexts(activeQuest, pickBridgeStart, pickFinalId)) {
          const narr = interpolateQuestCopy(raw, nextState);
          if (narr.trim().length > 0) {
            nextLog.push(appendDialogue(NARRATOR_RESPONSE_SPEAKER, narr, qOpts));
          }
        }
      }
      if (nextStep.type === 'choice' && nextStep.text.trim().length > 0) {
        const narr = interpolateQuestCopy(nextStep.text, nextState);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(QUEST_NARRATOR_PROMPT_SPEAKER, narr, qOpts));
        }
      }
      const merged: QuestState = { ...nextState, dialogueLog: nextLog };
      void persistQuestCheckpoint(merged);
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
        const narr = interpolateQuestCopy(nextStep.text, advanced);
        if (narr.trim().length > 0) {
          nextLog.push(appendDialogue(NARRATOR_RESPONSE_SPEAKER, narr, qOpts));
        }
      } else if (
        nextStep.type !== 'input' &&
        nextStep.type !== 'inventoryPick' &&
        !advanced.progressByQuestId[activeQuest.id]?.isCompleted
      ) {
        const narr = interpolateQuestCopy(nextStep.text, advanced);
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
      merged = applyQuestLevelMilestoneIfNeeded(prev, merged, activeQuest.id);
      merged = applyMainDailyQuestCompletionIfNeeded(prev, merged, activeQuest, dayCounter);
      if (!wasCompleted && isCompleted) {
        merged = mergeDiscoveryUnveils(merged, activeQuest.id, resolveDisplayDay(merged, dayCounter));
        setPlaySceneQuestId(null);
      }
      void persistQuestCheckpoint(merged);
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
      withJournal = applyQuestLevelMilestoneIfNeeded(questState, withJournal, QUEST_ORIGIN_ID);
      withJournal = mergeDiscoveryUnveils(withJournal, QUEST_ORIGIN_ID, resolveDisplayDay(withJournal, dayCounter));
      setQuestState(withJournal);
      void persistQuestCheckpoint(withJournal);
      setPlaySceneQuestId(null);
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
    let withJournal = mergeJournalRecapOnQuestComplete(questState, updatedState, activeQuest);
    withJournal = applyQuestLevelMilestoneIfNeeded(questState, withJournal, activeQuest.id);
    setQuestState(withJournal);
    void persistQuestCheckpoint(withJournal);
  };

  const handleTrackQuest = (questId: string) => {
    playFeedScroll.markInstantScrollIntent();
    handleStartQuest(questId);
    setActiveTab('play');
  };

  const handleOpenQuest = (questId: string) => {
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
    setPlaySceneQuestId(questId);
  };

  const handleCloseQuestScene = () => {
    setPlaySceneQuestId(null);
  };

  const handlePrimaryNavClick = (key: MobileTab) => {
    if (key === 'play' && activeTab === 'play' && playSceneQuestId) {
      handleCloseQuestScene();
      return;
    }
    setActiveTab(key);
  };

  const handleLocationSceneAction = (actionLabel: string) => {
    const questId = SILVER_LAKE_SCENE_ACTION_QUEST[actionLabel];
    if (!questId) return;
    const quest = questById[questId];
    if (!quest) return;

    setQuestState((prev) => {
      const ctx = getQuestContext(prev, dayCounter);
      if (!devUnlockAllQuests && !quest.isAvailable(ctx)) return prev;
      playFeedScroll.markInstantScrollIntent();
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
            dayCounter={dayCounter}
            dayPacingActive={questContext.dayPacingActive}
            guildDisplayName={guildDisplayName}
            kindredSpirits={user ? socialStats.kindredSpirits : undefined}
            onOpenChronicle={() => setActiveTab('chronicle')}
            showModifierDetails={showModifierDetails}
            showDevTools={showHeaderDevTools}
            onAdvanceDay={() => setDevDayOffsetMs((prev) => prev + DAY_IN_MS)}
            devFiveMinuteDays={devFiveMinuteDays}
            onDevFiveMinuteDaysChange={setDevFiveMinuteDays}
            rapidDaySimulation={rapidDaySimulation}
            onRapidDaySimulationChange={setRapidDaySimulation}
            onShowModifierDetailsChange={setShowModifierDetails}
            showQuestChoiceEffects={showHeaderDevTools ? showQuestChoiceEffects : false}
            onShowQuestChoiceEffectsChange={setShowQuestChoiceEffects}
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
              questFlags={questState.flags}
              playerName={questState.playerName}
              playFeedSegments={playFeedSegments}
              playJournalLines={playJournalLines}
              newQuestIds={villageNewQuestIds}
              questTitleById={questTitleById}
              villageJournalQuests={villageJournalQuests}
              completedQuestIds={completedQuestIds}
              onOpenQuest={handleOpenQuest}
              playSceneQuestId={playSceneQuestId}
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
              showOriginStartHint={showOriginStartHint}
              playerModifiers={questState.modifiers}
              questItems={questState.questItems}
              onInventoryPickSubmit={handleInventoryPickSubmit}
              showQuestChoiceEffects={showHeaderDevTools ? showQuestChoiceEffects : false}
              playerHealth={questState.health}
              onPlayerHealthChange={(health) =>
                setQuestState((prev) => ({ ...prev, health: Math.max(0, Math.min(100, health)) }))
              }
              questProgress={
                activeQuest ? questState.progressByQuestId[activeQuest.id] : undefined
              }
              onOpenArena={() => setArenaOpen(true)}
              onOpenBlobbiFighting={() => setBlobbiFightingOpen(true)}
              onOpenTavern={() => setTavernOpen(true)}
              onOpenMarket={() => setMarketOpen(true)}
              onOpenTownHall={() => setTownHallOpen(true)}
              onOpenCraftersCorner={() => setCraftersCornerOpen(true)}
              onTravelToLocation={handleVillageTravel}
            />
          );
        }
        return (
          <PlayTab
            playFeedSegments={playFeedSegments}
            playJournalLines={playJournalLines}
            newQuestIds={newQuestIds}
            questTitleById={questTitleById}
            visibleQuests={visibleQuests}
            completedQuestIds={completedQuestIds}
            onOpenQuest={handleOpenQuest}
            playSceneQuestId={playSceneQuestId}
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
            questItems={questState.questItems}
            onInventoryPickSubmit={handleInventoryPickSubmit}
            showQuestChoiceEffects={showHeaderDevTools ? showQuestChoiceEffects : false}
            playerHealth={questState.health}
            onPlayerHealthChange={(health) =>
              setQuestState((prev) => ({ ...prev, health: Math.max(0, Math.min(100, health)) }))
            }
            questProgress={
              activeQuest ? questState.progressByQuestId[activeQuest.id] : undefined
            }
          />
        );
    }
  };

  return (
    <>
    <GamePortraitViewport>
    <main className="candlelit-shell relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex min-h-0 flex-1 w-full flex-col gap-0.5 px-0 pt-[max(0px,env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom,0px)+1.65rem)]">
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
          dayCounter={displayDay}
          dayPacingActive={showDayInHeader}
          currentLocation={headerDisplayLocation(questState)}
          travelMenuHighlightLocation={travelMenuHighlightLocation(questState)}
          formatLocationLabel={formatLocationLabel}
          locationIndicatorClass={locationIndicatorClass}
          travelMenuItems={travelMenuItems}
          locationMenuNotify={locationMenuNotify}
          onTravelLocationSelect={handleTravelLocationSelect}
          showHeaderDevTools={showHeaderDevTools}
          devToolsPanel={headerDevPanel}
          devToolsMenuOpen={devToolsMenuOpen}
          onDevToolsMenuOpenChange={setDevToolsMenuOpen}
          health={questState.health}
        />
        {showRelayHealthOverlay ? (
          <GameRelayStatusOverlay
            snapshot={relayHealthQuery.data}
            isFetching={relayHealthQuery.isFetching}
            onRefresh={() => void relayHealthQuery.refetch()}
          />
        ) : null}
        <div
          className={`min-h-0 flex-1 ${
            activeTab === 'play'
              ? 'play-surface-fade-in overflow-hidden'
              : activeTab === 'social'
                ? 'emerge flex h-full min-h-0 flex-1 flex-col overflow-hidden'
                : activeTab === 'character'
                  ? 'emerge facsimile-scroll facsimile-scroll-character overflow-y-auto'
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
                    onClick={() => handlePrimaryNavClick(item.key)}
                    className={`candlelit-nav-btn relative ${item.isPrimary ? 'is-primary' : ''} ${isActive ? 'is-active' : ''}`}
                    aria-label={item.label}
                  >
                    <span className="text-xs leading-none" aria-hidden>
                      {item.icon}
                    </span>
                  </button>
                );
              })
            : null}
        </nav>
      </div>
      {canShowGame ? (
        <>
          {questState.currentLocation === 'Merchant' ? (
            <MerchantPanel
              open
              onOpenChange={handleMerchantDialogOpenChange}
              walletCopper={walletCopper}
              itemCounts={merchantItemCounts}
              onApplyModifiers={handleMerchantApplyModifiers}
            />
          ) : null}
          {arenaOpen ? (
            <ArenaPanel
              open
              onOpenChange={setArenaOpen}
              questState={questState}
              myPubkey={user?.pubkey}
              tournament={arenaTournament}
            />
          ) : null}
          {blobbiFightingOpen ? (
            <BlobbiFightingPanel
              open
              onOpenChange={setBlobbiFightingOpen}
              myPubkey={user?.pubkey}
              playerBlobbis={playerBlobbis}
              blobbiFight={blobbiFight}
            />
          ) : null}
          {tavernOpen ? (
            <TavernPanel
              open
              onOpenChange={setTavernOpen}
              questState={questState}
              myPubkey={user?.pubkey}
              tavern={tavern}
            />
          ) : null}
          {marketOpen ? (
            <MarketPanel
              open
              onOpenChange={setMarketOpen}
              questState={questState}
              myPubkey={user?.pubkey}
              market={market}
              onApplyModifiers={handleMerchantApplyModifiers}
            />
          ) : null}
          {craftersCornerOpen ? (
            <CraftersCornerPanel
              open
              onOpenChange={setCraftersCornerOpen}
              questState={questState}
              onApplyModifiers={handleMerchantApplyModifiers}
            />
          ) : null}
          {townHallOpen ? (
            <TownHallPanel
              open
              onOpenChange={setTownHallOpen}
              myPubkey={user?.pubkey}
              mayorsHut={mayorsHut}
              villageProjects={villageProjects}
              guildAlley={guildAlley}
              questState={questState}
              onSwitchJob={handleJobsSwitch}
              onMayorVoteRecorded={handleMayorVoteRecorded}
              onMayorVoteRetracted={handleMayorVoteRetracted}
            />
          ) : null}
        </>
      ) : null}
    </main>
    </GamePortraitViewport>
    {showHeaderDevTools ? (
      <QuestCheckpointRestoreDialog
        open={checkpointRestoreOpen}
        onOpenChange={setCheckpointRestoreOpen}
        myPubkey={user?.pubkey}
        restoringEventId={restoringCheckpointEventId}
        onRestore={handleRestoreCheckpoint}
      />
    ) : null}
    </>
  );
}
