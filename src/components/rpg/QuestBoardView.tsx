import { useMemo, useState } from 'react';
import { usePlayerQuestBoard } from '@/hooks/usePlayerQuestBoard';
import type { NetworkPresenceMember, MVPCharacter } from '@/lib/rpg/utils';
import { applyPostedQuestToCharacter, applyQuestCompletionToCharacter } from '@/lib/rpg/playerQuests';
import { getItemName } from '@/lib/rpg/items';
import { PostQuestModal } from './PostQuestModal';

interface QuestBoardViewProps {
  character: MVPCharacter;
  followsPlayingCount: number;
  activePlayersCount: number;
  topMembers: NetworkPresenceMember[];
  onUpdateCharacter: (next: MVPCharacter) => void;
}

export function QuestBoardView({
  character,
  followsPlayingCount,
  activePlayersCount,
  topMembers,
  onUpdateCharacter,
}: QuestBoardViewProps) {
  const [showPostModal, setShowPostModal] = useState(false);
  const { quests, recentCompletions, isLoading, refreshBoard, postQuest, acceptQuest, completeQuest, settleExpiredQuest } = usePlayerQuestBoard();

  const myPubkey = character.pubkey;
  const completionsPreview = useMemo(() => recentCompletions.slice(0, 4), [recentCompletions]);

  return (
    <section className="rounded-xl p-4 space-y-4" style={{ background: 'var(--surface)' }}>
      <div className="rounded-lg p-3" style={{ background: 'var(--surface-dim)' }}>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>World Presence</p>
        <p className="font-cormorant text-xl" style={{ color: 'var(--ink)' }}>
          {activePlayersCount} players in the world
        </p>
        <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
          {followsPlayingCount} of your follows/followers are playing.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {topMembers.slice(0, 5).map((member) => (
          <span key={member.pubkey} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--void)', color: 'var(--ink-dim)' }}>
            {member.characterName}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>Quest Board</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refreshBoard()} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--void)', color: 'var(--ink-dim)' }}>
            Refresh
          </button>
          <button type="button" onClick={() => setShowPostModal(true)} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--ember)', color: 'var(--void)' }}>
            + Post Quest
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Recent Completions</p>
        {completionsPreview.length > 0 ? completionsPreview.map((completion) => (
          <p key={`${completion.questId}-${completion.pubkey}`} className="text-sm" style={{ color: 'var(--ink-dim)' }}>
            {completion.quantity}x {getItemName(completion.item)} delivered by {completion.pubkey.slice(0, 10)}...
          </p>
        )) : (
          <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>No completions yet.</p>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>Loading quests...</p>
      ) : null}

      <div className="space-y-3">
        {quests.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm" style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink-dim)' }}>
            No active quests yet. Accept or post one to leave your mark on the world.
          </div>
        ) : quests.map((quest) => {
          const mine = myPubkey === quest.posterPubkey;
          const itemCount = character.inventory.find((entry) => entry.itemId === quest.requestedItem)?.quantity ?? 0;
          const canComplete = itemCount > 0 && quest.remainingEscrow > 0;

          return (
            <article key={quest.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--ink-ghost)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/placeholders/portraits/generic-npc.svg"
                    alt="Quest poster portrait"
                    className="h-10 w-10 rounded object-cover border"
                    style={{ borderColor: 'var(--ink-ghost)' }}
                  />
                  <div>
                  <p className="font-cormorant text-xl" style={{ color: 'var(--ink)' }}>{quest.title}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-ghost)' }}>
                    by {quest.alias || quest.posterPubkey.slice(0, 12)}
                  </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ember)' }}>{quest.bountyPerUnit} gold / unit</p>
                  <p className="text-xs" style={{ color: 'var(--ink-ghost)' }}>Escrow: {quest.remainingEscrow}/{quest.totalEscrow}</p>
                </div>
              </div>

              <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>{quest.description}</p>
              <p className="text-xs" style={{ color: 'var(--ink-ghost)' }}>
                Need: {getItemName(quest.requestedItem)} · Claimed by {quest.acceptedCount} players · Max units {quest.maxUnits}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    acceptQuest.mutate(quest.id, {
                      onSuccess: () => {
                        onUpdateCharacter({
                          ...character,
                          acceptedQuests: Array.from(new Set([...character.acceptedQuests, quest.id])),
                        });
                      },
                    });
                  }}
                  disabled={acceptQuest.isPending}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: 'var(--void)', color: 'var(--ink)' }}
                >
                  Accept Quest
                </button>
                <button
                  type="button"
                  disabled={!canComplete || completeQuest.isPending || mine}
                  className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
                  style={{ background: 'var(--ember-dim)', color: 'var(--void)' }}
                  onClick={() => {
                    const quantity = Math.min(itemCount, Math.max(1, Math.floor(quest.remainingEscrow / quest.bountyPerUnit)));
                    completeQuest.mutate(
                      { quest, quantity },
                      {
                        onSuccess: () => {
                          const next = applyQuestCompletionToCharacter(character, quest, quantity);
                          onUpdateCharacter(next);
                        },
                      },
                    );
                  }}
                >
                  {mine ? 'Your Quest' : `Submit ${getItemName(quest.requestedItem)} (${itemCount})`}
                </button>
                {mine && quest.status === 'expired' ? (
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: 'var(--surface-dim)', color: 'var(--ink)' }}
                    onClick={() => {
                      settleExpiredQuest.mutate(quest, {
                        onSuccess: () => {
                          onUpdateCharacter({
                            ...character,
                            gold: (character.gold ?? 0) + quest.remainingEscrow + 1,
                            escrowedGold: Math.max(0, (character.escrowedGold ?? 0) - quest.remainingEscrow),
                          });
                        },
                      });
                    }}
                  >
                    Refund Expired
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {showPostModal ? (
        <PostQuestModal
          character={character}
          onClose={() => setShowPostModal(false)}
          onSubmit={async (input) => {
            const postedEvent = await postQuest.mutateAsync(input);
            const next = applyPostedQuestToCharacter(character, postedEvent.id, input.totalEscrow);
            onUpdateCharacter(next);
          }}
        />
      ) : null}
    </section>
  );
}
