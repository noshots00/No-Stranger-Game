import type { AmbientRegion } from '@/types/game';

export type SoundId = 'tap' | 'travel' | 'quest' | 'discovery' | 'injury' | 'levelup';

class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientOsc: OscillatorNode | null = null;
  private muted = false;
  private initialized = false;
  private sfxBuffers = new Map<SoundId, AudioBuffer>();

  async init(): Promise<void> {
    if (this.initialized) return;
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.ambientGain = this.context.createGain();
    this.masterGain.gain.value = 0.4;
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    this.initialized = true;
    if (this.context.state === 'suspended') await this.context.resume();
  }

  async preload(id: SoundId, url: string): Promise<void> {
    if (!this.context) return;
    const response = await fetch(url);
    const data = await response.arrayBuffer();
    const buffer = await this.context.decodeAudioData(data);
    this.sfxBuffers.set(id, buffer);
  }

  async resume(): Promise<void> {
    if (!this.context) return;
    if (this.context.state !== 'running') await this.context.resume();
  }

  async pause(): Promise<void> {
    if (!this.context) return;
    if (this.context.state === 'running') await this.context.suspend();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.4;
    return this.muted;
  }

  setAmbient(region: AmbientRegion): void {
    if (!this.context || !this.ambientGain || !this.masterGain) return;
    const now = this.context.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.25);

    if (this.currentAmbientOsc) {
      this.currentAmbientOsc.stop(now + 0.3);
      this.currentAmbientOsc.disconnect();
      this.currentAmbientOsc = null;
    }

    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = this.getAmbientFrequency(region);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    osc.connect(filter);
    filter.connect(this.ambientGain);
    osc.start(now);
    this.currentAmbientOsc = osc;
    this.ambientGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.35, now + 1.5);
  }

  playSFX(id: SoundId, volume = 0.6): void {
    if (!this.context || !this.masterGain || this.muted) return;

    const now = this.context.currentTime;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.min(1, Math.max(0, volume)), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    gain.connect(this.masterGain);

    const preloaded = this.sfxBuffers.get(id);
    if (preloaded) {
      const source = this.context.createBufferSource();
      source.buffer = preloaded;
      source.connect(gain);
      source.start(now);
      source.stop(now + Math.min(1.5, preloaded.duration));
      return;
    }

    const osc = this.context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = this.getSfxFrequency(id);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private getAmbientFrequency(region: AmbientRegion): number {
    if (region === 'forest') return 196;
    if (region === 'village') return 164;
    if (region === 'tavern') return 130;
    return 110;
  }

  private getSfxFrequency(id: SoundId): number {
    switch (id) {
      case 'tap':
        return 660;
      case 'travel':
        return 440;
      case 'quest':
        return 784;
      case 'discovery':
        return 523;
      case 'injury':
        return 196;
      case 'levelup':
        return 988;
      default:
        return 440;
    }
  }
}

export const audioManager = new AudioManager();
