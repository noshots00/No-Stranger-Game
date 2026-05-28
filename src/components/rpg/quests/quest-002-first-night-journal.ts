/** Short Play-tab journal recap for `quest-002-first-night`. */

function has(history: string[], choiceId: string): boolean {
  return history.includes(choiceId);
}

function buildDirectionClause(history: string[]): string | null {
  if (has(history, 'q2-look-water') || has(history, 'q2-go-west') || has(history, 'flavor-explore-west')) {
    if (has(history, 'q2-west-upstream')) return 'Heading west, you followed a stream upstream.';
    if (has(history, 'q2-west-downstream')) return 'Heading west, you followed a stream downstream.';
    if (has(history, 'q2-west-drink')) return 'Heading west, you found a stream and drank.';
    return 'Heading west, you followed a stream.';
  }
  if (has(history, 'q2-look-food') || has(history, 'q2-go-south') || has(history, 'flavor-explore-south')) {
    return 'You searched for food in the forest.';
  }
  if (
    has(history, 'q2-high-ground') ||
    has(history, 'q2-go-north') ||
    has(history, 'flavor-explore-north')
  ) {
    return 'You climbed toward high ground.';
  }
  if (has(history, 'q2-build-shelter')) {
    return 'You worked on a shelter as night approached.';
  }
  return null;
}

function buildNightClause(history: string[]): string {
  if (has(history, 'q1-dusk-build-shelter')) {
    return 'Darkness fell and you slept in a lean-to.';
  }
  if (has(history, 'q1-dark-yell')) {
    return 'Darkness fell and you called into the dark.';
  }
  if (has(history, 'q1-dark-creep')) {
    return 'Darkness fell and you slept on moonlit stone.';
  }
  if (has(history, 'q1-bugs-follow')) {
    return 'Darkness fell and you waited out the night on a ledge.';
  }
  if (has(history, 'q1-bugs-shelter')) {
    return 'Darkness fell and you slept beneath the trees.';
  }
  if (has(history, 'q1-dusk-keep-going')) {
    return 'Darkness fell and you spent a strange night in the forest.';
  }
  return 'Darkness fell and you survived the night.';
}

export function buildFirstNightJournalSummary(choiceHistory: string[]): string {
  const direction = buildDirectionClause(choiceHistory);
  const night = buildNightClause(choiceHistory);
  if (direction) return `${direction} ${night}`;
  return night;
}
