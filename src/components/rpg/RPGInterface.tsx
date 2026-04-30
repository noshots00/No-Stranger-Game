import { useEffect, useRef, useState } from 'react';

const mockChoices = [
  'Follow the lantern glow into the orchard ruins',
  'Return to the well and listen for the iron key',
  'Climb the watch stair and mark every signal fire',
];

const mockSignals = [
  'Ravenhall gate opens at first bell.',
  'Archivist seeks one bearer of unfinished oaths.',
  'Floodplain caravan expects tribute before moonrise.',
];

const socialStats = {
  totalPlayers: 1284,
  follows: 43,
  followers: 57,
};

const socialFeed = [
  'Mira reached level 9 in tracking near the Floodplain Trail.',
  'Thorn unlocked a new skill: Iron Parry.',
  'Lysa discovered the Silent Archive beneath the old chapel.',
  'Corvin earned 24 copper from market contracts.',
  'Nessa defeated a wolf pack and gained 2 pelts.',
  'Eldric completed quest: Ash Bell on the Eastern Stair.',
];

const socialChatMessages = [
  'Mira: Anyone heading to the old well tonight?',
  'Thorn: I can join after market reset.',
  'You: I will scout the orchard path first.',
];

const mockEventLog = [
  'You traveled to the forest.',
  'You visited the wishing well.',
  'You met a new character: Fairy of the Well.',
  'You reached level 5 in hiking.',
  'You reached level 2 in foraging.',
  'You gained a wolf pelt after hunting in the forest.',
  'You worked for 5 hours and earned 15 copper.',
  'You unlocked a new skill: Bash.',
];

const currentLocation = 'Forest';

const locationActions: Record<string, string[]> = {
  Town: ['Visit the tavern', 'Visit the market'],
  Forest: ['Interact with the old well', 'Visit the abandoned cabin'],
};

const characterStats = [
  ['Strength', '14'],
  ['Dexterity', '12'],
  ['Constitution', '13'],
  ['Intelligence', '15'],
  ['Wisdom', '11'],
  ['Charisma', '10'],
];

const characterSkills = ['Hiking 5', 'Foraging 2', 'Tracking 3', 'Negotiation 2', 'First Aid 1'];
const characterTraits = ['Observant', 'Cautious', 'Loyal to companions', 'Restless at dusk'];
const characterRelationships = ['Fairy of the Well (Ally)', 'Warden Elira (Mentor)', 'Market Broker (Rival)'];
const characterAffinities = ['Forests', 'Ancient ruins', 'Quiet weather', 'Old maps'];
const characterAfflictions = ['Old knee wound', 'Night terrors'];
const characterBlessings = ['Wellkeeper’s Favor', 'Dawnlight Protection'];
const characterCurses = ['Debt Mark of Ravenhall'];

type MobileTab = 'character' | 'quests' | 'play' | 'map' | 'social';
type DialogueRole = 'npc' | 'player' | 'exposition' | 'developer';

type DialogueEntry = {
  id: string;
  role: DialogueRole;
  speaker: string;
  text: string;
};

type QuestItem = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
};

const DIALOGUE_STORAGE_KEY = 'nsg:facsimile-dialogue-history';
const NPC_NAME = 'Warden Elira';
const NPC_AVATAR_URL = 'https://api.dicebear.com/8.x/adventurer/svg?seed=Elira';

const INITIAL_DIALOGUE: DialogueEntry[] = [
  {
    id: 'exp-intro-1',
    role: 'exposition',
    speaker: 'Exposition',
    text: 'Night folds over Ravenhall. The orchard bells ring once for each oath still unpaid.',
  },
  {
    id: 'npc-intro-1',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'You arrived late, stranger. The oath still waits, but the city has already begun to choose without you.',
  },
  {
    id: 'npc-intro-2',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'At dawn the orchard looked empty, but every tree carried a blade-mark under the bark.',
  },
  {
    id: 'npc-intro-3',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'Three couriers crossed the bridge before sunrise. None of them reached the square.',
  },
  {
    id: 'npc-intro-4',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'If you choose the well, listen for metal against stone. If you choose the stair, count the silent fires.',
  },
  {
    id: 'npc-intro-5',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'Whatever road you take, do not give your true name to the first voice that offers shelter.',
  },
  {
    id: 'npc-intro-6',
    role: 'npc',
    speaker: NPC_NAME,
    text: 'Now decide. The city is already writing this chapter, with or without your hand on the page.',
  },
  {
    id: 'dev-intro-1',
    role: 'developer',
    speaker: 'Developer Note',
    text: 'This dialogue box can include narrative exposition and direct system messages while preserving your story log.',
  },
];

