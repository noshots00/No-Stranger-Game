const NSEC_PATTERN = /^nsec1[a-zA-Z0-9]{58}$/;
const NSEC_TOKEN = /nsec1[a-zA-Z0-9]{58}/;

export type NostrKeyFileInput = {
  nsec: string;
  npub: string;
  siteLabel?: string;
  generatedAt?: Date;
};

/** Plain-text key file for new accounts — includes npub, nsec, usage, and security warnings. */
export function buildNostrKeyFileContent({
  nsec,
  npub,
  siteLabel = 'No Stranger Game',
  generatedAt = new Date(),
}: NostrKeyFileInput): string {
  const dateLine = generatedAt.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return [
    `${siteLabel} — Nostr account keys`,
    `Generated: ${dateLine}`,
    '',
    'PUBLIC KEY (npub)',
    'Safe to share. Other people and Nostr apps use this to identify you.',
    'The same npub works here, on Ditto, and across the wider Nostr network.',
    npub,
    '',
    'PRIVATE KEY (nsec)',
    'This is your entire Nostr identity — not just a password.',
    'Whoever holds this key can sign as you on every relay and app.',
    'There is no password reset, no support desk, and no account recovery.',
    'If you lose it, this account is gone forever.',
    'If someone else gets it, they can take over your identity permanently.',
    nsec,
    '',
    'NEVER',
    '- Share your nsec with anyone (players, mods, relays, or “support”).',
    '- Paste it into untrusted websites. A malicious page can steal your identity.',
    '- Leave this file in Downloads, email, chat logs, or unencrypted cloud folders.',
    '',
    'BACK UP NOW',
    '- Store a copy in a reputable password manager (Bitwarden, 1Password, etc.).',
    '- Write the nsec on paper and keep it in a safe place (lockbox, safe, etc.).',
    '- Keep more than one backup in different locations.',
    '- Test recovery: import the key into a trusted Nostr app or signer before you need it.',
    '',
    'SAFER DAY-TO-DAY SIGN-IN',
    'Browser signers (Soapbox Signer, Alby, nos2x) keep your key in an extension',
    'and sign for websites without exposing the nsec. Import this key into a signer',
    'when you use other Nostr apps on the web.',
    '',
    `LOG IN TO ${siteLabel.toUpperCase()}`,
    '- Open the game and choose Log in.',
    '- Prefer Upload key file and select this file.',
    '- Only paste the nsec on our login screen if you cannot use the file.',
    '',
  ].join('\n');
}

/** Extract nsec from a key file (legacy plain nsec or labeled multi-line format). */
export function parseNsecFromKeyFile(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (NSEC_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const tokenMatch = trimmed.match(NSEC_TOKEN);
  if (tokenMatch && NSEC_PATTERN.test(tokenMatch[0])) {
    return tokenMatch[0];
  }

  return null;
}
