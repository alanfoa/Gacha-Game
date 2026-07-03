// Get pictures for character 165302 (Eren / Attack Titan)
const resp = await fetch('https://api.jikan.moe/v4/characters/165302/pictures');
const data = await resp.json();
const pics = data.data || [];
for (let i = 0; i < pics.length; i++) {
  const url = pics[i].jpg?.image_url;
  console.log(`pic ${i}: ${url}`);
}
if (pics.length === 0) console.log('No pictures found');
