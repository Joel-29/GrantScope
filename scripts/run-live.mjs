import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
const child = spawn(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    'e2e/anon-rpc.live.spec.ts',
    '--project=desktop-chromium',
    '--workers=1',
    '--output',
    join('.npm-cache', 'live-diagnostics', randomUUID()),
  ],
  { stdio: 'inherit', env: { ...process.env, LIVE_ANON_RPC: '1' } },
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
