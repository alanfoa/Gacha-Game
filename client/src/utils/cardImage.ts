// All images use cardId directly (e.g. "c01" -> "/characters/c01.webp")
const LEGACY_MAP: Record<string, string> = {};

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
