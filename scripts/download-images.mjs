import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'client', 'public', 'characters');

// Copy from old filenames (already have these images)
const COPY_MAP = {
  e01: 'tanjiro_c', r01: 'nezuko_c', r02: 'zenitsu_c', r03: 'inosuke_c',
  r04: 'mikasa_c', e04: 'eren_t_r', r05: 'gon_r', e10: 'killua_r',
  e03: 'luffy_c', e02: 'naruto_c', e11: 'sasuke_c', e06: 'gojo_r',
  l01: 'gojo_awak_l', e09: 'itadori_r', e05: 'joseph_e', e08: 'rudeus_r',
  l03: 'rudeus_god_l', e07: 'sukuna_e',
};

// Map: card ID -> { name, animeId } – animeId is MAL anime ID
// Multiple anime ID fallbacks per character (some appear in multiple seasons/series)
const CARD_ANIME = {
  c01: { name: 'Sakura', animeIds: [20, 1735] },
  c02: { name: 'Iruka Umino', animeIds: [20] },
  c03: { name: 'Koby', animeIds: [21] },
  c04: { name: 'Usopp', animeIds: [21] },
  c05: { name: 'Genya', animeIds: [38000] },
  c06: { name: 'Murata', animeIds: [38000] },
  c07: { name: 'Armin Arlert', animeIds: [16498, 25777, 26349, 40028] },
  c08: { name: 'Connie Springer', animeIds: [16498, 25777, 26349, 40028] },
  c09: { name: 'Leorio', animeIds: [11061] },
  c10: { name: 'Kazuma Kuwabara', animeIds: [392] },
  c11: { name: 'Touta Matsuda', animeIds: [1535] },
  c12: { name: 'Pieck', animeIds: [40076, 48583, 16498, 25777, 26349, 40028] },
  c13: { name: 'Minoru Mineta', animeIds: [31964] },
  c14: { name: 'Hideyoshi Nagachika', animeIds: [22319] },
  r06: { name: 'Yukari Takeba', animeIds: [14407, 21473] },
  r07: { name: 'Junpei Iori', animeIds: [14407, 21473] },
  r08: { name: 'Yosuke Hanamura', animeIds: [10588] },
  r09: { name: 'Chie Satonaka', animeIds: [10588] },
  r10: { name: 'Ryuji Sakamoto', animeIds: [36023] },
  r11: { name: 'Ann Takamaki', animeIds: [36023] },
  r12: { name: 'Misa Amane', animeIds: [1535] },
  r13: { name: 'Kana Arima', animeIds: [52034] },
  r14: { name: 'Mem-cho', animeIds: [52034] },
  r15: { name: 'Lucy Heartfilia', animeIds: [6702] },
  r16: { name: 'Gray Fullbuster', animeIds: [6702] },
  r17: { name: 'Ochaco Uraraka', animeIds: [31964] },
  r18: { name: 'Tenya Iida', animeIds: [31964] },
  r19: { name: 'Touka Kirishima', animeIds: [22319] },
  e12: { name: 'Makoto Yuki', animeIds: [14407, 21473] },
  e13: { name: 'Yu Narukami', animeIds: [10588] },
  e14: { name: 'Ren Amamiya', animeIds: [36023] },
  e15: { name: 'Light Yagami', animeIds: [1535] },
  e16: { name: 'L Lawliet', animeIds: [1535] },
  e17: { name: 'Aqua Hoshino', animeIds: [52034] },
  e18: { name: 'Ruby Hoshino', animeIds: [52034] },
  e19: { name: 'Natsu Dragneel', animeIds: [6702] },
  e20: { name: 'Izuku Midoriya', animeIds: [31964] },
  e21: { name: 'Ken Kaneki', animeIds: [22319] },
  l02: { name: 'Ryomen Sukuna', animeIds: [40748] },
  l04: { name: 'Naruto Uzumaki', animeIds: [20, 1735] },
  l05: { name: 'Monkey D. Luffy', animeIds: [21] },
  l06: { name: 'Sasuke Uchiha', animeIds: [20, 1735] },
  l07: { name: 'Tanjiro Kamado', animeIds: [38000] },
  l08: { name: 'Eren Yeager', animeIds: [16498, 25777, 26349, 40028, 40076, 48583] },
  l09: { name: 'Joseph Joestar', animeIds: [14719] },
  l10: { name: 'Yuji Itadori', animeIds: [40748] },
  l11: { name: 'Killua Zoldyck', animeIds: [11061] },
  l12: { name: 'Makoto Yuki', animeIds: [14407, 21473] },
  l13: { name: 'Yu Narukami', animeIds: [10588] },
  l14: { name: 'Ren Amamiya', animeIds: [36023] },
  l15: { name: 'Light Yagami', animeIds: [1535] },
  l16: { name: 'L Lawliet', animeIds: [1535] },
  l17: { name: 'Aqua Hoshino', animeIds: [52034] },
  l18: { name: 'Ruby Hoshino', animeIds: [52034] },
  l19: { name: 'Natsu Dragneel', animeIds: [6702] },
  l20: { name: 'Izuku Midoriya', animeIds: [31964] },
  l21: { name: 'Ken Kaneki', animeIds: [22319] },
};

