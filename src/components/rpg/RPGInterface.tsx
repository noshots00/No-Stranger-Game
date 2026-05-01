import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import {
  applyChoice,
  getCompletedQuestIds,
  getCurrentStep,
  getQuestContext,
  getVisibleQuests,
  interpolateStepText,
  startQuest,
  submitPlayerName,
} from '@/components/rpg/quests/engine';
import { SKILLS_WITH_DAILY_XP } from '@/components/rpg/quests/skills-config';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import {
  DAILY_XP,
  DAY_IN_MS,
  DIALOGUE_BREATHE_OVERFLOW_RATIO,
  DIALOGUE_SCROLL_PIN_EPS,
  HIDDEN_LOCATION_ACTIONS,
  INTRO_DEV_MESSAGE,
  locationActions,
  PLAY_DIALOGUE_RECENT_MAX,
  PLAY_WORLD_RECENT_MAX,
} from './constants';
import type { MobileTab } from './constants';
import { appendDialogue, appendUniqueWorldEntries, getLevelUpLines, getRewardLines } from './helpers';
import {
  formatPlayerChoiceDialogueLine,
  groupChronicleRows,
  groupDialogueLinesByVoice,
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
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

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { logout } = useLoginActions();
  const navigate = useNavigate();

  const { questState, setQuestState, isQuestStateHydrated, persistQuestCheckpoint, resetQuestState } = useQuestState();
  const { dayCounter, setDevDayOffsetMs, resetTimestamp } = useDayCounter();
  const { socialStats, socialActivityQuery, socialKindredSignalsQuery, socialLobbyQuery, lobbyNameMap } = useSocialQueries();

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
  const questContext = useMemo(() => getQuestContext(questState), [questState]);
  const visibleQuests = useMemo(() => getVisibleQuests(allQuests, questContext), [questContext]);
  const activeQuest = questState.activeQuestId ? questById[questState.activeQuestId] : null;
  const activeStep = activeQuest ? getCurrentStep(questState, activeQuest) : null;
  const pendingQuestCount = useMemo(
    () => visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id)).length,
    [visibleQuests, completedQuestIds]
  );
  const visibleLocationActions = (locationActions[questState.currentLocation] ?? []).filter(
    (action) => !HIDDEN_LOCATION_ACTIONS.has(action)
  );
  const oldestPendingQuestId = useMemo(() => {
    const pending = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
    if (pending.length === 0) return null;
    return [...pending].sort((a, b) => a.createdAt - b.createdAt)[0].id;
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
        : 'mystery-muted';
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

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (dayCounter <= questState.lastDailyXpDay) return;

    const daysToGrant = dayCounter - questState.lastDailyXpDay;
    const xpToGrant = daysToGrant * DAILY_XP;
    const nextSkills = { ...questState.skills };
    for (const key of SKILLS_WITH_DAILY_XP) {
      nextSkills[key] = questState.skills[key] + xpToGrant;
    }
    const updatedState = {
      ...questState,
      experience: questState.experience + xpToGrant,
      skills: nextSkills,
      lastDailyXpDay: dayCounter,
    };
    const rewardLines = getRewardLines(questState.modifiers, updatedState.modifiers);
    const levelUpLines = getLevelUpLines(questState, updatedState);
    const dayLineBase = `Day ${dayCounter}: You gained ${xpToGrant} XP.`;
    const dayLine =
      rewardLines.length > 0 ? `${dayLineBase} ${rewardLines.join(' ')}` : dayLineBase;
    updatedState.worldEventLog = appendUniqueWorldEntries(updatedState.worldEventLog, [
      dayLine,
      ...levelUpLines,
    ]);

    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  }, [dayCounter, isQuestStateHydrated, questState, persistQuestCheckpoint, setQuestState]);

  useEffect(() => {
    setExpandedQuestId(oldestPendingQuestId);
  }, [oldestPendingQuestId]);

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

      const boarLine = 'You fended off a wild boar!';
      const rewardLines = getRewardLines(prev.modifiers, nextState.modifiers);
      const levelUpLines = getLevelUpLines(prev, nextState);
      const boarLines = activeQuest.id === 'quest-002-boar-ambush' ? [boarLine] : [];
      const worldEventLog = appendUniqueWorldEntries(nextState.worldEventLog, [
        ...boarLines,
        ...rewardLines,
        ...levelUpLines,
      ]);

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
        worldEventLog: appendUniqueWorldEntries(nextState.worldEventLog, [
          `You remembered your name is ${submittedName}`,
          `${submittedName} is exploring the ${nextState.currentLocation}.`,
        ]),
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
            lobbyEvents={socialLobbyQuery.data ?? []}
            lobbyStatus={socialLobbyQuery.isPending ? 'pending' : socialLobbyQuery.isError ? 'error' : 'success'}
            lobbyNameMap={lobbyNameMap}
            characterNameLabel={characterNameLabel}
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
          />
        );
    }
  };

  return (
    <>
    <main className="facsimile-shell mystery-ui min-h-screen p-2 sm:p-6">
      <div className="facsimile-phone-frame mx-auto">
        <div className="facsimile-glow" aria-hidden />
        <section className="facsimile-phone-content flex w-full flex-col gap-2 px-3 py-2">
          <GameHeader
            dayCounter={dayCounter}
            currentLocation={questState.currentLocation}
            locationIndicatorClass={locationIndicatorClass}
            onAdvanceDay={() => setDevDayOffsetMs((prev) => prev + DAY_IN_MS)}
            onLogout={handleLogout}
            onResetStory={handleResetStory}
          />
          {renderTabPanel()}
        </section>
        <nav className="facsimile-bottom-nav" aria-label="Primary game navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`facsimile-nav-button relative ${item.isPrimary ? 'facsimile-nav-primary' : ''} ${isActive ? 'is-active' : ''}`}
                aria-label={item.label}
              >
                {item.key === 'quests' && pendingQuestCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--facsimile-accent)] bg-black px-1 text-[9px] leading-none text-[var(--facsimile-ink)]">
                    {pendingQuestCount}
                  </span>
                ) : null}
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] uppercase tracking-[0.16em]">{item.label}</span>
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
