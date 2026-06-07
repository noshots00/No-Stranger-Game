import { useMemo } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { getGlobalGroupId } from '../chat/nip29Client';

type QueryStatus = 'pending' | 'error' | 'success';

type SocialTabProps = {
  activityRows: { pubkey: string; displayName: string; namedAt: number; detail: string }[];
  activityStatus: QueryStatus;
  lobbyNameMap: Map<string, string>;
  characterNameLabel: string;
  /** True when the player has set their character name (chat membership gate). */
  hasCharacter: boolean;
};

export function SocialTab({
  activityRows,
  activityStatus,
  lobbyNameMap,
  characterNameLabel,
  hasCharacter,
}: SocialTabProps) {
  const activityPrints = useMemo(
    () =>
      activityRows.map((row) => ({
        key: row.pubkey,
        atMs: row.namedAt * 1000,
        text: row.detail,
      })),
    [activityRows]
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden font-serif">
      <div className="facsimile-scroll-dialogue-inner flex min-h-0 min-w-0 flex-1 flex-col px-0">
        <ChatPanel
          groupId={getGlobalGroupId()}
          emptyHint="No one has spoken in the global lobby yet."
          characterNameLabel={characterNameLabel}
          speakerNameMap={lobbyNameMap}
          fillAvailableHeight
          hasCharacter={hasCharacter}
          activityPrints={activityPrints}
          activityLoading={activityStatus === 'pending'}
          activityError={activityStatus === 'error'}
        />
      </div>
    </section>
  );
}
