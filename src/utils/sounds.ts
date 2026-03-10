let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

async function resume(): Promise<AudioContext> {
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

export async function playCardSnap(): Promise<void> {
  const ctx = await resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.09);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.09);
}

export async function playChipClick(): Promise<void> {
  const ctx = await resume();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(350, ctx.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, ctx.currentTime);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.055);
}

const NOTE_FREQS: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  C5: 523.25,
};

async function playMelody(notes: string[], duration: number, type: OscillatorType = 'sine'): Promise<void> {
  const ctx = await resume();
  notes.forEach((note, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(NOTE_FREQS[note] ?? 440, ctx.currentTime + i * duration);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * duration);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i + 1) * duration);
    osc.start(ctx.currentTime + i * duration);
    osc.stop(ctx.currentTime + (i + 1) * duration);
  });
}

export function playWin(): void {
  playMelody(['C4', 'E4', 'G4'], 0.11);
}

export function playBlackjack(): void {
  playMelody(['C4', 'E4', 'G4', 'C5'], 0.09, 'triangle');
}

export function playLose(): void {
  playMelody(['G4', 'E4', 'C4'], 0.14);
}

export function playPush(): void {
  playMelody(['D4'], 0.18);
}
