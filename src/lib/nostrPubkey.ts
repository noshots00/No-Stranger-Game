/** Lowercase hex pubkey for stable comparisons and Map keys (Nostr uses 64-char hex). */
export function normalizePubkeyHex(pubkey: string): string {
  return pubkey.trim().toLowerCase();
}

export function pubkeysEqual(a: string, b: string): boolean {
  return normalizePubkeyHex(a) === normalizePubkeyHex(b);
}
