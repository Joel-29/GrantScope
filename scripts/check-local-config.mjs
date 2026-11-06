import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
if (
  tracked.some(
    (path) =>
      /(^|\/)\.env(?:\..*)?$/.test(path) && !path.endsWith('.env.example'),
  )
)
  throw new Error(
    'A local dotenv file is tracked; stop before committing or pushing',
  );
let values = [];
try {
  values = (await readFile('.env.local', 'utf8'))
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
for (const path of tracked) {
  let source;
  try {
    source = (await readFile(path)).toString('utf8').toLowerCase();
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (values.some((value) => source.includes(value)))
    throw new Error(`Configured local address found in tracked file: ${path}`);
}
const staged = git('diff', '--cached', '--no-ext-diff').toLowerCase();
if (values.some((value) => staged.includes(value)))
  throw new Error('Configured local address found in staged diff');
if (process.argv.includes('--module-history')) {
  const changes = git('diff', 'HEAD~4', 'HEAD', '--no-ext-diff').toLowerCase();
  if (values.some((value) => changes.includes(value)))
    throw new Error(
      'Configured local address found in the four-commit module diff',
    );
}
console.log(
  'Local configuration check passed: no dotenv files or configured demo addresses are tracked or staged.',
);
