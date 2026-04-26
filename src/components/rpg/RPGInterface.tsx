import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CharacterSheet } from './CharacterSheet';
import { CharacterCreation } from './CharacterCreation';
import { LoginArea } from '@/components/auth/LoginArea';
import { clearMVPCharacter, loadMVPCharacter, saveMVPCharacter, type CreationAnswer, type MVPCharacter } from '@/lib/rpg/utils';
import { nip19 } from 'nostr-tools';
import { PRESENCE_RELAYS, useNetworkPresence } from '@/hooks/useNetworkPresence';
import { useToast } from '@/hooks/useToast';
import { useNostr } from '@nostrify/react';

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [character, setCharacter] = useState<MVPCharacter | null>(null);
  const [screen, setScreen] = useState<'creation' | 'home' | 'profile'>('creation');
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

  const handleCharacterCreated = (
    answers: [CreationAnswer, CreationAnswer, CreationAnswer],
    classId: number,
  ) => {
    const npub = user ? nip19.npubEncode(user.pubkey) : undefined;
    const newCharacter: MVPCharacter = {
      id: user?.pubkey ?? `temp-${Date.now()}`,
      createdAt: Date.now(),
      level: 1,
      classId,
      answers,
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
          classId,
          answers,
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
              A seasonal dark-fantasy journey where your first choices shape your path.
            </p>
          </div>
          <CharacterCreation onCharacterCreated={handleCharacterCreated} />
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  if (screen === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto py-8">
          <CharacterSheet
            character={character}
            onBack={() => setScreen('home')}
            onNewGame={handleNewGame}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-5">
          <h1 className="text-3xl font-semibold text-zinc-100">Home</h1>
          <p className="mt-2 text-zinc-300 font-serif">
            Your character is ready. Explore the upcoming systems for future seasons.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => setScreen('profile')}>
              Character Profile
            </Button>
            <Button variant="destructive" onClick={handleNewGame}>
              New Game
            </Button>
          </div>
        </div>

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
                  Closest lights: {networkPresence.data.topMembers.map((member) => member.displayName).join(', ')}
                  {networkPresence.data.totalOptedIn > networkPresence.data.topMembers.length
                    ? ` ...and ${networkPresence.data.totalOptedIn - networkPresence.data.topMembers.length} more.`
                    : '.'}
                </p>
              </>
            ) : (
              <p className="text-zinc-300 font-serif">No known souls have crossed the threshold yet.</p>
            )}
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