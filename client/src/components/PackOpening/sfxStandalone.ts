type Rarity = "COMUN" | "RARO" | "EPICO" | "LEGENDARIO";

let ctx: AudioContext | null = null;

const ac = (): AudioContext => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

const osc = (
  freq: number,
  type: OscillatorType,
  dur: number,
  vol: number,
  delay = 0,
  freqEnd?: number,
) => {
  const c = ac(), t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.85);
  g.gain.setValueAtTime(Math.min(vol, 1), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
};

const nz = (dur: number, vol: number, ffreq: number, q = 1, delay = 0) => {
  const c = ac(), t = c.currentTime + delay;
  const len = Math.ceil(c.sampleRate * (dur + 0.1));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass"; filt.frequency.value = ffreq; filt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(Math.min(vol, 1), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt); filt.connect(g); g.connect(c.destination);
  src.start(t); src.stop(t + dur + 0.1);
};

export const SFX = {
  navigate() {
    osc(1100, "sine", 0.07, 0.12);
    osc(1650, "sine", 0.05, 0.07, 0.02);
  },

  packSelect() {
    osc(160, "sine", 0.42, 0.45);
    osc(320, "sine", 0.32, 0.28, 0.04);
    osc(800, "sine", 0.22, 0.18, 0.09);
    nz(0.18, 0.2, 1000, 0.8, 0.06);
  },

  crack() {
    nz(0.45, 0.6, 3500, 1.8);
    osc(180, "sawtooth", 0.28, 0.22, 0, 35);
    nz(0.15, 0.4, 9000, 2.5, 0.12);
  },

  openPack(rarity: Rarity) {
    if (rarity === "COMUN") {
      nz(0.55, 0.65, 1000, 1);
      osc(200, "sine", 0.55, 0.4);
      osc(450, "sine", 0.35, 0.22, 0.1);
    } else if (rarity === "RARO") {
      nz(0.85, 0.78, 2200, 1.3);
      osc(110, "sine", 0.75, 0.52);
      osc(440, "sine", 0.5,  0.32, 0.07);
      osc(880, "sine", 0.4,  0.22, 0.16);
      osc(1760,"sine", 0.28, 0.14, 0.28);
    } else if (rarity === "EPICO") {
      nz(1.1, 0.88, 2800, 1.4);
      osc(82,  "sine", 1.05, 0.62);
      osc(164, "sine", 0.8,  0.38, 0.05);
      [523, 659, 784, 1047].forEach((f, i) => osc(f, "sine", 0.52, 0.25, 0.1 + i * 0.09));
      nz(0.4, 0.35, 6500, 2.2, 0.32);
    } else {
      // LEGENDARIO — full cinematic treatment
      nz(1.8, 0.95, 5000, 1.6);
      osc(55,  "sine", 2.0, 0.75);
      osc(110, "sine", 1.5, 0.48, 0.05);
      osc(220, "sine", 1.1, 0.3,  0.1);
      [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
        osc(f, "sine", 0.85, 0.28, 0.12 + i * 0.1)
      );
      [3500, 4500, 6000].forEach((f, i) => osc(f, "sine", 0.6, 0.1, 0.58 + i * 0.08));
      osc(523,  "sine", 1.6, 0.18, 0.85);
      osc(1047, "sine", 1.3, 0.12, 0.95);
    }
  },

  cardReveal(rarity: Rarity) {
    if (rarity === "COMUN") {
      nz(0.22, 0.3, 1200, 1);
      osc(330, "sine", 0.3, 0.18);
    } else if (rarity === "RARO") {
      osc(660, "sine", 0.45, 0.3);
      osc(990, "sine", 0.35, 0.2,  0.06);
      nz(0.22, 0.28, 2800, 1.5, 0.02);
    } else if (rarity === "EPICO") {
      [440, 554, 659].forEach((f, i) => osc(f, "sine", 0.52, 0.28, i * 0.06));
      nz(0.32, 0.35, 4500, 1.9, 0.04);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => osc(f, "sine", 0.75, 0.3, i * 0.07));
      nz(0.55, 0.42, 5500, 2.2, 0.05);
      osc(2093, "sine", 0.45, 0.14, 0.3);
    }
  },

  cardNavigate() {
    osc(950,  "sine", 0.055, 0.1);
    osc(1300, "sine", 0.04,  0.065, 0.018);
  },

  cardDetail() {
    osc(440,  "sine", 0.2,  0.22);
    osc(880,  "sine", 0.24, 0.18, 0.05);
    osc(1320, "sine", 0.2,  0.13, 0.1);
    nz(0.15, 0.15, 3500, 1.5, 0.06);
  },
};
