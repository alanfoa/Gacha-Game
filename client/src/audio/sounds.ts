import { Howl } from 'howler';

let ctx: AudioContext | null = null;
let audioInit = false;

export function initAudio() {
  if (audioInit) return;
  audioInit = true;
  try {
    ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch { /* Web Audio no disponible */ }
}

export function getCtx(): AudioContext | null {
  if (!audioInit) return null;
  if (!ctx) return null;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.08,
  startTime?: number,
) {
  const c = getCtx();
  if (!c) return;
  const t = startTime ?? c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function noise(duration: number, volume = 0.05) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(2000, t);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start(t);
}

export const SFX = {
  nav() {
    tone(600, 0.06, 'square', 0.06);
  },

  confirm() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(400, 0.1, 'square', 0.08, now);
    tone(600, 0.15, 'square', 0.06, now + 0.08);
  },

  back() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(400, 0.1, 'square', 0.06, now);
    tone(300, 0.12, 'square', 0.06, now + 0.08);
  },

  packOpen() {
    noise(0.3, 0.08);
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(200, 0.15, 'sawtooth', 0.06, now);
    tone(300, 0.1, 'sawtooth', 0.04, now + 0.1);
  },

  cardReveal(rarity: string) {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    switch (rarity) {
      case 'common':
        tone(800, 0.2, 'square', 0.07, now);
        break;
      case 'rare':
        tone(500, 0.15, 'square', 0.07, now);
        tone(800, 0.2, 'square', 0.06, now + 0.12);
        break;
      case 'epic':
        tone(400, 0.12, 'square', 0.08, now);
        tone(600, 0.12, 'square', 0.07, now + 0.1);
        tone(900, 0.25, 'square', 0.07, now + 0.2);
        break;
      case 'legendary': {
        tone(300, 0.12, 'square', 0.08, now);
        tone(500, 0.12, 'square', 0.08, now + 0.1);
        tone(700, 0.12, 'square', 0.08, now + 0.2);
        tone(1000, 0.35, 'square', 0.1, now + 0.3);
        tone(1200, 0.4, 'triangle', 0.08, now + 0.4);
        break;
      }
    }
  },

  duplicate() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(500, 0.12, 'square', 0.07, now);
    tone(400, 0.12, 'square', 0.06, now + 0.12);
    tone(300, 0.2, 'square', 0.06, now + 0.24);
  },

  // --- Battle SFX (lazy Howl) ---

  attackHit: createBattleSfx('/audio/battle/hit.wav'),
  magicCast: createBattleSfx('/audio/battle/magicCast.ogg'),
  magicHit: createBattleSfx('/audio/battle/magicHit.ogg'),
  skill: createBattleSfx('/audio/battle/skill.wav'),
  critical: createBattleSfx('/audio/battle/critical.wav'),
  defend: createBattleSfx('/audio/battle/defend.ogg'),
  victory: createBattleSfx('/audio/battle/victory.ogg'),
  defeat: createBattleSfx('/audio/battle/defeat.ogg'),
};

function createBattleSfx(src: string) {
  let howl: Howl | null = null;
  return () => {
    if (!howl) {
      try {
        howl = new Howl({ src: [src], volume: 0.5, preload: true });
      } catch {
        return;
      }
    }
    try { howl.play(); } catch { /* ignore */ }
  };
}

let bgmHowl: Howl | null = null;
let bgmHowlId: number | null = null;
let bgmVolume = 0.25;

export function getBgmVolume() {
  return bgmVolume;
}

function startBgmInternal(src: string, volume?: number) {
  if (bgmHowl) {
    try { bgmHowl.stop(); } catch {}
    bgmHowl = null;
    bgmHowlId = null;
  }
  if (volume !== undefined) bgmVolume = volume;
  try {
    bgmHowl = new Howl({
      src: [src],
      loop: true,
      volume: bgmVolume,
      onloaderror: () => { bgmHowl = null; },
      onplayerror: () => { bgmHowl = null; },
    });
    bgmHowlId = bgmHowl.play();
  } catch {
    bgmHowl = null;
  }
}

export const BGM = {
  start(volume?: number) {
    startBgmInternal('/audio/bgm.ogg', volume);
  },

  startBattle(volume?: number) {
    startBgmInternal('/audio/bgm_battle.webm', volume);
  },

  stop() {
    if (!bgmHowl) return;
    const howl = bgmHowl;
    const id = bgmHowlId;
    bgmHowl = null;
    bgmHowlId = null;
    try {
      if (id !== null) howl.fade(howl.volume(), 0, 500, id);
      setTimeout(() => { try { howl.stop(); } catch {} }, 550);
    } catch { /* ignore */ }
  },

  pause() {
    if (!bgmHowl || bgmHowlId === null) return;
    try { bgmHowl.pause(bgmHowlId); } catch {}
  },

  resume() {
    if (!bgmHowl) return;
    try {
      if (bgmHowlId !== null) bgmHowl.play(bgmHowlId);
      else bgmHowlId = bgmHowl.play();
    } catch {}
  },

  isPlaying() {
    return bgmHowl !== null && bgmHowlId !== null;
  },

  setVolume(vol: number) {
    bgmVolume = vol;
    if (bgmHowl && bgmHowlId !== null) {
      try { bgmHowl.volume(vol, bgmHowlId); } catch { /* ignore */ }
    }
  },
};