const cache = new Map();

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return resp;
      if (resp.status === 429) { await new Promise(r => setTimeout(r, 2000)); continue; }
      return null;
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function getAnimeCharacters(animeId) {
  if (cache.has(animeId)) return cache.get(animeId);
  const url = `https://api.jikan.moe/v4/anime/${animeId}/characters`;
  const resp = await fetchWithRetry(url);
  if (!resp) { cache.set(animeId, []); return []; }
  const data = await resp.json();
  const chars = data.data ?? [];
  cache.set(animeId, chars);
  return chars;
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[,.\-\s]+/g, '').trim();
}

function getNameVariants(name) {
  // Returns [ "firstlast", "lastfirst" ] for comparison
  const parts = name.replace(/[,]+/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [parts[0]?.toLowerCase() ?? ''];
  return [
    parts.join('').toLowerCase(),          // firstlast
    [...parts].reverse().join('').toLowerCase(), // lastfirst
  ];
}

async function downloadImage(cardId) {
  const filepath = path.join(OUT, `${cardId}.webp`);
  if (fs.existsSync(filepath)) return;

  // 1) Copy from old filename
  const oldName = COPY_MAP[cardId];
  if (oldName) {
    const oldPath = path.join(OUT, `${oldName}.webp`);
    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, filepath);
      console.log(`[COPY] ${cardId}`);
      return;
    }
  }

  // 2) Match by anime character list
  const info = CARD_ANIME[cardId];
  if (!info) { console.log(`[SKIP] ${cardId} - no anime mapping`); return; }

  const targetVariants = getNameVariants(info.name);

  let match = null;
  let bestScore = 0;

  // Try each anime ID
  for (const animeId of info.animeIds) {
    const chars = await getAnimeCharacters(animeId);
    for (const c of chars) {
      const apiVariants = getNameVariants(c.character.name);
      // Exact match (either order)
      if (targetVariants.some(tv => apiVariants.includes(tv))) {
        match = c; bestScore = 999; break;
      }
      // Partial: check if any word in target appears in any API word
      const targetParts = info.name.toLowerCase().split(/[\s,]+/).filter(Boolean);
      const apiParts = c.character.name.toLowerCase().split(/[\s,]+/).filter(Boolean);
      let score = 0;
      for (const tp of targetParts) {
        if (apiParts.some(ap => ap.includes(tp) || tp.includes(ap))) score++;
      }
      if (score > bestScore) { bestScore = score; match = c; }
    }
    if (bestScore >= 999) break;
  }

  const minScore = Math.max(1, Math.ceil(info.name.split(/[\s,]+/).filter(Boolean).length / 2));

  if (!match || bestScore < minScore) {
    // Fallback: search character by name
    const searchUrl = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(info.name)}&limit=3`;
    const searchResp = await fetch(searchUrl);
    if (searchResp?.ok) {
      const searchData = await searchResp.json();
      const searchChars = searchData.data ?? [];
      // Use the first result that has an image
      match = searchChars.find(c => c.images?.jpg?.image_url) ?? null;
      if (match) {
        bestScore = 999;
      }
    }
  }

  if (!match || bestScore < minScore) {
    console.log(`[FAIL] ${cardId} - ${info.name} (best score: ${bestScore})`);
    return;
  }

  const character = match.character ?? match;
  const imgUrl = character.images?.webp?.image_url ?? character.images?.jpg?.image_url;
  if (!imgUrl) { console.log(`[FAIL] ${cardId} - no image for "${character.name}"`); return; }

  const imgResp = await fetch(imgUrl);
  if (!imgResp.ok) { console.log(`[FAIL] ${cardId} - download error ${imgResp.status}`); return; }

  fs.writeFileSync(filepath, Buffer.from(await imgResp.arrayBuffer()));
  console.log(`[OK]   ${cardId} - ${character.name}`);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const ids = [
    'c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12','c13','c14',
    'r01','r02','r03','r04','r05','r06','r07','r08','r09','r10','r11','r12','r13','r14','r15','r16','r17','r18','r19',
    'e01','e02','e03','e04','e05','e06','e07','e08','e09','e10','e11','e12','e13','e14','e15','e16','e17','e18','e19','e20','e21',
    'l01','l02','l03','l04','l05','l06','l07','l08','l09','l10','l11','l12','l13','l14','l15','l16','l17','l18','l19','l20','l21',
  ];

  console.log(`Downloading images for ${ids.length} cards...\n`);

  for (let i = 0; i < ids.length; i++) {
    process.stdout.write(`[${(i + 1).toString().padStart(2, ' ')}/${ids.length}] `.padEnd(8));
    await downloadImage(ids[i]);
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log('\nDone!');
}

main().catch(console.error);
