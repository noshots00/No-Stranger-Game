/** Short Play-tab journal recap for `quest-002-first-night` (Sunset). */

function has(history: string[], choiceId: string): boolean {
  return history.includes(choiceId);
}

function firstInHistory(history: string[], ids: readonly string[]): string | null {
  for (const id of history) {
    if (ids.includes(id)) return id;
  }
  return null;
}

const TREE_FALL_LINE = 'You fell from a tree and twisted your ankle.';

const BOAR_LINES: Record<string, string> = {
  'q1-origin-boar-strike': 'You fended off a boar by attacking it.',
  'q1-origin-boar-spark': 'You fended off a boar by using magic.',
  'q1-origin-boar-dodge': 'You fended off a boar by dodging it.',
  'q1-origin-boar-run': 'You fended off a boar by running from it.',
};

const BOAR_CHOICE_IDS = Object.keys(BOAR_LINES);

const DIRECTION_MATCHERS: { ids: readonly string[]; line: string }[] = [
  {
    ids: [
      'q2-look-water',
      'q2-go-west',
      'flavor-explore-west',
      'q2-west-upstream',
      'q2-west-downstream',
      'q2-west-drink',
    ],
    line: 'You looked for water.',
  },
  {
    ids: ['q2-look-food', 'q2-go-south', 'flavor-explore-south'],
    line: 'You looked for food.',
  },
  {
    ids: ['q2-high-ground', 'q2-go-north', 'flavor-explore-north', 'q2-north-continue', 'q1-dir-north'],
    line: 'You climbed toward high ground.',
  },
  {
    ids: ['q2-look-trails', 'q2-south-left', 'q2-south-right'],
    line: 'You searched for animal trails.',
  },
];

const SHELTER_LINE = 'You built a primitive shelter and rested for the night.';

function buildTreeFallClause(history: string[]): string | null {
  if (has(history, 'q2-tree-climb-higher')) return TREE_FALL_LINE;
  return null;
}

function buildBoarClause(history: string[]): string | null {
  const id = firstInHistory(history, BOAR_CHOICE_IDS);
  if (!id) return null;
  return BOAR_LINES[id] ?? null;
}

/** Water / food / high ground / trails only, in play order. */
function buildDirectionClauses(history: string[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const choiceId of history) {
    for (const { ids, line } of DIRECTION_MATCHERS) {
      if (!ids.includes(choiceId) || seen.has(line)) continue;
      seen.add(line);
      lines.push(line);
    }
  }
  return lines;
}

export function buildFirstNightJournalSummary(choiceHistory: string[]): string {
  const parts: string[] = [];
  const treeFall = buildTreeFallClause(choiceHistory);
  if (treeFall) parts.push(treeFall);
  const boar = buildBoarClause(choiceHistory);
  if (boar) parts.push(boar);
  parts.push(...buildDirectionClauses(choiceHistory));
  parts.push(SHELTER_LINE);
  return parts.join(' ');
}
