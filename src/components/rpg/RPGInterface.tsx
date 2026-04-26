import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CharacterSheet } from './CharacterSheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { clearMVPCharacter, loadMVPCharacter, saveMVPCharacter, type MVPCharacter, type NetworkPresenceMember } from '@/lib/rpg/utils';
import { nip19 } from 'nostr-tools';
import { PRESENCE_RELAYS, useNetworkPresence } from '@/hooks/useNetworkPresence';
import { useToast } from '@/hooks/useToast';
import { useNostr } from '@nostrify/react';
import { useEchoes } from '@/hooks/useEchoes';
import { useScryingPool } from '@/hooks/useScryingPool';
import { useHomeland } from '@/hooks/useHomeland';
import { usePhase2Signals } from '@/hooks/usePhase2Signals';
import { CHAPTER_PROOF_KIND, getChapterWindowId, hasCanonicalChoiceForWindow, markCanonicalChoiceForWindow } from '@/lib/rpg/proof';
import { DEFAULT_TIER3_POLICY, loadTier3Policy, saveTier3Policy, type Tier3PolicySettings } from '@/lib/rpg/policy';
import { trackTelemetry } from '@/lib/rpg/telemetry';

export function RPGInterface() {
  const { user, metadata } = useCurrentUser();
  const { nostr } = useNostr();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home'>('creation');
  const [homeTab, setHomeTab] = useState<'events' | 'mainQuest' | 'profile'>('events');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('');
  const [selectedNetworkMember, setSelectedNetworkMember] = useState<NetworkPresenceMember | null>(null);
  const [chapterOpened, setChapterOpened] = useState(false);
  const [tier3Policy, setTier3Policy] = useState<Tier3PolicySettings>(DEFAULT_TIER3_POLICY);
  const networkPresence = useNetworkPresence(user?.pubkey);
  const echoes = useEchoes(user?.pubkey);
  const phase2Signals = usePhase2Signals(user?.pubkey);
  const homeland = useHomeland(metadata?.nip05);
  const { toast } = useToast();

  useEffect(() => {
    const existing = loadMVPCharacter();
    if (existing) {
      setCharacter(existing);
      setScreen('home');
      return;
    }
    setScreen('creation');
    setTier3Policy(loadTier3Policy());
  }, []);

  const upcomingFeatures = useMemo(
    () => ['Map', 'Shop', 'Guild', 'Journal', 'Settings'],
    [],
  );
  const scryingPool = useScryingPool(character?.discoveredLocations ?? [], networkPresence.data?.topMembers);
  const hasChosenMarketQuest = character?.mainQuestChoices.some((choice) => choice.questId === 'market-money-001') ?? false;
  const marketChoice = character?.mainQuestChoices.find((choice) => choice.questId === 'market-money-001');
  const hasUnreadChapter = !hasChosenMarketQuest;
  const chapterLines = [
    'The village burns.',
    'Smoke rolls across the market square.',
    'A purse slips from a stranger\'s hand and lands near your feet.',
  ];

  useEffect(() => {
    if (echoes.data?.rumorSeeds.length) {
      trackTelemetry('echoes_generated', { count: echoes.data.rumorSeeds.length });
    }
  }, [echoes.data?.rumorSeeds.length]);

  useEffect(() => {
    if (scryingPool.glimmers.length > 0) {
      trackTelemetry('scrying_glimmers_seen', { count: scryingPool.glimmers.length });
    }
  }, [scryingPool.glimmers.length]);

  const handleCreateStranger = () => {
    const normalizedCharacterName = characterNameInput.trim() || 'Nameless Stranger';
    const normalizedGender = genderInput.trim() || 'Unknown';
    const npub = user ? nip19.npubEncode(user.pubkey) : undefined;
    const newCharacter: MVPCharacter = {
      id: user?.pubkey ?? `temp-${Date.now()}`,
      createdAt: Date.now(),
      level: 1,
      role: 'stranger',
      characterName: normalizedCharacterName,
      gender: normalizedGender,
      mainQuestChoices: [],
      discoveredLocations: ['market-square'],
      pubkey: user?.pubkey,
      npub,
    };
    saveMVPCharacter(newCharacter);
    setCharacter(newCharacter);
    setScreen('home');

    // Publish presence for social network discovery.
    // This keeps local-first UX while enabling cross-account visibility.
    if (user) {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);
      user.signer.signEvent({
        kind: 30000,
        content: JSON.stringify({
          app: 'no-stranger-game',
          level: 1,
          role: 'stranger',
          characterName: normalizedCharacterName,
          gender: normalizedGender,
          classLabel: 'Unchosen',
          discoveredLocations: ['market-square'],
          createdAt: newCharacter.createdAt,
        }),
        tags: [
          ['d', 'opt-in'],
          ['t', 'no-stranger-game'],
          ['alt', 'No Stranger Game player presence opt-in'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      }).then((signedEvent) => {
        presenceNostr.event(signedEvent).then(() => {
          toast({
            title: 'Presence published',
            description: 'Published to Ditto + Primal relays.',
          });
          networkPresence.refetch();
        }).catch((error: unknown) => {
          console.error('Failed to publish presence event:', error);
          toast({
            title: 'Presence not published',
            description: 'Character saved locally, but Ditto/Primal publish failed.',
            variant: 'destructive',
          });
        });
      });
    }
  };

  const handleMainQuestChoice = (option: 'A' | 'B' | 'C') => {
    if (!character) return;
    const chapterWindowId = getChapterWindowId();
    const identityKey = user?.pubkey ?? character.id;
    if (hasCanonicalChoiceForWindow(chapterWindowId, identityKey)) {
      trackTelemetry('chapter_duplicate_rejected', { chapterWindowId });
      toast({
        title: 'Choice already sealed',
        description: 'You already recorded a canonical choice for this chapter window.',
        variant: 'destructive',
      });
      return;
    }
    const consequenceByOption: Record<'A' | 'B' | 'C', string> = {
      A: 'You returned the money. Someone noticed.',
      B: 'You kept the money. The market felt colder.',
      C: 'You walked away. The moment followed you anyway.',
    };

    const updatedCharacter: MVPCharacter = {
      ...character,
      mainQuestChoices: [
        ...character.mainQuestChoices,
        {
          questId: 'market-money-001',
          prompt: 'You are in a crowded market and you see the person in front of you drop some money.',
          option,
          consequence: consequenceByOption[option],
          chosenAt: Math.floor(Date.now() / 1000),
        },
      ],
      level: character.level + 1,
      discoveredLocations: Array.from(
        new Set([
          ...(character.discoveredLocations ?? ['market-square']),
          option === 'A' ? 'old-library' : option === 'B' ? 'coin-vault' : 'silent-alley',
        ]),
      ),
      chapterWindowIds: Array.from(new Set([...(character.chapterWindowIds ?? []), chapterWindowId])),
    };

    saveMVPCharacter(updatedCharacter);
    setCharacter(updatedCharacter);
    markCanonicalChoiceForWindow(chapterWindowId, identityKey, `${chapterWindowId}:${option}`);
    trackTelemetry('chapter_choice_recorded', { option, chapterWindowId });
    setHomeTab('events');
    toast({
      title: 'Crucial choice recorded',
      description: consequenceByOption[option],
    });

    if (user) {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);
      user.signer.signEvent({
        kind: 30000,
        content: JSON.stringify({
          app: 'no-stranger-game',
          level: updatedCharacter.level,
          role: 'stranger',
          characterName: updatedCharacter.characterName,
          gender: updatedCharacter.gender,
          classLabel: option,
          discoveredLocations: updatedCharacter.discoveredLocations ?? [],
          createdAt: updatedCharacter.createdAt,
        }),
        tags: [
          ['d', 'opt-in'],
          ['t', 'no-stranger-game'],
          ['alt', 'No Stranger Game player presence opt-in'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      }).then((signedEvent) => {
        presenceNostr.event(signedEvent).catch((error: unknown) => {
          console.error('Failed to publish updated class label:', error);
        });
      });

      user.signer.signEvent({
        kind: CHAPTER_PROOF_KIND,
        content: JSON.stringify({
          app: 'no-stranger-game',
          chapterId: 'market-money-001',
          chapterWindowId,
          selectedOption: option,
          prompt: 'You are in a crowded market and you see the person in front of you drop some money.',
          consequence: consequenceByOption[option],
          characterId: updatedCharacter.id,
          recordedAt: Math.floor(Date.now() / 1000),
        }),
        tags: [
          ['t', 'no-stranger-game'],
          ['chapter', 'market-money-001'],
          ['window', chapterWindowId],
          ['choice', option],
          ['prev', character.chapterProofHead ?? 'genesis'],
          ['alt', 'No Stranger Game crucial choice proof'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      }).then((signedEvent) => {
        const withProofHead: MVPCharacter = { ...updatedCharacter, chapterProofHead: signedEvent.id };
        saveMVPCharacter(withProofHead);
        setCharacter(withProofHead);
        nostr.event(signedEvent).catch((error: unknown) => {
          console.error('Failed to publish chapter proof event:', error);
        });
      }).catch((error: unknown) => {
        console.error('Failed to sign chapter proof event:', error);
      });
    }
  };

  const updateTier3Policy = (nextPolicy: Tier3PolicySettings) => {
    setTier3Policy(nextPolicy);
    saveTier3Policy(nextPolicy);
    trackTelemetry('tier3_policy_updated', {
      experimentalEnabled: nextPolicy.experimentalEnabled,
      visibility: nextPolicy.visibility,
    });
  };

  const handleNewGame = () => {
    clearMVPCharacter();
    setCharacter(null);
    setScreen('creation');
  };

  // Show login screen if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-gray-900 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">
              No Stranger Game
            </h1>
            <p className="text-gray-300">
              An RPG that lives inside your social network
            </p>
          </div>
          <div className="w-full border-2 border-dashed border-gray-600 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-white text-center">
              Connect Your Nostr Account
            </h2>
            <LoginArea className="w-full flex flex-col gap-3" />
          </div>
          <p className="text-sm text-gray-400 text-center">
            Once connected, you'll enter the game world
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'creation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold text-zinc-100">No Stranger Game</h1>
            <p className="text-zinc-300 font-serif">
              A seasonal dark-fantasy journey where your choices shape your path.
            </p>
          </div>
          <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <CardTitle>Begin as a Level 1 Stranger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300 font-serif">
                Character creation is now hidden inside your Main Quest. Start as a stranger and discover who you are through your decisions.
              </p>
              <div className="space-y-2">
                <Label htmlFor="character-name">Character Name</Label>
                <Input
                  id="character-name"
                  placeholder="Name your stranger"
                  value={characterNameInput}
                  onChange={(event) => setCharacterNameInput(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-gender">Gender</Label>
                <Input
                  id="character-gender"
                  placeholder="How does your character identify?"
                  value={genderInput}
                  onChange={(event) => setGenderInput(event.target.value)}
                />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleCreateStranger}>
                Enter the Season
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 p-3 md:p-6">
      <div className="mx-auto w-full max-w-3xl py-4 md:py-6 space-y-5">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400 ember-glow" aria-hidden="true" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 font-mono">Season III</p>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100" onClick={handleNewGame}>
              New
            </Button>
          </div>
        </div>

        {homeTab === 'events' && (
          <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-zinc-300 font-serif">
                You find yourself in a strange place at a strange time. You are a level 1 stranger. Your character will gain experience and make choices automatically. To progress in the game simply check the Main Quest each day and make your choices.
              </p>
              {character.mainQuestChoices.length > 0 && (
                <p className="text-zinc-200 font-serif">
                  Latest consequence: {character.mainQuestChoices[character.mainQuestChoices.length - 1].consequence}
                </p>
              )}
              {homeland.homelandFlavorLine && (
                <p className="text-zinc-400 text-sm font-serif">{homeland.homelandFlavorLine}</p>
              )}
              {echoes.data?.eventsFlavorLines.map((line) => (
                <p key={line} className="text-zinc-300 text-sm font-serif">{line}</p>
              ))}
              {phase2Signals.data && (
                <div className="rounded border border-zinc-700/70 bg-zinc-800/40 p-3 space-y-1">
                  <p className="text-zinc-300 text-sm font-serif">
                    Blessings: <span className="font-mono">{phase2Signals.data.positiveReactions24h}</span>
                    {' '}| Curses: <span className="font-mono">{phase2Signals.data.negativeReactions24h}</span>
                  </p>
                  <p className="text-zinc-400 text-xs font-mono uppercase">
                    Relay difficulty: {phase2Signals.data.relayDifficultyBand}
                  </p>
                  {phase2Signals.data.grayLadyHint && (
                    <p className="text-zinc-400 text-xs font-serif">{phase2Signals.data.grayLadyHint}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {homeTab === 'mainQuest' && (
          <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100 overflow-hidden">
            <CardHeader className="border-b border-zinc-700/60">
              <CardTitle className="font-serif text-2xl">Chapter View</CardTitle>
              <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                {hasChosenMarketQuest ? 'Sealed Choice Recorded' : 'Unopened Letter'}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {!chapterOpened && !hasChosenMarketQuest && (
                <button
                  type="button"
                  onClick={() => setChapterOpened(true)}
                  className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-4 py-8 text-center transition hover:bg-zinc-800/80"
                >
                  <p className="text-zinc-200 font-serif text-lg">Press to crack the wax seal</p>
                  <p className="text-zinc-500 text-xs mt-2 font-mono">Your daily chapter waits in silence.</p>
                </button>
              )}

              {(chapterOpened || hasChosenMarketQuest) && (
                <div className="space-y-2">
                  {chapterLines.map((line, idx) => (
                    <p
                      key={line}
                      className="text-zinc-200 font-serif text-xl leading-relaxed chapter-line"
                      style={{ animationDelay: `${idx * 120}ms` }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
              {echoes.data?.mainQuestFlavorLine && (
                <p className="text-zinc-400 text-sm font-serif">{echoes.data.mainQuestFlavorLine}</p>
              )}

              {hasChosenMarketQuest ? (
                <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/60 p-4 space-y-2">
                  <p className="text-zinc-300 font-serif">
                    This chapter is now immutable. Return tomorrow for the next unfolding.
                  </p>
                  <p className="text-zinc-100 font-mono">
                    Signed choice: {marketChoice?.option ?? 'Unknown'}
                  </p>
                  <p className="text-zinc-400 text-sm font-serif">{marketChoice?.consequence}</p>
                </div>
              ) : chapterOpened ? (
                <div className="space-y-2">
                  <p className="text-zinc-300 font-serif">Do you:</p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="choice-smudge rounded-md border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-left text-zinc-200 font-serif"
                      onClick={() => handleMainQuestChoice('A')}
                    >
                      ▸ Save the scholar. Return the money.
                    </button>
                    <button
                      type="button"
                      className="choice-smudge rounded-md border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-left text-zinc-200 font-serif"
                      onClick={() => handleMainQuestChoice('B')}
                    >
                      ▸ Keep the coins. Keep walking.
                    </button>
                    <button
                      type="button"
                      className="choice-smudge rounded-md border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-left text-zinc-200 font-serif"
                      onClick={() => handleMainQuestChoice('C')}
                    >
                      ▸ Say nothing. Let fate decide.
                    </button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {homeTab === 'profile' && (
          <CharacterSheet
            character={character}
            onBack={() => setHomeTab('events')}
            onNewGame={handleNewGame}
          />
        )}

        <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
          <CardHeader>
            <CardTitle>Network Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkPresence.isLoading ? (
              <p className="text-zinc-300 font-serif">Listening for nearby souls...</p>
            ) : networkPresence.data && networkPresence.data.totalOptedIn > 0 ? (
              <>
                <p className="text-zinc-200 font-serif">
                  You sense <span className="font-mono">{networkPresence.data.totalOptedIn}</span> known souls in the mist.
                </p>
                <p className="text-zinc-300 text-sm font-serif">
                  Closest lights: {networkPresence.data.topMembers.map((member) => `${member.characterName} (${member.nostrName})`).join(', ')}
                  {networkPresence.data.totalOptedIn > networkPresence.data.topMembers.length
                    ? ` ...and ${networkPresence.data.totalOptedIn - networkPresence.data.topMembers.length} more.`
                    : '.'}
                </p>

                <div className="space-y-2">
                  {networkPresence.data.topMembers.map((member) => (
                    <button
                      key={member.pubkey}
                      onClick={() => setSelectedNetworkMember(member)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/70 p-3 text-left hover:bg-zinc-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.picture} alt={member.nostrName} />
                          <AvatarFallback>{member.characterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-zinc-100 font-medium">{member.characterName}</p>
                          <p className="text-zinc-300 text-sm">{member.nostrName}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-zinc-300 font-serif">No known souls have crossed the threshold yet.</p>
            )}
          </CardContent>
        </Card>

        {selectedNetworkMember && (
          <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <CardTitle>Traveler Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedNetworkMember.picture} alt={selectedNetworkMember.nostrName} />
                  <AvatarFallback>{selectedNetworkMember.characterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-zinc-100 font-medium">{selectedNetworkMember.characterName}</p>
                  <p className="text-zinc-300 text-sm">{selectedNetworkMember.nostrName}</p>
                </div>
              </div>
              <p className="text-zinc-200 text-sm">
                Main Quest Class: <span className="font-mono">{selectedNetworkMember.classLabel}</span>
              </p>
              <p className="text-zinc-300 text-sm break-all">
                npub: <span className="font-mono">{nip19.npubEncode(selectedNetworkMember.pubkey)}</span>
              </p>
              <p className="text-zinc-300 text-sm">
                Glimpsed locations: <span className="font-mono">{(selectedNetworkMember.discoveredLocations ?? []).join(', ') || 'none'}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
          <CardHeader>
            <CardTitle>Scrying Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scryingPool.glimmers.length === 0 ? (
              <p className="text-zinc-300 font-serif">No distant places shimmer yet.</p>
            ) : (
              scryingPool.glimmers.slice(0, 5).map((glimmer) => (
                <p key={glimmer.locationId} className="text-zinc-300 text-sm font-serif">
                  {glimmer.locationId} appears as a locked glimmer ({glimmer.seenByCount} travelers).
                </p>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
          <CardHeader>
            <CardTitle>Tier 3 Policy Gates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>Enable experimental social mechanics</span>
              <input
                type="checkbox"
                checked={tier3Policy.experimentalEnabled}
                onChange={(event) => updateTier3Policy({ ...tier3Policy, experimentalEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Zap influence</span>
              <input
                type="checkbox"
                checked={tier3Policy.zapInfluenceEnabled}
                onChange={(event) => updateTier3Policy({ ...tier3Policy, zapInfluenceEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Trauma shadows</span>
              <input
                type="checkbox"
                checked={tier3Policy.traumaEnabled}
                onChange={(event) => updateTier3Policy({ ...tier3Policy, traumaEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Scars from reports</span>
              <input
                type="checkbox"
                checked={tier3Policy.scarsEnabled}
                onChange={(event) => updateTier3Policy({ ...tier3Policy, scarsEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Summoning ghosts</span>
              <input
                type="checkbox"
                checked={tier3Policy.summoningEnabled}
                onChange={(event) => updateTier3Policy({ ...tier3Policy, summoningEnabled: event.target.checked })}
              />
            </label>
          </CardContent>
        </Card>

        <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
          <CardHeader>
            <CardTitle>Presence Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-zinc-300">
              Your npub:{' '}
              <span className="font-mono break-all">
                {user ? nip19.npubEncode(user.pubkey) : 'not logged in'}
              </span>
            </p>
            <p className="text-zinc-300">
              Self presence live:{' '}
              <span className="font-mono">
                {networkPresence.data?.diagnostics.selfPresenceLive ? 'yes' : 'no'}
              </span>
            </p>
            <p className="text-zinc-300">
              Follows: <span className="font-mono">{networkPresence.data?.diagnostics.followsCount ?? 0}</span>
              {' '}| Followers: <span className="font-mono">{networkPresence.data?.diagnostics.followersCount ?? 0}</span>
            </p>
            <p className="text-zinc-300">
              Network total: <span className="font-mono">{networkPresence.data?.diagnostics.networkCount ?? 0}</span>
              {' '}| Opted-in found: <span className="font-mono">{networkPresence.data?.diagnostics.optedInCount ?? 0}</span>
            </p>
            <p className="text-zinc-300">
              Relays:{' '}
              <span className="font-mono">
                {(networkPresence.data?.diagnostics.relays ?? PRESENCE_RELAYS).join(', ')}
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {upcomingFeatures.map((feature) => (
            <Card key={feature} className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
              <CardHeader>
                <CardTitle>{feature}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 font-serif">Coming soon in a future season.</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-700/70 bg-zinc-950/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-around px-3 py-2">
            {[
              { key: 'events', icon: '◈', label: 'Map' },
              { key: 'mainQuest', icon: '✶', label: 'Companion' },
              { key: 'profile', icon: '◉', label: 'Profile' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setHomeTab(item.key as 'events' | 'mainQuest' | 'profile')}
                className="group relative flex h-11 w-11 items-center justify-center rounded-md text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                aria-label={item.label}
                title={item.label}
              >
                <span className={(item.key === 'mainQuest' && hasUnreadChapter) ? 'ember-glow rounded-full px-2 py-0.5' : ''}>
                  {item.icon}
                </span>
                <span className="pointer-events-none absolute -top-6 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300 opacity-0 transition group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}