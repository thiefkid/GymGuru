// A short double beep for the end of a rest. iPhones can't vibrate from a web app, so this is
// the only alert they get. Web Audio follows the ring/silent switch and mixes with music.

let context: AudioContext | null = null;

/** Call from a tap: browsers only allow audio that a user gesture started. */
export function primeAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
  } catch {
    context = null;
  }
}

export function beep() {
  const ctx = context;
  if (!ctx) return;
  const start = ctx.currentTime;
  for (const offset of [0, 0.28]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.22);
  }
}
