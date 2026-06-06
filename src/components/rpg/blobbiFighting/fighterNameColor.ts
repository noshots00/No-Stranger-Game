import type { BlobbiFighterSnapshot } from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';

/** Stable hue from blobbi id when trait color is unavailable. */
export function hashBlobbiIdToColor(blobbiId: string): string {
  let hash = 0;
  for (let i = 0; i < blobbiId.length; i += 1) {
    hash = (hash * 31 + blobbiId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue} 65% 62%)`;
}

export function fighterNameColor(
  fighter: Pick<BlobbiFighterSnapshot, 'blobbiId'>,
  myBlobbi?: Pick<BlobbiSnapshot, 'id' | 'baseColor'>
): string {
  if (myBlobbi && fighter.blobbiId === myBlobbi.id && myBlobbi.baseColor) {
    return myBlobbi.baseColor;
  }
  return hashBlobbiIdToColor(fighter.blobbiId);
}
