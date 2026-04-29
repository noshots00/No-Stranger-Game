import { useCallback, useEffect, useRef } from 'react';

import { runSimulation, type SimulationContext, type SimulationResult } from '@/services/idleSimulation';

export function useIdleLoop(
  context: SimulationContext | null,
  onSimulationComplete: (result: SimulationResult) => void,
) {
  const lastRunRef = useRef(0);
  const contextRef = useRef<SimulationContext | null>(context);
  const onSimulationCompleteRef = useRef(onSimulationComplete);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    onSimulationCompleteRef.current = onSimulationComplete;
  }, [onSimulationComplete]);

  const triggerSimulation = useCallback(() => {
    const currentContext = contextRef.current;
    if (!currentContext) return;

    const now = Date.now();
    if (now - lastRunRef.current < 1500) return;
    lastRunRef.current = now;

    const result = runSimulation(currentContext);
    if (result.copperEarned > 0 || result.xpEarned > 0 || result.day !== currentContext.day || result.logs.length > 0) {
      onSimulationCompleteRef.current(result);
    }
  }, []);

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') triggerSimulation();
    }, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [triggerSimulation]);
}
