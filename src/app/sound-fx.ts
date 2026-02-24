/**
 * SoundFX — Procedural Web Audio API sound effects.
 * All sounds are synthesised at runtime; no audio files required.
 */
export class SoundFX {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;

  // ── Context ──────────────────────────────────────────────────────────────

  private static getCtx(): AudioContext {
    if (!SoundFX.ctx) {
      SoundFX.ctx = new AudioContext();
      SoundFX.masterGain = SoundFX.ctx.createGain();
      SoundFX.masterGain.gain.value = 0.82;
      SoundFX.masterGain.connect(SoundFX.ctx.destination);
    }
    if (SoundFX.ctx.state === 'suspended') {
      SoundFX.ctx.resume();
    }
    return SoundFX.ctx;
  }

  private static get out(): AudioNode {
    SoundFX.getCtx();
    return SoundFX.masterGain!;
  }

  /** Call once on the first user interaction to unblock autoplay policy. */
  static unlock(): void { SoundFX.getCtx(); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Fill an AudioBuffer with white noise. */
  private static noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const n = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── Weapon sounds ──────────────────────────────────────────────────────────

  /** Rifle shot — loud crack + sub-bass body + reverb tail */
  static rifle(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    // Sub-bass thud
    const osc = ctx.createOscillator();
    const og  = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.22);
    og.gain.setValueAtTime(2.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(og); og.connect(out);
    osc.start(t); osc.stop(t + 0.28);

    // Crack burst
    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.14);
    const bp  = ctx.createBiquadFilter();
    bp.type   = 'bandpass';
    bp.frequency.setValueAtTime(2400, t);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.10);
    bp.Q.value = 0.8;
    const ng  = ctx.createGain();
    ng.gain.setValueAtTime(2.8, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    ns.connect(bp); bp.connect(ng); ng.connect(out);
    ns.start(t);

    // High-freq snap
    const snap = ctx.createBufferSource();
    snap.buffer = SoundFX.noiseBuffer(ctx, 0.03);
    const hp    = ctx.createBiquadFilter();
    hp.type     = 'highpass';
    hp.frequency.value = 5000;
    const sg    = ctx.createGain();
    sg.gain.setValueAtTime(1.2, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    snap.connect(hp); hp.connect(sg); sg.connect(out);
    snap.start(t);
  }

  /** Pistol shot — sharper crack, less body */
  static pistol(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    // Body
    const osc = ctx.createOscillator();
    const og  = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);
    og.gain.setValueAtTime(1.6, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(og); og.connect(out);
    osc.start(t); osc.stop(t + 0.18);

    // Crack
    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.09);
    const bp  = ctx.createBiquadFilter();
    bp.type   = 'bandpass';
    bp.frequency.setValueAtTime(3200, t);
    bp.frequency.exponentialRampToValueAtTime(1100, t + 0.06);
    bp.Q.value = 1.1;
    const ng  = ctx.createGain();
    ng.gain.setValueAtTime(2.0, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    ns.connect(bp); bp.connect(ng); ng.connect(out);
    ns.start(t);
  }

  /** Knife slash — fast air whoosh */
  static slash(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.18);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1600, t);
    hp.frequency.linearRampToValueAtTime(5200, t + 0.05);
    hp.frequency.exponentialRampToValueAtTime(700, t + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(1.3, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    ns.connect(hp); hp.connect(gain); gain.connect(out);
    ns.start(t);
  }

  /** Fist punch — meaty impact thud */
  static punch(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    // Low thud oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const og  = ctx.createGain();
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.10);
    og.gain.setValueAtTime(1.8, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(og); og.connect(out);
    osc.start(t); osc.stop(t + 0.13);

    // Snap transient
    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.045);
    const bp  = ctx.createBiquadFilter();
    bp.type   = 'bandpass';
    bp.frequency.value = 1000;
    bp.Q.value = 0.6;
    const ng  = ctx.createGain();
    ng.gain.setValueAtTime(1.1, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    ns.connect(bp); bp.connect(ng); ng.connect(out);
    ns.start(t);
  }

  /** Weapon swap — mechanical click/clack */
  static weaponSwap(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    // Click transient
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.045);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    osc.connect(gain); gain.connect(out);
    osc.start(t); osc.stop(t + 0.055);

    // Noise tock
    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.03);
    const lp  = ctx.createBiquadFilter();
    lp.type   = 'lowpass';
    lp.frequency.value = 1800;
    const ng  = ctx.createGain();
    ng.gain.setValueAtTime(0.20, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    ns.connect(lp); lp.connect(ng); ng.connect(out);
    ns.start(t);
  }

  /** Footstep on hard floor */
  static footstep(): void {
    const ctx = SoundFX.getCtx();
    const out = SoundFX.out;
    const t = ctx.currentTime;

    const ns  = ctx.createBufferSource();
    ns.buffer = SoundFX.noiseBuffer(ctx, 0.065);

    const lp = ctx.createBiquadFilter();
    lp.type  = 'lowpass';
    lp.frequency.value = 320;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    ns.connect(lp); lp.connect(gain); gain.connect(out);
    ns.start(t);
  }
}
