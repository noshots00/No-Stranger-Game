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

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home'>('creation');
  const [homeTab, setHomeTab] = useState<'events' | 'mainQuest' | 'profile'>('events');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('');
  const [selectedNetworkMember, setSelectedNetworkMember] = useState<NetworkPresenceMember | null>(null);
  const networkPresence = useNetworkPresence(user?.pubkey);
  const { toast } = useToast();

  useEffect(() => {
    const existing = loadMVPCharacter();
    if (existing) {
      setCharacter(existing);
      setScreen('home');
      return;
    }
    setScreen('creation');
  }, []);

  const upcomingFeatures = useMemo(
    () => ['Map', 'Shop', 'Guild', 'Journal', 'Settings'],
    [],
  );

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
    };

    saveMVPCharacter(updatedCharacter);
    setCharacter(updatedCharacter);
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
    }
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-5">
          <h1 className="text-3xl font-semibold text-zinc-100">Home</h1>
          <p className="mt-2 text-zinc-300 font-serif">
            Your character is active. Check Events and Main Quest each day to progress.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant={homeTab === 'events' ? 'default' : 'outline'}
              className={homeTab === 'events' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
              onClick={() => setHomeTab('events')}
            >
              Events
            </Button>
            <Button
              variant={homeTab === 'mainQuest' ? 'default' : 'outline'}
              className={homeTab === 'mainQuest' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
              onClick={() => setHomeTab('mainQuest')}
            >
              Main Quest
            </Button>
            <Button
              variant={homeTab === 'profile' ? 'default' : 'outline'}
              className={homeTab === 'profile' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
              onClick={() => setHomeTab('profile')}
            >
              Character Profile
            </Button>
            <Button variant="destructive" onClick={handleNewGame}>
              New Game
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
            </CardContent>
          </Card>
        )}

        {homeTab === 'mainQuest' && (
          <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <CardTitle>Main Quest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.mainQuestChoices.some((choice) => choice.questId === 'market-money-001') ? (
                <p className="text-zinc-300 font-serif">
                  You already made today&apos;s crucial choice. Return tomorrow for the next chapter.
                </p>
              ) : (
                <>
                  <p className="text-zinc-300 font-serif">
                    You are in a crowded market and you see the person in front of you drop some money. Do you:
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => handleMainQuestChoice('A')}>
                      A) Give it back to them
                    </Button>
                    <Button variant="outline" onClick={() => handleMainQuestChoice('B')}>
                      B) Keep it
                    </Button>
                    <Button variant="outline" onClick={() => handleMainQuestChoice('C')}>
                      C) Act as if you didn&apos;t see it
                    </Button>
                  </div>
                </>
              )}
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
            </CardContent>
          </Card>
        )}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}