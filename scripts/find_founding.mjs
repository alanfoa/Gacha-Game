// Search for Founding Titan
const resp = await fetch('https://api.jikan.moe/v4/characters?q=Founding+Titan&limit=5');
const data = await resp.json();
for (const c of data.data || []) {
  console.log(`Founding Titan candidate: ID=${c.mal_id}, Name="${c.name}", Image=${c.images?.jpg?.image_url}`);
}

// Also search for "Shingeki no Kyojin" titan candidates
const resp2 = await fetch('https://api.jikan.moe/v4/characters?q=%22Shingeki+no+Kyojin%22+Titan&limit=5');
const data2 = await resp2.json();
console.log('Total results:', data2.data?.length);
