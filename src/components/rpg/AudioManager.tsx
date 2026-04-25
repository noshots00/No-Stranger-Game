import React, { useEffect, useState } from 'react';

export function AudioManager() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!isInitialized) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setIsInitialized(true);
      }
    };

    // Initialize on user interaction
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    // Try to initialize immediately (might be blocked by autoplay policy)
    initAudio();

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext, isInitialized]);

  // Play a sound effect
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  };

  // Play ambient background music (simple drone)
  const playAmbient = () => {
    if (!audioContext) return null;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 110; // A2 note
    gainNode.gain.value = 0.01; // Very quiet

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    
    return () => {
      oscillator.stop();
    };
  };

  // Sound effect presets
  const sfx = {
    attack: () => playSound(400, 100, 'square', 0.2),
    hit: () => playSound(200, 150, 'sawtooth', 0.3),
    heal: () => playSound(800, 200, 'sine', 0.2),
    levelUp: () => {
      playSound(500, 100, 'sine', 0.15);
      setTimeout(() => playSound(600, 100, 'sine', 0.15), 100);
      setTimeout(() => playSound(800, 150, 'sine', 0.2), 200);
    },
    questComplete: () => {
      playSound(600, 150, 'triangle', 0.2);
      setTimeout(() => playSound(800, 150, 'triangle', 0.2), 200);
      setTimeout(() => playSound(1000, 200, 'triangle', 0.25), 400);
    },
    error: () => playSound(100, 300, 'sawtooth', 0.2),
    click: () => playSound(1000, 50, 'sine', 0.05)
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Audio will be initialized through user interaction */}
      <div aria-hidden="true">
        {/* Invisible element to help with audio initialization */}
        <button 
          tabIndex={-1} 
          onClick={() => sfx.click()} 
          className="opacity-0 pointer-events-none"
        />
      </div>
    </div>
  );
}