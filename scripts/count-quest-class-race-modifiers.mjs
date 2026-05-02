import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questsDir = path.join(__dirname, '../src/components/rpg/quests');

const classRe = /\b([A-Za-z][A-Za-z0-9_]*)Class:\s*(\d+)/g;
const raceRe = /\b([A-Za-z][A-Za-z0-9_]*)Race:\s*(\d+)/g;

const classes = Object.create(null);
const races = Object.create(null);

for (const f of fs.readdirSync(questsDir)) {
  if (!f.endsWith('.ts')) continue;
  const text = fs.readFileSync(path.join(questsDir, f), 'utf8');
  let m;
  while ((m = classRe.exec(text))) {
    const stem = m[1];
    classes[stem] = (classes[stem] ?? 0) + Number(m[2]);
  }
  while ((m = raceRe.exec(text))) {
    const stem = m[1];
    races[stem] = (races[stem] ?? 0) + Number(m[2]);
  }
}

function sortEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

console.log('CLASS modifiers (sum of delta values in quest files)');
for (const [k, v] of sortEntries(classes)) {
  console.log(`  ${k}: ${v}`);
}

console.log('');
console.log('RACE modifiers (sum of delta values in quest files)');
for (const [k, v] of sortEntries(races)) {
  console.log(`  ${k}: ${v}`);
}
