const BROADCAST_TEMPLATES = {
  RACE_REVEAL: 'A traveler awakens as {race}. The forest hums in recognition.',
  PROFESSION_UNLOCK: 'A traveler takes up the {profession} trade. The village notes their skill.',
  BOAR_CHOICE: 'A traveler faced the wild and chose to {choice}. The woods remember.',
  DAILY_SURVIVAL: 'Day {day} in the clearing. {name} endures.',
  TAVERN_SETTLED: 'A traveler claims a bunk in the tavern. The hearth welcomes them.',
  COMPANION_BOND: 'A bond forms with {companion}. Echoes linger in the clearing.',
  QUEST_COMPLETE: 'A traveler completes a task in the village. The ledger turns a page.',
} as const;

export type TemplateKey = keyof typeof BROADCAST_TEMPLATES;

interface BroadcastJob {
  id: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

interface Nip07Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: {
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }): Promise<{
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
  }>;
}

declare global {
  interface Window {
    nostr?: Nip07Signer;
  }
}

class PlayerBroadcastService {
  private queue: BroadcastJob[] = [];
  private lastBroadcast = 0;
  private readonly cooldownMs = 15 * 60 * 1000;
  private readonly storageKey = 'nsg_broadcast_queue';
  private readonly relays = [
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://relay.damus.io',
    'wss://relay.snort.social',
  ];

  constructor() {
    this.loadQueue();
    this.scheduleResume();
  }

  enqueue(templateKey: TemplateKey, variables?: Record<string, string>, priority: BroadcastJob['priority'] = 'medium') {
    let content: string = BROADCAST_TEMPLATES[templateKey];
    if (variables) {
      content = content.replace(/\{(\w+)\}/g, (_m, key: string) => variables[key] ?? key);
    }
    const job: BroadcastJob = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content,
      priority,
      createdAt: Date.now(),
    };

    if (this.queue.some((q) => q.content === job.content && Date.now() - q.createdAt < this.cooldownMs)) return;

    this.queue.push(job);
    this.queue.sort((a, b) => this.rankPriority(b.priority) - this.rankPriority(a.priority));
    this.saveQueue();
    void this.processNext();
  }

  private rankPriority(priority: BroadcastJob['priority']): number {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  }

  private async processNext() {
    if (this.queue.length === 0) return;
    if (Date.now() - this.lastBroadcast < this.cooldownMs) return;

    const job = this.queue.shift();
    if (!job) return;

    const success = await this.publishToRelays(job.content);
    if (success) {
      this.lastBroadcast = Date.now();
      this.saveQueue();
      setTimeout(() => void this.processNext(), this.cooldownMs);
      return;
    }

    this.queue.unshift(job);
    this.saveQueue();
  }

  private async publishToRelays(content: string): Promise<boolean> {
    if (!window.nostr) return false;
    try {
      const pubkey = await Promise.race([
        window.nostr.getPublicKey(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      const signed = await window.nostr.signEvent({
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        content,
        tags: [['t', 'no-stranger']],
        pubkey,
      });

      for (const relay of this.relays) {
        const ok = await this.sendToRelay(relay, signed);
        if (ok) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private sendToRelay(
    url: string,
    event: { id: string; pubkey: string; created_at: number; kind: number; tags: string[][]; content: string; sig: string },
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 4000);
      ws.onopen = () => ws.send(JSON.stringify(['EVENT', event]));
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data as string) as [string, string, boolean];
        if (data[0] === 'OK') {
          clearTimeout(timeout);
          ws.close();
          resolve(Boolean(data[2]));
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      };
      ws.onclose = () => clearTimeout(timeout);
    });
  }

  private saveQueue(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  private loadQueue(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.queue = JSON.parse(raw) as BroadcastJob[];
    } catch {
      this.queue = [];
    }
  }

  private scheduleResume(): void {
    window.addEventListener('focus', () => void this.processNext());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.processNext();
    });
  }
}

export const playerBroadcast = new PlayerBroadcastService();
