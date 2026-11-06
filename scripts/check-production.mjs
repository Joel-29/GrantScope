import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Defense against accidentally including the isolated design workshop in shipped JS.
const forbidden = [
  'Load configured Sepolia demo',
  'Preview emerald',
  'Example exchange',
  'Fictional design fixtures · Not live blockchain data',
];
let localAddresses = [];
try {
  localAddresses = (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => /^VITE_DEMO_/.test(line))
    .map((line) =>
      line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^['"]|['"]$/g, ''),
    )
    .filter((value) => /^0x[0-9a-f]{40}$/i.test(value))
    .map((value) => value.slice(2).toLowerCase());
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (const file of await readdir('dist/assets')) {
  if (!file.endsWith('.js')) continue;
  const source = await readFile(join('dist/assets', file), 'utf8');
  if (
    file.includes('DesignPreviewPage') ||
    file.includes('LocalDemoPanel') ||
    localAddresses.some((address) => source.toLowerCase().includes(address)) ||
    forbidden.some((marker) => source.includes(marker))
  ) {
    throw new Error(`Development-only design fixtures leaked into ${file}`);
  }
}
console.log('Production fixture isolation verified.');
