/**
 * Quest pictogram — curated branches per day (wired main spine only).
 * Run: npx vite-node scripts/generate-quest-trees.mjs --out docs/design/QUEST_TREES.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const outArg = process.argv.indexOf('--out');
const outPath = outArg >= 0 ? process.argv[outArg + 1] : null;

/** One diagram per day — order in doc = play order; no cross-day edges (avoids Mermaid reordering). */
const DAYS = [
  {
    title: 'Day 1',
    quests: '001 Origin → 002 Sunset',
    diagram: `flowchart TB
  wake[Wake in forest] --> open{{How? or Where?}}
  open --> name[Name]
  name --> hub{{Sunset — what now?}}

  hub --> sh[Shelter ↺ hub]
  hub --> pk[Pockets ↺ hub]
  hub --> tree[Climb tree ↺ hub]
  hub --> help[Call help ↺ hub]

  hub --> food[Lemon tree → snake]
  hub --> stream[Stream]
  hub --> trails[Trails L/R]
  hub --> north[North steep]

  food & stream & trails & north --> boar{{Boar}}
  boar --> fight{{Attack · Spell · Dodge · Run}}
  fight --> night[Night rest]`,
  },
  {
    title: 'Day 2',
    quests: "003 Dyer's Crypt → 004 Shelter → 007 Dream",
    diagram: `flowchart TB
  crypt[Dyer's Crypt] --> mush{{Mushrooms?}}
  mush --> skel{{Skeleton at trunk}}
  skel --> cem{{Cemetery?}}
  cem --> shelter[Abandoned shelter]
  shelter --> crawl{{Crawl in or shout?}}
  crawl --> loot[Loot & sleep]
  loot --> dream[Day-two dream]
  dream --> nightmare{{Pick nightmare}}
  nightmare --> vision{{Flying · swim · mind}}
  vision --> dawn[Dawn]`,
  },
  {
    title: 'Day 3',
    quests: '005 Forest Cave → 004b The Door',
    diagram: `flowchart TB
  cave[Forest cave] --> ko[Knocked out]
  ko --> wake[Wake inside]
  wake --> vig[Five vignettes]
  vig --> door[The door]
  door --> approach{{Yell · knock · hide}}
  approach --> farewell[Farewell]`,
  },
  {
    title: 'Village',
    quests: '036 → 042 → 040 → 041',
    diagram: `flowchart LR
  village[Village arrival] --> shannon[Mayor Shannon] --> job[Pick a job] --> mayor[Mayor]`,
  },
];

function renderAsciiSpine() {
  return DAYS.map((d) => `${d.title}: ${d.quests}`).join('\n');
}

function renderDoc() {
  const sections = [
    '# Quest pictogram (wired spine)',
    '',
    'One compact diagram **per day**, top to bottom. Forks are diamonds; ↺ hub = return to sunset choices.',
    'Step-level copy lives in quest files and `MAIN_QUEST.md`.',
    '',
    'Regenerate: `npx vite-node scripts/generate-quest-trees.mjs --out docs/design/QUEST_TREES.md`',
    '',
    '---',
    '',
    '## Spine',
    '',
    '```',
    renderAsciiSpine(),
    '```',
    '',
  ];

  for (const day of DAYS) {
    sections.push(`## ${day.title}`, '', `*${day.quests}*`, '', '```mermaid', day.diagram, '```', '');
  }

  return sections.join('\n');
}

const doc = renderDoc();

if (outPath) {
  fs.writeFileSync(path.join(root, outPath), doc, 'utf8');
  console.log(`Wrote ${outPath}`);
} else {
  console.log(doc);
}
