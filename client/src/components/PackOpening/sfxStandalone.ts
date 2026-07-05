const RARITY_FILE: Record<string, string> = {
  COMUN: 'common', RARO: 'rare', EPICO: 'epic', LEGENDARIO: 'legendary',
};

function createSfx(src: string) {
  return () => {
    try { new Audio(src).play(); } catch { /* ignore */ }
  };
}

function createRaritySfx() {
  const cache: Record<string, HTMLAudioElement> = {};
  return (rarity: string) => {
    const file = RARITY_FILE[rarity];
    if (!file) return;
    if (!cache[rarity]) cache[rarity] = new Audio(`/audio/ui/card_reveal_${file}.wav`);
    try { cache[rarity].currentTime = 0; cache[rarity].play(); } catch { /* ignore */ }
  };
}

export const SFX = {
  navigate: createSfx('/audio/ui/nav.wav'),
  packSelect: createSfx('/audio/ui/confirm.wav'),
  crack: createSfx('/audio/ui/pack_open.wav'),
  openPack: createSfx('/audio/ui/pack_open.wav'),
  cardReveal: createRaritySfx(),
  cardNavigate: createSfx('/audio/ui/nav.wav'),
  cardDetail: createSfx('/audio/ui/confirm.wav'),
};
