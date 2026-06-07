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
    'Safe to share. Others use this to identify you on Nostr and in the game.',
    npub,
    '',
    'SECRET KEY (nsec) — LIKE YOUR PASSWORD',
    'Never share this with anyone. Anyone with this key controls your account.',
    nsec,
    '',
    'IMPORTANT',
    '- Treat your secret key like a password.',
    '- This key cannot be changed.',
    '- If it is lost or compromised, it is impossible to regain control of this account.',
    '- Store this file offline in a safe place.',
    '',
    'HOW TO LOG IN',
    '- Open the game and choose Log in.',
    '- Paste the secret key (nsec1...) into the Secret Key field, or',
    '- Upload this file using the upload button on the Log in screen.',
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
