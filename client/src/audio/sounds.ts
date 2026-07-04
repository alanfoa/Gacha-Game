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

export const MENU_TRACKS = [
  { src: '/audio/bgm.ogg', name: 'Tema Principal' },
  { src: '/audio/bgm_menu_02.ogg', name: 'Melodía Nocturna' },
  { src: '/audio/bgm_menu_03.ogg', name: 'Ritmo Urbano' },
];

const BATTLE_PLAYLIST = [
  '/audio/bgm_battle.webm',
];

let bgmHowl: Howl | null = null;
let bgmHowlId: number | null = null;
export const DEFAULT_MENU_VOLUME = 0.25;
let bgmVolume = DEFAULT_MENU_VOLUME;
let currentTrackIndex = -1;
let lastBattleIndex = -1;
let bgmPaused = false;

function pickRandom(max: number, lastIndex: number): number {
  if (max <= 1) return 0;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * max);
  } while (idx === lastIndex);
  return idx;
}

export function getBgmVolume() {
  return bgmVolume;
}

function startBgmInternal(src: string, volume?: number, loop = true) {
  initAudio();
  if (bgmHowl) {
    try { bgmHowl.stop(); } catch {}
    bgmHowl = null;
    bgmHowlId = null;
  }
  if (!src) return;
  if (volume !== undefined) bgmVolume = volume;
  try {
    bgmHowl = new Howl({
      src: [src],
      loop,
      volume: bgmVolume,
      onend: !loop && MENU_TRACKS.length > 1
        ? () => {
            currentTrackIndex = (currentTrackIndex + 1) % MENU_TRACKS.length;
            startBgmInternal(MENU_TRACKS[currentTrackIndex].src, undefined, false);
          }
        : undefined,
    });
    bgmHowlId = bgmHowl.play();
    bgmPaused = false;
  } catch {
    // ignore
  }
}

export const BGM = {
  start(volume?: number) {
    const index = pickRandom(MENU_TRACKS.length, currentTrackIndex);
    currentTrackIndex = index;
    startBgmInternal(MENU_TRACKS[index].src, volume, false);
  },

  startBattle(volume?: number) {
    const index = pickRandom(BATTLE_PLAYLIST.length, lastBattleIndex);
    lastBattleIndex = index;
    startBgmInternal(BATTLE_PLAYLIST[index], volume, true);
  },

  switchToMenu(volume?: number) {
    if (bgmHowl) {
      try { bgmHowl.stop(); } catch {}
      bgmHowl = null;
      bgmHowlId = null;
    }
    const index = pickRandom(MENU_TRACKS.length, currentTrackIndex);
    currentTrackIndex = index;
    startBgmInternal(MENU_TRACKS[index]?.src, volume, false);
  },

  nextTrack() {
    if (MENU_TRACKS.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % MENU_TRACKS.length;
    startBgmInternal(MENU_TRACKS[currentTrackIndex].src, undefined, false);
  },

  prevTrack() {
    if (MENU_TRACKS.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + MENU_TRACKS.length) % MENU_TRACKS.length;
    startBgmInternal(MENU_TRACKS[currentTrackIndex].src, undefined, false);
  },

  playTrack(index: number) {
    if (index < 0 || index >= MENU_TRACKS.length) return;
    currentTrackIndex = index;
    startBgmInternal(MENU_TRACKS[index].src, undefined, false);
  },

  getCurrentTrack() {
    if (currentTrackIndex < 0 || currentTrackIndex >= MENU_TRACKS.length) return null;
    return MENU_TRACKS[currentTrackIndex];
  },

  getCurrentTrackIndex() {
    return currentTrackIndex;
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
    bgmPaused = true;
  },

  resume() {
    if (!bgmHowl) return;
    try {
      if (bgmHowlId !== null) bgmHowl.play(bgmHowlId);
      else bgmHowlId = bgmHowl.play();
    } catch {}
    bgmPaused = false;
  },

  togglePause() {
    if (bgmPaused) { BGM.resume(); } else { BGM.pause(); }
  },

  isPlaying() {
    return bgmHowl !== null && bgmHowlId !== null && !bgmPaused;
  },

  isPaused() {
    return bgmPaused;
  },

  setVolume(vol: number) {
    bgmVolume = vol;
    if (bgmHowl && bgmHowlId !== null) {
      try { bgmHowl.volume(vol, bgmHowlId); } catch { /* ignore */ }
    }
  },
};

// Unlock AudioContext on first user interaction (click, key, gamepad)
function unlockHowler() {
  document.removeEventListener('pointerdown', unlockHowler);
  document.removeEventListener('keydown', unlockHowler);
  window.removeEventListener('gamepadconnected', unlockHowler);
  if (!audioInit) initAudio();
  if (ctx?.state === 'suspended') ctx.resume();
  if (Howler.ctx?.state === 'suspended') Howler.ctx.resume();
}
document.addEventListener('pointerdown', unlockHowler, { once: true });
document.addEventListener('keydown', unlockHowler, { once: true });
window.addEventListener('gamepadconnected', unlockHowler, { once: true });

// Auto-unlock in Electron (no autoplay restriction)
if (navigator.userAgent.includes('Electron')) {
  setTimeout(() => unlockHowler(), 0);
}
