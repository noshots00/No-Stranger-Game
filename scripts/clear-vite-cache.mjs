/**
 * Removes Vite's dependency pre-bundle cache (node_modules/.vite).
 * Safe when missing. Used by npm run dev:clean before vite --force.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, 'node_modules', '.vite');
try {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  process.stderr.write('[dev:clean] cleared node_modules/.vite\n');
} catch {
  // missing cache is fine
}
