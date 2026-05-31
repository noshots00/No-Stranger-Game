/** Play tab body: journal ledger or full-screen quest scene. */
export type PlaySurfaceMode =
  | { kind: 'journal' }
  | { kind: 'quest'; questId: string };

export function playSurfaceQuestId(mode: PlaySurfaceMode): string | null {
  return mode.kind === 'quest' ? mode.questId : null;
}
