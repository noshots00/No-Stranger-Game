import { useCallback, useEffect, useRef } from 'react';

import { audioManager, type SoundId } from '@/services/audioManager';
import type { AmbientRegion } from '@/types/game';

export function useAudioEngine(region = 'unknown') {
  const isInitRef = useRef(false);

  const mapRegion = (value: string): AmbientRegion => {
    const lower = value.toLowerCase();
    if (lower.includes('tavern') || lower.includes('inn')) return 'tavern';
    if (lower.includes('forest') || lower.includes('wood')) return 'forest';
    if (lower.includes('village') || lower.includes('clearing')) return 'village';
    return 'unknown';
  };

  useEffect(() => {
    const handleGesture = () => {
      if (!isInitRef.current) {
        void audioManager.init();
        isInitRef.current = true;
      }
    };
    const handleVis = () => {
      if (document.visibilityState === 'visible') {
        void audioManager.resume();
      } else {
        void audioManager.pause();
      }
    };

    document.addEventListener('click', handleGesture);
    document.addEventListener('touchend', handleGesture);
    document.addEventListener('visibilitychange', handleVis);
    return () => {
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchend', handleGesture);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  useEffect(() => {
    audioManager.setAmbient(mapRegion(region));
  }, [region]);

  const playSFX = useCallback((id: SoundId, vol = 0.6) => audioManager.playSFX(id, vol), []);
  const toggleMute = useCallback(() => audioManager.toggleMute(), []);

  return { playSFX, toggleMute };
}
