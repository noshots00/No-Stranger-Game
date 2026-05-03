import { useEffect, useRef } from 'react';
import { isAudioMuted, subscribeAudioMuted } from './audioMute';

type UseGameMusicOptions = {
  /** URL of the music file (e.g. from `publicAsset`). */
  src: string;
  /** When false, stop and release the player (e.g. leave the game view). */
  active: boolean;
  /** 0–1 master volume. */
  volume?: number;
};

/**
 * Loops background music while `active` and the user has not muted via the header control.
 * Uses a single `HTMLAudioElement` (no Web Audio “pad”); playback starts after unmute
 * (user gesture) to satisfy browser autoplay rules.
 * Retries on visibility restore and first pointer interaction so production autoplay
 * quirks are less likely to leave audio permanently silent after unmute.
 */
export function useGameMusic({ src, active, volume = 0.45 }: UseGameMusicOptions): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const stop = () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.pause();
      el.removeAttribute('src');
      el.load();
    } catch {
      // ignore
    }
    audioRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    const tryPlay = async () => {
      if (cancelled) return;
      if (!active || isAudioMuted()) {
        stop();
        return;
      }
      if (audioRef.current) return;

      try {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = volumeRef.current;
        audio.preload = 'auto';
        audio.addEventListener(
          'error',
          () => {
            // Broken URL or blocked asset — release so a later retry can recreate.
            stop();
          },
          { once: true }
        );
        await audio.play();
        if (cancelled) {
          stop();
          return;
        }
        audioRef.current = audio;
      } catch {
        stop();
      }
    };

    void tryPlay();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tryPlay();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPointer = () => void tryPlay();
    window.addEventListener('pointerdown', onPointer, { passive: true });

    const unsub = subscribeAudioMuted((muted) => {
      if (muted) stop();
      else void tryPlay();
    });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', onPointer);
      unsub();
      stop();
    };
  }, [active, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);
}
