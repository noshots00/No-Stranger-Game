import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MVPCharacter } from '@/lib/rpg/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip19 } from 'nostr-tools';

interface CharacterSheetProps {
  character: MVPCharacter;
  onBack: () => void;
  onNewGame: () => void;
}

const choiceLabels = ['A', 'B', 'C'] as const;

export function CharacterSheet({ character, onBack, onNewGame }: CharacterSheetProps) {
  const { user } = useCurrentUser();
  const npub = user ? nip19.npubEncode(user.pubkey) : undefined;

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
              <p className="text-3xl font-mono text-zinc-100">Class {character.classId}</p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4">
            <p className="text-sm font-semibold text-zinc-100 mb-3">Creation Choices</p>
            <div className="grid grid-cols-3 gap-3">
              {character.answers.map((answer, index) => (
                <div key={`answer-${index}`} className="rounded border border-zinc-700 p-3 text-center">
                  <p className="text-xs text-zinc-400">Q{index + 1}</p>
                  <p className="text-xl font-mono text-zinc-100">{choiceLabels[answer]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Identity</p>
            <p className="text-sm text-zinc-200">
              Player ID: <span className="font-mono">{character.id}</span>
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