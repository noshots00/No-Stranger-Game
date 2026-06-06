import { describe, expect, it } from 'vitest';

import { gameRelayPublishError } from './publishGameRelayEvent';

describe('gameRelayPublishError', () => {
  it('maps AbortError to a friendly timeout message', () => {
    const err = gameRelayPublishError(new DOMException('The signal has been aborted', 'AbortError'));
    expect(err.message).toBe('Timed out publishing to game relays. Try again.');
  });

  it('preserves other Error messages', () => {
    const err = gameRelayPublishError(new Error('Relay rejected event'));
    expect(err.message).toBe('Relay rejected event');
  });
});
