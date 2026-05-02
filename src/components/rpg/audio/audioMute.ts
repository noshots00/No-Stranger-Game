import { useEffect, useState } from 'react';

const STORAGE_KEY = 'nsg:audio-muted';

type Listener = (muted: boolean) => void;
const listeners = new Set<Listener>();
let cachedMuted: boolean | null = null;

const readInitial = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const ensureCache = (): boolean => {
  if (cachedMuted === null) cachedMuted = readInitial();
  return cachedMuted;
};

export const isAudioMuted = (): boolean => ensureCache();

export const setAudioMuted = (muted: boolean): void => {
  cachedMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener(muted));
};

export const toggleAudioMuted = (): void => setAudioMuted(!ensureCache());

/** Subscribe to mute changes; returns unsubscribe. */
export const subscribeAudioMuted = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** React hook reading the global audio-muted flag. */
export function useAudioMuted(): boolean {
  const [muted, setMuted] = useState<boolean>(() => ensureCache());
  useEffect(() => subscribeAudioMuted(setMuted), []);
  return muted;
}
