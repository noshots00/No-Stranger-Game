import { nip19 } from 'nostr-tools';
import { describe, expect, it } from 'vitest';

import { dittoNaddrUrl, dittoNeventUrl, DITTO_PUB_ORIGIN } from './dittoExplorerUrl';

const EVENT_ID = 'a'.repeat(64);
const PUBKEY = 'b'.repeat(64);

describe('dittoExplorerUrl', () => {
  it('builds a ditto.pub nevent URL with game relay hints', () => {
    const url = dittoNeventUrl({
      eventId: EVENT_ID,
      authorPubkey: PUBKEY,
      kind: 14921,
    });
    expect(url.startsWith(`${DITTO_PUB_ORIGIN}/nevent1`)).toBe(true);

    const decoded = nip19.decode(url.slice(`${DITTO_PUB_ORIGIN}/`.length));
    expect(decoded.type).toBe('nevent');
    if (decoded.type !== 'nevent') return;
    expect(decoded.data.id).toBe(EVENT_ID);
    expect(decoded.data.author).toBe(PUBKEY);
    expect(decoded.data.kind).toBe(14921);
    expect(decoded.data.relays).toContain('wss://relay.ditto.pub');
    expect(decoded.data.relays).toContain('wss://relay.dreamith.to');
  });

  it('builds a ditto.pub naddr URL for blobbi state', () => {
    const url = dittoNaddrUrl({
      kind: 31124,
      pubkey: PUBKEY,
      identifier: 'blobbi-fluffy',
    });
    expect(url.startsWith(`${DITTO_PUB_ORIGIN}/naddr1`)).toBe(true);

    const decoded = nip19.decode(url.slice(`${DITTO_PUB_ORIGIN}/`.length));
    expect(decoded.type).toBe('naddr');
    if (decoded.type !== 'naddr') return;
    expect(decoded.data.kind).toBe(31124);
    expect(decoded.data.pubkey).toBe(PUBKEY);
    expect(decoded.data.identifier).toBe('blobbi-fluffy');
  });
});
