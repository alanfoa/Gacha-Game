// Mapa: new card ID -> old image filename (without extension)
// 18 legacy cards still use old filenames; new cards use cardId directly (e.g. "c01" -> "/characters/c01.webp")
const LEGACY_MAP: Record<string, string> = {
  e01: 'tanjiro_c',
  r01: 'nezuko_c',
  r02: 'zenitsu_c',
  r03: 'inosuke_c',
  r04: 'mikasa_c',
  e04: 'eren_t_r',
  r05: 'gon_r',
  e10: 'killua_r',
  e03: 'luffy_c',
  e02: 'naruto_c',
  e11: 'sasuke_c',
  e06: 'gojo_r',
  l01: 'gojo_awak_l',
  e09: 'itadori_r',
  e05: 'joseph_e',
  e08: 'rudeus_r',
  l03: 'rudeus_god_l',
  e07: 'sukuna_e',
};

const cache = new Map<string, HTMLImageElement | undefined>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();

export function getCachedImage(cardId: string): HTMLImageElement | undefined {
  return cache.get(cardId);
}

export function loadCardImage(cardId: string): Promise<HTMLImageElement | null> {
  const cached = cache.get(cardId);
  if (cached !== undefined) return Promise.resolve(cached ?? null);

  const existing = pending.get(cardId);
  if (existing) return existing;

  const filename = LEGACY_MAP[cardId] ?? cardId;

  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => { cache.set(cardId, img); resolve(img); };
    img.onerror = () => { cache.set(cardId, undefined); resolve(null); };
    img.src = `/characters/${filename}.webp`;
  });

  pending.set(cardId, p);
  return p;
}
