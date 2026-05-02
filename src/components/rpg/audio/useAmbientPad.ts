import { useEffect, useRef } from 'react';
import { isAudioMuted, subscribeAudioMuted } from './audioMute';

type UseAmbientPadOptions = {
  /** When true, the pad plays. When false, it stops. */
  active: boolean;
  /**
   * Optional URL of an mp3/ogg to use INSTEAD of the procedural pad.
   * If the file is missing or fails to load, falls back to procedural Web Audio.
   */
  preferFile?: string;
  /** 0-1 master volume. */
  volume?: number;
};

/**
 * Lazy ambient pad: while `active` is true, plays a soft drone (file override
 * if provided, else two detuned sine oscillators with a slow gain LFO). All
 * resources are cleaned up on `active=false`, on unmount, or on mute toggle.
 *
 * Audio context creation is deferred until the first `active=true` to satisfy
 * browser autoplay policies (the user must interact at least once).
 */
export function useAmbientPad({ active, preferFile, volume = 0.35 }: UseAmbientPadOptions): void {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const lfoNodesRef = useRef<OscillatorNode[]>([]);
  const fileAudioRef = useRef<HTMLAudioElement | null>(null);
  const usingFileRef = useRef<boolean>(false);

  const stopAll = () => {
    try {
      const file = fileAudioRef.current;
      if (file) {
        file.pause();
        file.src = '';
        fileAudioRef.current = null;
      }
    } catch {
      // ignore
    }
    try {
      oscNodesRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {
          // already stopped
        }
        o.disconnect();
      });
      lfoNodesRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {
          // already stopped
        }
        o.disconnect();
      });
      oscNodesRef.current = [];
      lfoNodesRef.current = [];
      if (masterGainRef.current) {
        masterGainRef.current.disconnect();
        masterGainRef.current = null;
      }
    } catch {
      // ignore teardown errors
    }
    usingFileRef.current = false;
  };

  const tryStartFile = async (url: string, gain: number): Promise<boolean> => {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) return false;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = gain;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        await playPromise;
      }
      fileAudioRef.current = audio;
      usingFileRef.current = true;
      return true;
    } catch {
      return false;
    }
  };

  const startProcedural = (gain: number) => {
    type WindowWithLegacyAudio = Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ?? (window as WindowWithLegacyAudio).webkitAudioContext
        : undefined;
    if (!Ctor) return;
    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // user-gesture required; will retry next activation
      });
    }
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(gain, ctx.currentTime + 1.2);
    masterGainRef.current = master;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;
    lowpass.Q.value = 0.7;

    master.connect(ctx.destination);
    lowpass.connect(master);

    const baseFreqs = [110, 165];
    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = idx === 0 ? -4 : 4;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.5;
      osc.connect(oscGain);
      oscGain.connect(lowpass);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5 + idx * 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      osc.start();
      lfo.start();
      oscNodesRef.current.push(osc);
      lfoNodesRef.current.push(lfo);
    });
  };

  useEffect(() => {
    let cancelled = false;
    const unsubMute = subscribeAudioMuted((muted) => {
      if (muted) {
        stopAll();
      } else if (active) {
        void start();
      }
    });

    const start = async () => {
      if (cancelled) return;
      if (isAudioMuted()) return;
      if (usingFileRef.current || oscNodesRef.current.length > 0) return;
      if (preferFile) {
        const ok = await tryStartFile(preferFile, volume);
        if (cancelled) {
          stopAll();
          return;
        }
        if (ok) return;
      }
      startProcedural(volume);
    };

    if (active) {
      void start();
    } else {
      stopAll();
    }

    return () => {
      cancelled = true;
      unsubMute();
      stopAll();
    };
    // We intentionally re-run when `active`, `preferFile`, or `volume` change.
  }, [active, preferFile, volume]);
}
