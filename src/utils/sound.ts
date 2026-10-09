// Web Audio synthesizer for arcade and quiz sound effects
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private musicInterval: number | null = null;
  private musicPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled && this.musicPlaying) {
      this.stopLobbyMusic();
    }
    return this.enabled;
  }

  public playTick(urgent: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 880 : 440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(urgent ? 1100 : 330, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playCorrect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  }

  public playWrong() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  public playFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.15, delay: 0 },
      { f: 523.25, d: 0.15, delay: 0.16 },
      { f: 523.25, d: 0.15, delay: 0.32 },
      { f: 659.25, d: 0.3, delay: 0.48 },
      { f: 587.33, d: 0.15, delay: 0.8 },
      { f: 659.25, d: 0.15, delay: 0.96 },
      { f: 783.99, d: 0.6, delay: 1.12 },
    ];

    notes.forEach((item) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + item.delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + item.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + item.d + 0.05);
    });
  }

  public startLobbyMusic() {
    if (!this.enabled || this.musicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;
    this.musicPlaying = true;

    const chords = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63], // F
      [196.00, 246.94, 293.66], // G
    ];
    let step = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.enabled || !this.ctx || !this.musicPlaying) return;
      const currentChord = chords[step % chords.length];
      step++;

      currentChord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.5, start);

        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    }, 700);
  }

  public stopLobbyMusic() {
    this.musicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundController();
