import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'client', 'public', 'characters');

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const CHARACTERS = [
  { cardId: 'tanjiro_c',    q: 'tanjiro kamado' },
  { cardId: 'nezuko_c',     q: 'nezuko kamado' },
  { cardId: 'zenitsu_c',    q: 'zenitsu agatsuma' },
  { cardId: 'inosuke_c',    q: 'inosuke hashibira' },
  { cardId: 'eren_c',       q: 'eren yeager' },
  { cardId: 'mikasa_c',     q: 'mikasa ackerman' },
  { cardId: 'naruto_c',     q: 'naruto uzumaki' },
  { cardId: 'sasuke_c',     q: 'sasuke uchiha' },
  { cardId: 'luffy_c',      q: 'monkey d luffy' },
  { cardId: 'zoro_c',       q: 'roronoa zoro' },
  { cardId: 'gojo_r',       q: 'satoru gojo' },
  { cardId: 'rudeus_r',     q: 'rudeus greyrat' },
  { cardId: 'jotaro_r',     q: 'kujo jotaro' },
  { cardId: 'dio_r',        q: 'dio brando' },
  { cardId: 'itadori_r',    q: 'yuji itadori' },
  { cardId: 'eren_t_r',     q: 'eren yeager' },
  { cardId: 'gon_r',        q: 'gon freecss' },
  { cardId: 'killua_r',     q: 'killua zoldyck' },
  { cardId: 'joseph_e',     q: 'joseph joestar' },
  { cardId: 'orsted_e',     q: 'orsted' },
  { cardId: 'sukuna_e',     q: 'ryomen sukuna' },
  { cardId: 'madara_e',     q: 'madara uchiha' },
  { cardId: 'kaido_e',      q: 'kaidou', mal: 46109 },
  { cardId: 'giorno_l',     q: 'giorno giovanna' },
  { cardId: 'rudeus_god_l', q: 'rudeus greyrat' },
  { cardId: 'gojo_awak_l',  q: 'satoru gojo' },
];

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchCharacter(query) {
  const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'gacha-persona/1.0' } });
  if (!res.ok) {
    console.error(`  HTTP ${res.status} for "${query}"`);
    return null;
  }
  const json = await res.json();
  if (!json.data || json.data.length === 0) {
    console.error(`  No results for "${query}"`);
    return null;
  }
  const char = json.data[0];
  return {
    mal_id: char.mal_id,
    image_url: char.images.webp?.image_url || char.images.jpg?.image_url,
    name: char.name,
  };
}

async function downloadImage(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(filePath, buffer);
}

let success = 0;
let fail = 0;

for (let i = 0; i < CHARACTERS.length; i++) {
  const { cardId, q } = CHARACTERS[i];
  const outPath = join(OUT, `${cardId}.webp`);

  if (existsSync(outPath)) {
    console.log(`[${i + 1}/${CHARACTERS.length}] ${cardId} — ya existe, salteando`);
    success++;
    continue;
  }

  process.stdout.write(`[${i + 1}/${CHARACTERS.length}] ${cardId} (${q})... `);

  try {
    const result = await searchCharacter(q);
    if (!result || !result.image_url) {
      console.log('NO ENCONTRADO');
      fail++;
      await delay(400);
      continue;
    }

    await downloadImage(result.image_url, outPath);
    console.log(`OK → ${result.name} (MAL #${result.mal_id})`);
    success++;
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    fail++;
  }

  await delay(400);
}

console.log(`\nHecho. ${success} descargadas, ${fail} fallidas.`);
