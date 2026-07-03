import * as fs from 'node:fs';

// Try the Fandom wiki for Eren's Attack Titan image
const resp = await fetch('https://attackontitan.fandom.com/wiki/File:Attack_Titan_(Anime)_character_image_(Eren_Jaeger).png');
const html = await resp.text();

// Find image URL patterns
const imgRegex = /https:[^"']+\.(?:png|jpg|webp)[^"']*Attack_Titan[^"']*/i;
const match = html.match(imgRegex);
if (match) {
  console.log('Found direct:', match[0]);
} else {
  const ogRegex = /property="og:image" content="([^"]+)"/;
  const ogMatch = html.match(ogRegex);
  if (ogMatch) console.log('OG image:', ogMatch[1]);
  
  // Look for any fandom image URL
  const fandomRegex = /https:\/\/static\.wikia\.nocookie\.net[^"]+/g;
  const fandomMatches = [...html.matchAll(fandomRegex)];
  for (const m of fandomMatches.slice(0, 5)) {
    console.log('Fandom image:', m[0]);
  }
}
