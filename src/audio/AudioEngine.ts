import { ANALYSER_CONFIGS, type AnalyserNodeSet } from '../types/audio';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analysers: AnalyserNodeSet | null = null;
  private objectUrl: string | null = null;

  private constructor() {
    this.audioElement = document.createElement('audio');
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private async initNodes(): Promise<void> {
    const ctx = await this.ensureContext();

    if (this.sourceNode) return;

    this.sourceNode = ctx.createMediaElementSource(this.audioElement);

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.75;

    const smooth = ctx.createAnalyser();
    smooth.fftSize = ANALYSER_CONFIGS.smooth.fftSize;
    smooth.smoothingTimeConstant = ANALYSER_CONFIGS.smooth.smoothingTimeConstant;

    const medium = ctx.createAnalyser();
    medium.fftSize = ANALYSER_CONFIGS.medium.fftSize;
    medium.smoothingTimeConstant = ANALYSER_CONFIGS.medium.smoothingTimeConstant;

    const raw = ctx.createAnalyser();
    raw.fftSize = ANALYSER_CONFIGS.raw.fftSize;
    raw.smoothingTimeConstant = ANALYSER_CONFIGS.raw.smoothingTimeConstant;

    const reactive = ctx.createAnalyser();
    reactive.fftSize = ANALYSER_CONFIGS.reactive.fftSize;
    reactive.smoothingTimeConstant = ANALYSER_CONFIGS.reactive.smoothingTimeConstant;

    this.analysers = { smooth, medium, raw, reactive };

    // Chain: source -> gain -> smooth -> medium -> raw -> reactive -> destination
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(smooth);
    smooth.connect(medium);
    medium.connect(raw);
    raw.connect(reactive);
    reactive.connect(ctx.destination);
  }

  async loadFile(file: File): Promise<number> {
    // Clean up previous object URL
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }

    this.objectUrl = URL.createObjectURL(file);
    this.audioElement.src = this.objectUrl;

    await this.initNodes();

    return new Promise<number>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve(this.audioElement.duration);
      };
      const onError = () => {
        cleanup();
        reject(new Error('Failed to load audio file'));
      };
      const cleanup = () => {
        this.audioElement.removeEventListener('loadedmetadata', onLoaded);
        this.audioElement.removeEventListener('error', onError);
      };

      this.audioElement.addEventListener('loadedmetadata', onLoaded);
      this.audioElement.addEventListener('error', onError);
      this.audioElement.load();
    });
  }

  async play(): Promise<void> {
    await this.ensureContext();
    await this.audioElement.play();
  }

  pause(): void {
    this.audioElement.pause();
  }

  stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = clamped;
    }
  }

  seek(time: number): void {
    this.audioElement.currentTime = time;
  }

  get currentTime(): number {
    return this.audioElement.currentTime;
  }

  get duration(): number {
    return this.audioElement.duration || 0;
  }

  get paused(): boolean {
    return this.audioElement.paused;
  }

  getAnalysers(): AnalyserNodeSet | null {
    return this.analysers;
  }

  getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  onTimeUpdate(callback: (time: number) => void): () => void {
    const handler = () => callback(this.audioElement.currentTime);
    this.audioElement.addEventListener('timeupdate', handler);
    return () => this.audioElement.removeEventListener('timeupdate', handler);
  }

  onEnded(callback: () => void): () => void {
    this.audioElement.addEventListener('ended', callback);
    return () => this.audioElement.removeEventListener('ended', callback);
  }

  destroy(): void {
    this.stop();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.analysers) {
      this.analysers.smooth.disconnect();
      this.analysers.medium.disconnect();
      this.analysers.raw.disconnect();
      this.analysers.reactive.disconnect();
      this.analysers = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    AudioEngine.instance = null;
  }
}
