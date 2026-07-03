import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'client', 'public', 'characters');

// MAL character IDs for our cards (manually curated)
const MAL_IDS = {
  e01: 134700,  // Tanjiro Kamado
  r01: 128070,  // Nezuko Kamado
  r02: 134702,  // Zenitsu Agatsuma
  r03: 134703,  // Inosuke Hashibira
  r04: 130592,  // Mikasa Ackerman
  e04: 146174,  // Eren Yeager (Titan)
  r05: 30,      // Gon Freecss
  e10: 116,     // Killua Zoldyck
  e03: 40,      // Monkey D. Luffy
  e02: 17,      // Naruto Uzumaki
  e11: 119,     // Sasuke Uchiha
  e06: 166554,  // Satoru Gojo
  l01: 166554,  // Satoru Gojo (Awakened)
  e09: 166555,  // Yuji Itadori
  e05: 136270,  // Joseph Joestar
  e08: 176479,  // Rudeus Greyrat
  l03: 176479,  // Rudeus Greyrat (God)
  e07: 166556,  // Ryomen Sukuna

  // New characters
  c01: 731,     // Sakura Haruno
  c02: 629,     // Iruka Umino
  c03: 779,     // Koby
  c04: 898,     // Usopp
  c05: 160380,  // Genya Shinazugawa
  c06: 160381,  // Murata
  c07: 130591,  // Armin Arlert
  c08: 142893,  // Connie Springer
  c09: 126,     // Leorio
  c10: 110,     // Kazuma Kuwabara
  c11: 137,     // Touta Matsuda
  c12: 146175,  // Pieck Finger
  c13: 124,     // Mineta Minoru
  c14: 185927,  // Hide (Tokyo Ghoul)

  r06: 28189,   // Yukari Takeba
  r07: 28190,   // Junpei Iori
  r08: 28191,   // Yosuke Hanamura
  r09: 28192,   // Chie Satonaka
  r10: 51518,   // Ryuji Sakamoto
  r11: 51519,   // Ann Takamaki
  r12: 1635,    // Misa Amane
  r13: 176855,  // Kana Arima
  r14: 176857,  // Mem-cho
  r15: 96765,   // Lucy Heartfilia
  r16: 96766,   // Gray Fullbuster
  r17: 121,     // Ochaco Uraraka
  r18: 122,     // Tenya Iida
  r19: 185928,  // Touka Kirishima

  e12: 103193,  // Makoto Yuki
  e13: 28193,   // Yu Narukami
  e14: 51516,   // Ren Amamiya
  e15: 15125,   // Light Yagami
  e16: 15126,   // L Lawliet
  e17: 176853,  // Aqua Hoshino
  e18: 176854,  // Ruby Hoshino
  e19: 96767,   // Natsu Dragneel
  e20: 118,     // Izuku Midoriya
  e21: 185909,  // Ken Kaneki

  l02: 166556,  // Ryomen Sukuna (same character, different form)
  l04: 17,      // Naruto (S6P)
  l05: 40,      // Luffy (Gear 5)
  l06: 119,     // Sasuke (Rinnegan)
  l07: 134700,  // Tanjiro (Mark)
  l08: 146174,  // Eren (Founder)
  l09: 136270,  // Joseph (Master)
  l10: 166555,  // Itadori (Awakened)
  l11: 116,     // Killua (Godspeed)
  l12: 103193,  // Makoto (Messiah)
  l13: 28193,   // Yu (Izanagi)
  l14: 51516,   // Ren (Satanael)
  l15: 15125,   // Light (Kira)
  l16: 15126,   // L (Justice)
  l17: 176853,  // Aqua (Dark Actor)
  l18: 176854,  // Ruby (New Era)
  l19: 96767,   // Natsu (Black Dragon)
  l20: 118,     // Deku (100%)
  l21: 185909,  // Kaneki (Dragon)
};

// Additional fallback search names for cards without known IDs
const SEARCH_NAMES = {
  c12: 'Pieck Finger',
  c14: 'Hideyoshi Nagachika',
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return resp;
      if (resp.status === 429) {
        console.log('  Rate limited, waiting 2s...');
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return null;
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function searchCharacter(name) {
  const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`;
  const resp = await fetchWithRetry(url);
  if (!resp) return null;
  const data = await resp.json();
  return data.data?.[0] ?? null;
}

async function downloadImage(cardId) {
  const filepath = path.join(OUT, `${cardId}.webp`);
  if (fs.existsSync(filepath)) {
    console.log(`[SKIP] ${cardId} already exists`);
    return;
  }

  let malId = MAL_IDS[cardId];
  let characterName = null;

  if (!malId) {
    // Try searching
    const searchName = SEARCH_NAMES[cardId];
    if (!searchName) {
      console.log(`[SKIP] ${cardId} - no MAL ID or search name`);
      return;
    }
    const result = await searchCharacter(searchName);
    if (!result) {
      console.log(`[FAIL] ${cardId} - not found via search for "${searchName}"`);
      return;
    }
    malId = result.mal_id;
    characterName = result.name;
  }

  // Fetch character details to get the image
  const url = `https://api.jikan.moe/v4/characters/${malId}`;
  const resp = await fetchWithRetry(url);
  if (!resp) {
    console.log(`[FAIL] ${cardId} (MAL ${malId}) - request failed`);
    return;
  }
  const data = await resp.json();
  const character = data.data;
  if (!character) {
    console.log(`[FAIL] ${cardId} (MAL ${malId}) - no data`);
    return;
  }

  const imgUrl = character.images?.webp?.image_url ?? character.images?.jpg?.image_url;
  if (!imgUrl) {
    console.log(`[FAIL] ${cardId} (MAL ${malId}) - no image URL`);
    return;
  }

  // Download image
  const imgResp = await fetch(imgUrl);
  if (!imgResp.ok) {
    console.log(`[FAIL] ${cardId} - image download failed (${imgResp.status})`);
    return;
  }

  const buffer = Buffer.from(await imgResp.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  console.log(`[OK]   ${cardId}${characterName ? ` - ${characterName}` : ''}`);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // Cards from the catalog
  const ids = [
    // COMUNES
    'c01','c02','c03','c04','c05','c06','c07','c08',
    'c09','c10','c11','c12','c13','c14',
    // RAROS
    'r01','r02','r03','r04','r05','r06','r07','r08','r09','r10',
    'r11','r12','r13','r14','r15','r16','r17','r18','r19',
    // EPICOS
    'e01','e02','e03','e04','e05','e06','e07','e08','e09','e10',
    'e11','e12','e13','e14','e15','e16','e17','e18','e19','e20','e21',
    // LEGENDARIOS
    'l01','l02','l03','l04','l05','l06','l07','l08','l09','l10',
    'l11','l12','l13','l14','l15','l16','l17','l18','l19','l20','l21',
  ];

  console.log(`Downloading images for ${ids.length} cards...\n`);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const label = `[${i + 1}/${ids.length}]`.padEnd(8);
    process.stdout.write(`${label} `);
    await downloadImage(id);
    // Rate limit: 1 request per second
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log('\nDone!');
}

main().catch(console.error);