const CHOICE_RESPONSES: Record<string, string[]> = {
  'Follow the lantern glow into the orchard ruins':
    ['Then follow close and keep your hands open. The orchard keeps what it can close a fist around.'],
  'Return to the well and listen for the iron key':
    ['The well remembers every promise dropped into it. If you listen long enough, one of them will answer.'],
  'Climb the watch stair and mark every signal fire': [
    'From the stair you will see who calls for help and who calls for witnesses. Mark both.',
    'When the third flame flickers, do not wave back. That signal is meant for someone already dead.',
    'Count seven breaths after the bell, then look east. A door in the wall will open only once.',
    'If you survive what you see up there, return before dawn. I will be waiting by the archive steps.',
  ],
};

const LOOP_OPTION = 'tell me more';

const mockQuests: QuestItem[] = [
  {
    id: 'quest-003',
    title: 'Ash Bell on the Eastern Stair',
    briefing:
      'Climb to the third landing before dawn. Count three silent signals, then return to Elira with what you saw.',
    createdAt: 3,
  },
  {
    id: 'quest-002',
    title: 'Whispers in the Well',
    briefing:
      'Visit the old well at moonrise. Listen for the iron key and record the first name you hear.',
    createdAt: 2,
  },
  {
    id: 'quest-001',
    title: 'Lanterns in the Orchard',
    briefing:
      'Follow the lantern trail into the orchard ruins and map every marked tree before first light.',
    createdAt: 1,
  },
];

