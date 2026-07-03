// Download the Attack Titan (character 165302) images
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT = 'E:\\Github\\gacha-persona\\client\\public\\characters';
const urls = [
  'https://cdn.myanimelist.net/images/characters/15/366744.jpg', // pic 0
  'https://cdn.myanimelist.net/images/characters/2/381118.jpg',  // pic 1
];

for (let i = 0; i < urls.length; i++) {
  const resp = await fetch(urls[i]);
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(path.join(OUT, `attack_titan_${i}.webp`), buf);
  console.log(`attack_titan_${i}.webp: ${(buf.length / 1024).toFixed(0)}KB`);
  await new Promise(r => setTimeout(r, 500));
}
