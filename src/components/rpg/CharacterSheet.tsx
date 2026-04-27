import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MVPCharacter } from '@/lib/rpg/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip19 } from 'nostr-tools';
import { useNetworkPresence } from '@/hooks/useNetworkPresence';
import { useHomeland } from '@/hooks/useHomeland';

interface CharacterSheetProps {
  character: MVPCharacter;
  onBack: () => void;
  onNewGame: () => void;
}

export function CharacterSheet({ character, onBack, onNewGame }: CharacterSheetProps) {
  const { user, metadata } = useCurrentUser();
  const npub = user ? nip19.npubEncode(user.pubkey) : undefined;
  const networkPresence = useNetworkPresence(user?.pubkey);
  const classLabel = character.className || 'Wanderer';
  const nostrUsername = metadata?.display_name || metadata?.name || 'Unnamed Nostr User';
  const homeland = useHomeland(metadata?.nip05);

  return (
    <div className="space-y-6">
      <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Character Profile</CardTitle>
          <p className="text-zinc-300 font-serif">
            Your first seasonal identity is set. Future seasons can react to these choices.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Level</p>
              <p className="text-3xl font-mono text-zinc-100">{character.level}</p>
            </div>
            <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Class</p>
              <p className="text-3xl font-mono text-zinc-100">{classLabel}</p>
            </div>
          </div>

          {character.mainQuestChoices.length > 0 && (
            <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4">
              <p className="text-sm font-semibold text-zinc-100 mb-3">Crucial Choices</p>
              <div className="space-y-2">
                {character.mainQuestChoices.map((choice) => (
                  <div key={`${choice.questId}-${choice.chosenAt}`} className="rounded border border-zinc-700 p-3">
                    <p className="text-zinc-300 text-sm font-serif">{choice.prompt}</p>
                    <p className="text-zinc-100 font-mono mt-1">Choice: {choice.option}</p>
                    <p className="text-zinc-300 text-sm mt-1">{choice.consequence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Identity</p>
            <p className="text-sm text-zinc-200">
              Nostr Username: <span className="font-mono">{nostrUsername}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Player ID: <span className="font-mono">{character.id}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Character Name: <span className="font-mono">{character.characterName}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Race: <span className="font-mono">{character.race}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Profession: <span className="font-mono">{character.profession}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Starting City: <span className="font-mono">{character.startingCity}</span>
            </p>
            <p className="text-sm text-zinc-200">
              Homeland: <span className="font-mono">{homeland.homelandLabel}</span>
            </p>
            {npub ? (
              <p className="text-sm text-zinc-200 break-all">
                npub: <span className="font-mono">{npub}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-300">
                No Nostr login detected. Using temporary local identity.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Network Presence</p>
            {networkPresence.isLoading ? (
              <p className="text-sm text-zinc-300 font-serif">Listening for nearby souls...</p>
            ) : networkPresence.data && networkPresence.data.totalOptedIn > 0 ? (
              <p className="text-sm text-zinc-200 font-serif">
                {networkPresence.data.totalOptedIn} known souls in your network.
              </p>
            ) : (
              <p className="text-sm text-zinc-300 font-serif">
                No known souls have crossed the threshold yet.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onBack} variant="outline" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800">
              Back to Home
            </Button>
            <Button onClick={onNewGame} variant="destructive">
              New Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}