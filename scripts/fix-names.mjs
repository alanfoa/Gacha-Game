import { readFileSync, writeFileSync } from 'node:fs';

const path = 'server/src/data/cards.ts';
let content = readFileSync(path, 'utf8');

content = content.replace(/name: '([^']+?)\([^)]+\)'/g, (_, name) => `name: '${name.trim()}'`);

writeFileSync(path, content);
console.log('Fixed card names');
