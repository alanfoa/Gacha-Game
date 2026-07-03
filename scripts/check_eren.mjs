// Get character info for potential Titan images
// Character ID 165302 = "Eren" - could be Eren Kruger or Eren Titan
const resp = await fetch('https://api.jikan.moe/v4/characters/165302');
const data = await resp.json();
const c = data.data;
console.log(`Character: "${c.name}"`);
console.log(`Name: ${c.name}`);
console.log(`Kanji: ${c.name_kanji}`);
console.log(`Nicknames: ${JSON.stringify(c.nicknames)}`);
console.log(`Image: ${c.images?.jpg?.image_url}`);

// Check anime
if (c.anime) {
  for (const a of c.anime) {
    console.log(`  Anime: ${a.anime.title} (role: ${a.role})`);
  }
}
