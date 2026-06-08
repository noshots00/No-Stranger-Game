/** Seeded PRNG — deterministic given the same seed string. */
export type CombatRng = {
  randomInt: (min: number, max: number) => number;
  /** Roll 1–100 inclusive. */
  rollPercent: () => number;
  /** Roll 1–4 inclusive (25% increments). */
  rollQuarter: () => number;
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCombatRng(seed: string, roundOffset = 0): CombatRng {
  const base = hashSeed(`${seed}:${roundOffset}`);
  const next = mulberry32(base);

  const randomInt = (min: number, max: number): number => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi < lo) return lo;
    return Math.floor(next() * (hi - lo + 1)) + lo;
  };

  return {
    randomInt,
    rollPercent: () => randomInt(1, 100),
    rollQuarter: () => randomInt(1, 4),
  };
}

export function generateCombatSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
