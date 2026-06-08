/** Pit UI copy — mirrors arena identity subtitle pattern. */
export function formatBlobbiIdentitySubtitle(args: {
  stage: string;
  ownerName?: string;
  size?: string | null;
}): string {
  const parts: string[] = [];
  const stage = args.stage.trim();
  if (stage) parts.push(stage.charAt(0).toUpperCase() + stage.slice(1));
  const size = args.size?.trim();
  if (size) parts.push(size);
  const owner = args.ownerName?.trim();
  if (owner) parts.push(owner);
  return parts.join(' · ');
}

export function formatBlobbiFightLine(
  won: boolean,
  opponentName: string,
  myHealth: number,
  opponentHealth: number
): string {
  const verb = won ? 'defeated' : 'lost to';
  return `You ${verb} ${opponentName} (HP ${myHealth} vs ${opponentHealth})`;
}
