import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT = path.resolve('E:\\Github\\gacha-persona\\client\\public\\characters');

// Try downloading index 12 and 14 from Eren's pictures (largest = likely Titan form)
const erenPics = [
  'https://cdn.myanimelist.net/images/characters/7/559285.jpg',  // index 12, 143KB
  'https://cdn.myanimelist.net/images/characters/14/577554.jpg', // index 14, 111KB
  'https://cdn.myanimelist.net/images/characters/12/577553.jpg', // index 13, 79KB
  'https://cdn.myanimelist.net/images/characters/2/577555.jpg',  // index 15, 89KB
  'https://cdn.myanimelist.net/images/characters/12/577556.jpg', // index 16, 106KB
  'https://cdn.myanimelist.net/images/characters/4/577557.jpg',  // index 17, 51KB
];

async function webpify(imgUrl, outName) {
  const resp = await fetch(imgUrl);
  if (!resp.ok) { console.log(`FAIL ${outName}: status ${resp.status}`); return; }
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(path.join(OUT, outName), buf);
  console.log(`OK ${outName}: ${(buf.length / 1024).toFixed(0)}KB`);
}

for (let i = 0; i < erenPics.length; i++) {
  await webpify(erenPics[i], `eren_titan_test_${i}.webp`);
  await new Promise(r => setTimeout(r, 500));
}
