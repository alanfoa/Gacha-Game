import { Howl, Howler } from 'howler';

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
    if (Howler.ctx?.state === 'suspended') {
      Howler.ctx.resume();
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

function createUiSfx(src: string) {
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

const RARITY_FILE: Record<string, string> = {
  COMUN: 'common', RARO: 'rare', EPICO: 'epic', LEGENDARIO: 'legendary',
};

function createRaritySfx() {
  const howls: Record<string, Howl | null> = {};
  return (rarity: string) => {
    const file = RARITY_FILE[rarity];
    if (!file) return;
    if (!howls[rarity]) {
      try {
        howls[rarity] = new Howl({ src: [`/audio/ui/card_reveal_${file}.wav`], volume: 0.5, preload: true });
      } catch {
        return;
      }
    }
    try { howls[rarity]!.play(); } catch { /* ignore */ }
  };
}

export const SFX = {
  nav: createUiSfx('/audio/ui/nav.wav'),
  confirm: createUiSfx('/audio/ui/confirm.wav'),
  back: createUiSfx('/audio/ui/back.wav'),
  packOpen: createUiSfx('/audio/ui/pack_open.wav'),
  cardReveal: createRaritySfx(),
  duplicate: createUiSfx('/audio/ui/duplicate.wav'),

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
  initAudio();
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
    });
    bgmHowlId = bgmHowl.play();
  } catch {
    // ignore
  }
}

export const BGM = {
  start(volume?: number) {
    startBgmInternal('/audio/bgm.ogg', volume);
  },

  startBattle(volume?: number) {
    startBgmInternal('/audio/bgm_battle.webm', volume);
  },

  switchToMenu(volume?: number) {
    initAudio();
    if (bgmHowl) {
      try { bgmHowl.stop(); } catch {}
      bgmHowl = null;
      bgmHowlId = null;
    }
    if (volume !== undefined) bgmVolume = volume;
    try {
      bgmHowl = new Howl({
        src: ['/audio/bgm.ogg'],
        loop: true,
        volume: bgmVolume,
      });
      bgmHowlId = bgmHowl.play();
    } catch {
      // ignore
    }
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

// Unlock Howler's AudioContext on first user interaction
function unlockHowler() {
  document.removeEventListener('pointerdown', unlockHowler);
  document.removeEventListener('keydown', unlockHowler);
  initAudio();
}
document.addEventListener('pointerdown', unlockHowler, { once: true });
document.addEventListener('keydown', unlockHowler, { once: true });