export function RPGInterface() {
  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [dialogueHistory, setDialogueHistory] = useState<DialogueEntry[]>(INITIAL_DIALOGUE);
  const [isChoiceResolved, setIsChoiceResolved] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingNpcTimersRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DIALOGUE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DialogueEntry[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setDialogueHistory(parsed);
      setIsChoiceResolved(parsed.some((entry) => entry.role === 'player'));
    } catch {
      setDialogueHistory(INITIAL_DIALOGUE);
      setIsChoiceResolved(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DIALOGUE_STORAGE_KEY, JSON.stringify(dialogueHistory));
  }, [dialogueHistory]);

  useEffect(() => {
    const container = dialogueScrollRef.current;
    if (!container) return;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [dialogueHistory, activeTab]);

  useEffect(() => {
    return () => {
      pendingNpcTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingNpcTimersRef.current = [];
    };
  }, []);

  const clearPendingNpcTimers = () => {
    pendingNpcTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingNpcTimersRef.current = [];
  };

  const handleChoiceSelect = (choice: string) => {
    if (isChoiceResolved) return;
    clearPendingNpcTimers();
    const playerLine: DialogueEntry = {
      id: `player-${Date.now()}`,
      role: 'player',
      speaker: 'You',
      text: choice,
    };
    const npcResponses = (CHOICE_RESPONSES[choice] ?? [
      'The city listens, and the path shifts beneath your feet.',
    ]);
    const npcTurnId = `npc-turn-${Date.now()}`;
    const initialNpcLine: DialogueEntry = {
      id: npcTurnId,
      role: 'npc',
      speaker: NPC_NAME,
      text: npcResponses[0] ?? '',
    };
    setDialogueHistory((prev) => [...prev, playerLine, initialNpcLine]);
    npcResponses.slice(1).forEach((line, index) => {
      const timerId = window.setTimeout(() => {
        setDialogueHistory((prev) =>
          prev.map((entry) =>
            entry.id === npcTurnId ? { ...entry, text: `${entry.text}\n${line}` } : entry
          )
        );
      }, 3000 * (index + 1));
      pendingNpcTimersRef.current.push(timerId);
    });
    setIsChoiceResolved(true);
  };

  const handleTellMeMore = () => {
    clearPendingNpcTimers();
    const bridgeLine: DialogueEntry = {
      id: `npc-loop-${Date.now()}`,
      role: 'npc',
      speaker: NPC_NAME,
      text: 'The wind shifts. Ask again and I will open another thread of the same road.',
    };
    setDialogueHistory((prev) => [...prev, bridgeLine]);
    setIsChoiceResolved(false);
  };

  const handleResetStory = () => {
    clearPendingNpcTimers();
    localStorage.removeItem(DIALOGUE_STORAGE_KEY);
    setDialogueHistory(INITIAL_DIALOGUE);
    setIsChoiceResolved(false);
  };

  const navItems: Array<{ key: MobileTab; label: string; icon: string; isPrimary?: boolean }> = [
    { key: 'character', label: 'Character', icon: '◉' },
    { key: 'quests', label: 'Quests', icon: '☰' },
    { key: 'play', label: 'Play', icon: '✦', isPrimary: true },
    { key: 'map', label: 'Map', icon: '◈' },
    { key: 'social', label: 'Social', icon: '◎' },
  ];

  const renderTabPanel = () => {
    if (activeTab === 'character') {
      return (
        <section className="facsimile-panel space-y-4">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold text-[var(--facsimile-ink)]">Ari of Ember Gate</h2>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">
              Human · Ranger · Scout
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
            Shareable profile link: <span className="text-[var(--facsimile-ink)]">nostr-game://profile/ari-ember-gate</span>
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
            <p><span className="text-[var(--facsimile-ink)]">Skills:</span> {characterSkills.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Characteristics:</span> {characterTraits.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Relationships:</span> {characterRelationships.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Affinities:</span> {characterAffinities.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Afflictions:</span> {characterAfflictions.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Blessings:</span> {characterBlessings.join(', ')}</p>
            <p><span className="text-[var(--facsimile-ink)]">Curses:</span> {characterCurses.join(', ')}</p>
          </div>
        </section>
      );
    }

    if (activeTab === 'quests') {
      const sortedQuests = [...mockQuests].sort((a, b) => b.createdAt - a.createdAt);

      return (
        <section className="facsimile-panel space-y-5">
          <p className="facsimile-kicker">Quests</p>
          <div className="space-y-3">
            {sortedQuests.map((quest) => {
              const isExpanded = expandedQuestId === quest.id;
              const isCompleted = completedQuestIds.includes(quest.id);

              return (
                <div key={quest.id} className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
                  <button
                    type="button"
                    onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                    className="w-full px-3 py-2 text-left"
                  >
                    <p className={`text-sm ${isCompleted ? 'line-through opacity-70' : ''}`}>{quest.title}</p>
                  </button>
                  {isExpanded ? (
                    <div className="border-t border-[var(--facsimile-panel-border)] px-3 py-2">
                      <p className="text-xs text-[var(--facsimile-ink-muted)]">{quest.briefing}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setCompletedQuestIds((prev) =>
                            prev.includes(quest.id) ? prev.filter((id) => id !== quest.id) : [...prev, quest.id]
                          )
                        }
                        className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink)]"
                      >
                        {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (activeTab === 'map') {
      return (
        <section className="facsimile-panel space-y-4">
          <p className="facsimile-kicker">Map</p>
          <h2 className="text-2xl font-semibold text-[var(--facsimile-ink)]">District Lines</h2>
          <ul className="space-y-3 text-sm text-[var(--facsimile-ink-muted)]">
            <li className="border-l border-amber-500/40 pl-3">Old Orchard Ruins</li>
            <li className="border-l border-amber-500/40 pl-3">Iron Well Quarter</li>
            <li className="border-l border-amber-500/40 pl-3">Signal Stair Bastion</li>
          </ul>
        </section>
      );
    }

    if (activeTab === 'social') {
      return (
        <section className="facsimile-panel space-y-4">
          <p className="facsimile-kicker">Social</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Players</p>
              <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.totalPlayers}</p>
            </div>
            <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Follows</p>
              <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.follows}</p>
            </div>
            <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Followers</p>
              <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.followers}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
            <div className="facsimile-scroll max-h-64 overflow-y-auto px-3 py-2">
              <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
                {socialFeed.map((line) => (
                  <li key={line} className="border-l border-[var(--facsimile-accent)]/50 pl-2">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
            {mockSignals.map((signal) => (
              <li key={signal} className="border-l border-[var(--facsimile-panel-border)] pl-2">
                {signal}
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              {['Guild', 'Market', 'Player Quests'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-[11px] text-[var(--facsimile-ink)]"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="facsimile-scroll mb-2 max-h-24 overflow-y-auto rounded-md bg-black/35 p-2">
              <ul className="space-y-1 text-xs text-[var(--facsimile-ink-muted)]">
                {socialChatMessages.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type message..."
                className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] placeholder:text-[var(--facsimile-ink-muted)] focus:outline-none"
              />
              <button
                type="button"
                className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)]"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-col gap-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleResetStory}
            className="text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
          >
            Reset Story
          </button>
        </div>
        <div
          ref={dialogueScrollRef}
          className="facsimile-scroll h-[30rem] overflow-y-auto rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2"
        >
          <div className="space-y-1">
            {dialogueHistory.map((entry, index) => {
              const previousRole = dialogueHistory[index - 1]?.role;
              const showNpcAvatar = entry.role === 'npc' && previousRole !== 'npc';

              if (entry.role === 'player') {
                return (
                  <div key={entry.id} className="py-0.5 pl-5">
                    <p className="text-xs leading-5 text-[var(--facsimile-ink)]">- {entry.text}</p>
                  </div>
                );
              }

              return (
                <div key={entry.id} className="dialogue-line-reveal py-0.5">
                  <div
                    className={`text-sm leading-6 ${
                      entry.role === 'developer'
                        ? 'rounded-md border border-cyan-300/55 bg-cyan-950/35 px-2 py-1 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                        : entry.role === 'exposition'
                          ? 'rounded-md border border-violet-400/35 bg-violet-950/25 px-2 py-1 italic tracking-[0.01em] text-violet-100'
                          : 'text-[var(--facsimile-ink)]'
                    }`}
                  >
                    {entry.role === 'npc'
                      ? entry.text.split('\n').map((line, lineIndex) => (
                          <p key={`${entry.id}-${line}`} className={lineIndex > 0 ? 'pl-5' : ''}>
                            {lineIndex === 0 && showNpcAvatar ? (
                              <button
                                type="button"
                                className="mr-1 inline-flex align-text-top"
                                onClick={() => setActiveTab('character')}
                                aria-label="Open character sheet"
                              >
                                <img
                                  src={NPC_AVATAR_URL}
                                  alt={NPC_NAME}
                                  className="inline-block h-4 w-4 rounded-full border border-[var(--facsimile-accent)] bg-[var(--facsimile-panel)] object-cover"
                                />
                              </button>
                            ) : null}
                            {line}
                          </p>
                        ))
                      : <p>{entry.role === 'developer' ? `[DEV NOTE] ${entry.text}` : entry.text}</p>}
                  </div>
                </div>
              );
            })}
            <div className="-mt-1">
              <ul className="space-y-1 pl-4">
                {isChoiceResolved ? (
                  <li key={LOOP_OPTION}>
                    <button
                      type="button"
                    className="w-full text-left text-xs text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                      onClick={handleTellMeMore}
                    >
                      - {LOOP_OPTION}
                    </button>
                  </li>
                ) : (
                  mockChoices.map((choice) => (
                    <li key={choice}>
                      <button
                        type="button"
                        className="w-full text-left text-xs text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                        onClick={() => handleChoiceSelect(choice)}
                      >
                        - {choice}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
          <div className="facsimile-scroll h-20 overflow-y-auto px-2 py-2">
            <ul className="space-y-1 pl-4 text-[11px] text-[var(--facsimile-ink-muted)]">
              {mockEventLog.map((eventLine) => (
                <li key={eventLine} className="list-disc">
                  {eventLine}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {(locationActions[currentLocation] ?? []).map((action) => (
              <button
                key={action}
                type="button"
                className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-[rgba(20,23,31,0.82)] px-2 py-1.5 text-left text-xs text-[var(--facsimile-ink-muted)] hover:border-[var(--facsimile-accent)] hover:text-[var(--facsimile-ink)]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="facsimile-shell mystery-ui min-h-screen p-2 sm:p-6">
      <div className="facsimile-phone-frame mx-auto">
        <div className="facsimile-glow" aria-hidden />
        <section className="facsimile-phone-content flex w-full flex-col gap-3 px-3 py-2">
          <header className="sticky top-0 z-20 rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel)] px-2 py-1.5 backdrop-blur">
            <div className="relative flex items-center justify-between">
              <p className="mystery-muted text-[10px] uppercase tracking-[0.2em]">Day 37</p>
              <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)]">
                v0.2.6-dev
              </p>
              <p className="mystery-muted text-[10px] uppercase tracking-[0.2em]">{currentLocation}</p>
            </div>
          </header>
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
                className={`facsimile-nav-button ${item.isPrimary ? 'facsimile-nav-primary' : ''} ${isActive ? 'is-active' : ''}`}
                aria-label={item.label}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] uppercase tracking-[0.16em]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
