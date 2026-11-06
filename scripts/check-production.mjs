import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Defense against accidentally including the isolated design workshop in shipped JS.
const forbidden = [
  'Preview emerald',
  'Example exchange',
  'Fictional design fixtures · Not live blockchain data',
];
for (const file of await readdir('dist/assets')) {
  if (!file.endsWith('.js')) continue;
  const source = await readFile(join('dist/assets', file), 'utf8');
  if (
    file.includes('DesignPreviewPage') ||
    forbidden.some((marker) => source.includes(marker))
  ) {
    throw new Error(`Development-only design fixtures leaked into ${file}`);
  }
}
console.log('Production fixture isolation verified.');
