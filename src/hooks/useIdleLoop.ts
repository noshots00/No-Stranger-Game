import { useCallback, useEffect, useRef } from 'react';

import { runSimulation, type SimulationContext, type SimulationResult } from '@/services/idleSimulation';

export function useIdleLoop(
  context: SimulationContext | null,
  onSimulationComplete: (result: SimulationResult) => void,
) {
  const lastRunRef = useRef(0);

  const triggerSimulation = useCallback(() => {
    if (!context) return;

    const now = Date.now();
    if (now - lastRunRef.current < 1500) return;
    lastRunRef.current = now;

    const result = runSimulation(context);
    if (result.copperEarned > 0 || result.xpEarned > 0 || result.day !== context.day || result.logs.length > 0) {
      onSimulationComplete(result);
    }
  }, [context, onSimulationComplete]);

  useEffect(() => {
    triggerSimulation();
  }, [triggerSimulation]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') triggerSimulation();
    };
    const onFocus = () => triggerSimulation();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [triggerSimulation]);
}
