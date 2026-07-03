// Search for Attack Titan as a separate character on Jikan
const resp = await fetch('https://api.jikan.moe/v4/characters?q=Attack+Titan&order_by=favorites&sort=desc&limit=3');
const data = await resp.json();
for (const c of data.data || []) {
  console.log(`ID: ${c.mal_id}, Name: "${c.name}", Image: ${c.images?.jpg?.image_url}`);
}

// Also try Eren Titan
const resp2 = await fetch('https://api.jikan.moe/v4/characters?q=Eren+Titan&limit=3');
const data2 = await resp2.json();
for (const c of data2.data || []) {
  console.log(`ID: ${c.mal_id}, Name: "${c.name}", Image: ${c.images?.jpg?.image_url}`);
}

// Check if there's a "Titan" character specifically for Shingeki no Kyojin
const resp3 = await fetch('https://api.jikan.moe/v4/anime/16498/characters');
const data3 = await resp3.json();
const titanChars = (data3.data || []).filter(c => 
  c.character.name.toLowerCase().includes('titan') || 
  c.character.name.toLowerCase().includes('attack') ||
  c.character.name.toLowerCase().includes('eren')
);
for (const entry of titanChars) {
  console.log(`Anime char: "${entry.character.name}" (ID ${entry.character.mal_id}), role: ${entry.role}`);
}
