import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT = path.resolve('E:\\Github\\gacha-persona\\client\\public\\audio\\ui');
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100; // sample rate

function writeWAV(filename, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SR * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * blockAlign;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(OUT, filename), buf);
  console.log(`  ✓ ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
}

// -- Sound generators --

function nav() {
  const dur = 0.05;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 120);
    s[i] = (Math.random() * 2 - 1) * 0.15 * env + Math.sin(2 * Math.PI * 1200 * t) * 0.3 * env;
  }
  writeWAV('nav.wav', s);
}

function confirm() {
  const dur = 0.2;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 100) * Math.exp(-t * 12);
    const f1 = Math.sin(2 * Math.PI * 523 * t);  // C5
    const f2 = Math.sin(2 * Math.PI * 659 * t);  // E5
    const f3 = Math.sin(2 * Math.PI * 784 * t);  // G5
    s[i] = (f1 * 0.3 + f2 * 0.3 + f3 * 0.4) * env * 0.35;
  }
  writeWAV('confirm.wav', s);
}

function back() {
  const dur = 0.2;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 10);
    // Descending: 400 → 250 Hz
    const freq = 400 - 150 * (t / dur);
    const f1 = Math.sin(2 * Math.PI * freq * t);
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 80);
    s[i] = (f1 * 0.5 + click * 0.5) * env * 0.35;
  }
  writeWAV('back.wav', s);
}

function packOpen() {
  const dur = 0.5;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  // Paper tear: filtered noise with amplitude modulation
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    // Amplitude envelope: attack then decay
    const env = Math.min(1, t * 30) * Math.exp(-t * 5);
    // Filtered noise (lowpass sweep)
    const noise = (Math.random() * 2 - 1) * 0.6;
    // Subtle low rumble
    const rumble = Math.sin(2 * Math.PI * 80 * t) * 0.3;
    // Tear texture: rapid crackle
    const crackle = (Math.random() * 2 - 1) * 0.4 * Math.exp(-((t - 0.15) ** 2) * 2000);
    s[i] = (noise + rumble + crackle) * env * 0.4;
  }
  writeWAV('pack_open.wav', s);
}

function cardRevealCommon() {
  const dur = 0.3;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 60) * Math.exp(-t * 8);
    const f = 600 + 200 * Math.sin(2 * Math.PI * 3 * t);
    s[i] = Math.sin(2 * Math.PI * f * t) * env * 0.35;
  }
  writeWAV('card_reveal_common.wav', s);
}

function cardRevealRare() {
  const dur = 0.35;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 60) * Math.exp(-t * 6);
    const f1 = Math.sin(2 * Math.PI * 800 * t);
    const f2 = Math.sin(2 * Math.PI * 1000 * t);
    s[i] = (f1 * 0.5 + f2 * 0.5) * env * 0.35;
  }
  writeWAV('card_reveal_rare.wav', s);
}

function cardRevealEpic() {
  const dur = 0.5;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 60) * Math.exp(-t * 4);
    // Sweep up
    const f = 500 + 800 * (t / dur);
    const harm1 = Math.sin(2 * Math.PI * f * t);
    const harm2 = Math.sin(2 * Math.PI * f * 1.5 * t) * 0.3;
    const harm3 = Math.sin(2 * Math.PI * f * 2 * t) * 0.15;
    s[i] = (harm1 * 0.5 + harm2 + harm3) * env * 0.35;
  }
  writeWAV('card_reveal_epic.wav', s);
}

function cardRevealLegendary() {
  const dur = 0.8;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 80) * Math.exp(-t * 2.5);
    // Arpeggio
    const phase = Math.min(1, t / (dur * 0.6));
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    const noteIdx = Math.min(3, Math.floor(phase * 4));
    const f = notes[noteIdx] + (notes[Math.min(3, noteIdx + 1)] - notes[noteIdx]) * ((phase * 4) % 1);
    const harm1 = Math.sin(2 * Math.PI * f * t);
    const harm2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.2;
    const harm3 = Math.sin(2 * Math.PI * f * 3 * t) * 0.1;
    // Sparkle: high shimmer
    const sparkle = Math.sin(2 * Math.PI * 8000 * t) * 0.05 * env;
    s[i] = (harm1 * 0.5 + harm2 + harm3 + sparkle) * env * 0.35;
  }
  writeWAV('card_reveal_legendary.wav', s);
}

function duplicate() {
  const dur = 0.35;
  const len = Math.floor(SR * dur);
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 8);
    // Two low descending tones + buzz
    const f1 = Math.sin(2 * Math.PI * 200 * t) * 0.4;
    const f2 = Math.sin(2 * Math.PI * 150 * t) * 0.3;
    const buzz = Math.sin(2 * Math.PI * 50 * t) * 0.6; // sub-buzz
    s[i] = (f1 + f2 + buzz) * env * 0.35;
  }
  writeWAV('duplicate.wav', s);
}

console.log('Generating UI SFX files...\n');

nav();
confirm();
back();
packOpen();
cardRevealCommon();
cardRevealRare();
cardRevealEpic();
cardRevealLegendary();
duplicate();

console.log('\n✓ All UI sounds generated!');
console.log('Location: client/public/audio/ui/');
