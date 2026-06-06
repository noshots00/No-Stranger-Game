import { nip19 } from 'nostr-tools';

import { GAME_RELAY_URLS } from '@/lib/gameRelays';

export const DITTO_PUB_ORIGIN = 'https://ditto.pub';

export function dittoNip19Url(identifier: string): string {
  return `${DITTO_PUB_ORIGIN}/${identifier}`;
}

export function dittoNeventUrl(args: {
  eventId: string;
  authorPubkey: string;
  kind: number;
  relays?: readonly string[];
}): string {
  const nevent = nip19.neventEncode({
    id: args.eventId,
    author: args.authorPubkey,
    kind: args.kind,
    relays: [...(args.relays ?? GAME_RELAY_URLS)],
  });
  return dittoNip19Url(nevent);
}

export function dittoNaddrUrl(args: {
  kind: number;
  pubkey: string;
  identifier: string;
  relays?: readonly string[];
}): string {
  const naddr = nip19.naddrEncode({
    kind: args.kind,
    pubkey: args.pubkey,
    identifier: args.identifier,
    relays: [...(args.relays ?? GAME_RELAY_URLS)],
  });
  return dittoNip19Url(naddr);
}
