import { useEffect, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import type { MVPCharacter } from '@/lib/rpg/utils';
import {
  AUTONOMOUS_SNAPSHOT_KIND,
  addDaysToTickId,
  getCurrentUtcTickId,
  shouldSimulateTick,
  simulateAutonomousDay,
  type AutonomousState,
} from '@/lib/rpg/autonomousSimulation';
import { normalizeLocationId } from '@/lib/rpg/locations';

const TRAIT_POOL = [
  'Patient', 'Risk-Taker', 'Night Owl', 'Fleet Footed', 'Steady Hands', 'Silver Tongue', 'Strong Back',
  'Myco-Curious', 'Disciplined', 'Cunning', 'Charming', 'Forager', 'Hunter', 'Faithful', 'Humble', 'Survivor', 'Gentle',
];

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const deterministicHiddenTraits = (character: MVPCharacter): string[] => {
  const seed = `${character.id}:${character.createdAt}:${character.race}:${character.profession}:${character.mainQuestChoices.map((choice) => choice.option).join('|')}`;
  const offset = hashString(seed) % TRAIT_POOL.length;
  const picked: string[] = [];
  for (let i = 0; i < 8; i++) {
    const trait = TRAIT_POOL[(offset + i * 3) % TRAIT_POOL.length];
    if (!picked.includes(trait)) picked.push(trait);
  }
  return picked;
};

const defaultAutonomousState = (character: MVPCharacter): AutonomousState => ({
  locationId: normalizeLocationId(character.locationId ?? ((character.discoveredLocations ?? []).includes('forest-edge') ? 'forest-edge' : 'market-square')),
  gold: character.gold ?? 0,
  health: character.health ?? 100,
  professionLabel: character.profession ?? 'Unskilled',
  visibleTraits: character.visibleTraits ?? [],
  hiddenTraits: character.hiddenTraits ?? deterministicHiddenTraits(character),
  injuries: character.injuries ?? [],
  inventory: character.inventory ?? [],
  shelterType: character.shelterType ?? 'shared',
  lastSimulatedTick: character.lastSimulatedTick,
  dailyLogs: character.dailyLogs ?? [],
  exploreIntent: character.exploreIntent,
});

const parseSnapshot = (event: NostrEvent | undefined): AutonomousState | null => {
  if (!event) return null;
  try {
    const parsed = JSON.parse(event.content) as AutonomousState;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.inventory)) {
      parsed.inventory = [];
    }
    return parsed;
  } catch {
    return null;
  }
};

export function useAutonomousState(character: MVPCharacter | null, userPubkey?: string) {
  const { nostr } = useNostr();
  const [state, setState] = useState<AutonomousState | null>(null);
  const [isTicking, setIsTicking] = useState(false);
  const [relayLoaded, setRelayLoaded] = useState(false);

  useEffect(() => {
    if (!character) {
      setState(null);
      return;
    }
    setState(defaultAutonomousState(character));
  }, [character]);

  useEffect(() => {
    if (!character || !userPubkey) return;
    let mounted = true;
    setRelayLoaded(false);
    nostr.query(
      [{ kinds: [AUTONOMOUS_SNAPSHOT_KIND], authors: [userPubkey], '#character': [character.id], '#t': ['no-stranger-game'], limit: 20 }],
      { signal: AbortSignal.timeout(5000) },
    ).then((events) => {
      if (!mounted || events.length === 0) {
        if (mounted) setRelayLoaded(true);
        return;
      }
      const latest = [...events].sort((a, b) => b.created_at - a.created_at)[0];
      const parsed = parseSnapshot(latest);
      if (parsed) setState(parsed);
      setRelayLoaded(true);
    }).catch(() => {
      if (mounted) setRelayLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [character, userPubkey, nostr]);

  const tickWindowId = getCurrentUtcTickId();

  const runTickForWindow = async (targetTickWindowId: string) => {
    if (!character || !state) return null;
    if (!shouldSimulateTick(state, targetTickWindowId)) return state;
    setIsTicking(true);
    const result = simulateAutonomousDay({
      characterId: character.id,
      tickWindowId: targetTickWindowId,
      state,
      choices: character.mainQuestChoices,
    });
    setState(result.state);
    setIsTicking(false);
    return result.state;
  };

  const runTick = async () => runTickForWindow(getCurrentUtcTickId());

  const skipDays = async (count: number) => {
    if (!character || !state) return null;
    if (count <= 0) return state;

    let simulated = state;
    setIsTicking(true);
    try {
      let baseTick = simulated.lastSimulatedTick ?? getCurrentUtcTickId();
      for (let i = 0; i < count; i++) {
        const targetTick = addDaysToTickId(baseTick, 1);
        const result = simulateAutonomousDay({
          characterId: character.id,
          tickWindowId: targetTick,
          state: simulated,
          choices: character.mainQuestChoices,
        });
        simulated = result.state;
        baseTick = targetTick;
      }
      setState(simulated);
      return simulated;
    } finally {
      setIsTicking(false);
    }
  };

  const queueExploreIntent = (intent: string) => {
    if (!state) return;
    setState({ ...state, exploreIntent: intent, locationId: normalizeLocationId(state.locationId) });
  };

  return {
    state,
    tickWindowId,
    isTicking,
    relayLoaded,
    runTick,
    runTickForWindow,
    skipDays,
    queueExploreIntent,
  };
}
