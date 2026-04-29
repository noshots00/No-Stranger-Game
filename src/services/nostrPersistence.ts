import type { DeepPartial, GameState, TutorialStep } from '@/types/game';

const RELAYS = ['wss://relay.nostr.band', 'wss://nos.lol', 'wss://relay.damus.io'];
const D_TAG = 'character-state';
const EVENT_KIND = 30000;
const STORAGE_KEY = 'nsg_game_state';
const SYNC_DEBOUNCE_MS = 3000;

type NostrEventPayload = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

interface Nip07Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: {
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }): Promise<NostrEventPayload>;
}

declare global {
  interface Window {
    nostr?: Nip07Signer;
  }
}

function createDefaultState(): GameState {
  return {
    version: 1,
    timestamp: Date.now(),
    tutorial: {
      step: 'intro_1',
      completed: false,
      name: '',
      race: '',
      guards: [],
    },
    unlocks: {
      map: false,
      profile: false,
      tavern: false,
      quests: false,
      activities: { hunt: false, forage: false, explore: false, questsTab: false },
    },
    character: {
      profession: 'Peasant',
      region: 'Unknown Region',
      shelter: 'Flophouse',
      traits: [],
      modifiers: {},
      hourlyCopper: 1,
      hourlyXp: 0,
      lastSimTime: Date.now(),
      day: 1,
      health: 100,
      maxHealth: 100,
      copperAccumulated: 0,
      xpAccumulated: 0,
    },
    completedQuestIds: [],
  };
}

function deepMergeState(base: GameState, patch: DeepPartial<GameState>): GameState {
  const patchModifiers: Record<string, number> = {};
  if (patch.character?.modifiers) {
    Object.entries(patch.character.modifiers).forEach(([key, value]) => {
      if (typeof value === 'number') patchModifiers[key] = value;
    });
  }

  return {
    ...base,
    ...patch,
    tutorial: { ...base.tutorial, ...patch.tutorial },
    unlocks: {
      ...base.unlocks,
      ...patch.unlocks,
      activities: { ...base.unlocks.activities, ...patch.unlocks?.activities },
    },
    character: {
      ...base.character,
      ...patch.character,
      modifiers: { ...base.character.modifiers, ...patchModifiers },
    },
    completedQuestIds: patch.completedQuestIds ?? base.completedQuestIds,
    timestamp: patch.timestamp ?? Date.now(),
  };
}

class NostrPersistence {
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Set<(state: GameState) => void>();
  private currentState: GameState = createDefaultState();

  loadLocal(): GameState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw) as DeepPartial<GameState>;
      const merged = deepMergeState(createDefaultState(), parsed);
      this.currentState = merged;
      return merged;
    } catch {
      const fallback = createDefaultState();
      this.currentState = fallback;
      return fallback;
    }
  }

  saveLocal(state: GameState): void {
    this.currentState = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    this.notify(state);
  }

  subscribe(cb: (state: GameState) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify(state: GameState): void {
    this.subscribers.forEach((cb) => cb(state));
  }

  async load(pubkey: string): Promise<GameState> {
    const localState = this.loadLocal();
    const remote = await this.fetchRemoteState(pubkey);
    if (!remote) return localState;

    const winner = remote.timestamp > localState.timestamp ? remote : localState;
    const merged = deepMergeState(createDefaultState(), winner);
    this.saveLocal(merged);
    return merged;
  }

  update(patch: DeepPartial<GameState>): GameState {
    const next = deepMergeState(this.currentState, patch);
    this.saveLocal(next);
    return next;
  }

  queueSave(pubkey: string, patch: DeepPartial<GameState>): void {
    const next = this.update(patch);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      void this.publish(pubkey, next);
    }, SYNC_DEBOUNCE_MS);
  }

  async forceSync(pubkey: string, patch?: DeepPartial<GameState>): Promise<boolean> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    const state = patch ? this.update(patch) : this.currentState;
    return this.publish(pubkey, state);
  }

  private async fetchRemoteState(pubkey: string): Promise<GameState | null> {
    for (const relay of RELAYS) {
      const event = await this.fetchLatestEvent(relay, pubkey);
      if (!event?.content) continue;
      try {
        const parsed = JSON.parse(event.content) as DeepPartial<GameState>;
        return deepMergeState(createDefaultState(), parsed);
      } catch {
        continue;
      }
    }
    return null;
  }

  private fetchLatestEvent(relayUrl: string, pubkey: string): Promise<NostrEventPayload | null> {
    return new Promise((resolve) => {
      const ws = new WebSocket(relayUrl);
      const reqId = crypto.randomUUID();
      let resolved = false;
      let latest: NostrEventPayload | null = null;
      const finish = (value: NostrEventPayload | null): void => {
        if (resolved) return;
        resolved = true;
        try {
          ws.send(JSON.stringify(['CLOSE', reqId]));
        } catch {
          // noop
        }
        ws.close();
        resolve(value);
      };

      const timer = setTimeout(() => finish(latest), 4500);

      ws.onopen = () => {
        ws.send(
          JSON.stringify([
            'REQ',
            reqId,
            { kinds: [EVENT_KIND], authors: [pubkey], '#d': [D_TAG], limit: 1 },
          ]),
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data as string) as [string, string, NostrEventPayload];
        if (data[0] === 'EVENT' && data[2]?.pubkey === pubkey) latest = data[2];
        if (data[0] === 'EOSE') {
          clearTimeout(timer);
          finish(latest);
        }
      };

      ws.onerror = () => {
        clearTimeout(timer);
        finish(latest);
      };
      ws.onclose = () => clearTimeout(timer);
    });
  }

  private async publish(pubkey: string, state: GameState): Promise<boolean> {
    if (!window.nostr) return false;
    try {
      const signerPubkey = await Promise.race<string>([
        window.nostr.getPublicKey(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('NIP-07 timeout')), 5000)),
      ]);
      if (signerPubkey !== pubkey) return false;

      const signed = await Promise.race([
        window.nostr.signEvent({
          pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: EVENT_KIND,
          tags: [['d', D_TAG], ['alt', 'No Stranger character state snapshot']],
          content: JSON.stringify(state),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('NIP-07 timeout')), 5000)),
      ]);

      for (const relay of RELAYS) {
        const ok = await this.publishToRelay(relay, signed);
        if (ok) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private publishToRelay(relayUrl: string, event: NostrEventPayload): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(relayUrl);
      const timer = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => ws.send(JSON.stringify(['EVENT', event]));
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data as string) as [string, string, boolean];
        if (data[0] === 'OK') {
          clearTimeout(timer);
          ws.close();
          resolve(Boolean(data[2]));
        }
      };
      ws.onerror = () => {
        clearTimeout(timer);
        ws.close();
        resolve(false);
      };
      ws.onclose = () => clearTimeout(timer);
    });
  }
}

export const nostrPersistence = new NostrPersistence();

export function clearPersistedGameState(): void {
  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key === STORAGE_KEY || key.startsWith('nsg_')) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => localStorage.removeItem(key));
}

export function deleteCharacterState(): void {
  clearPersistedGameState();
}

export function withTutorialStep(state: GameState, step: TutorialStep): GameState {
  return deepMergeState(state, {
    tutorial: {
      step,
      completed: step === 'idle_play',
    },
  });
}
