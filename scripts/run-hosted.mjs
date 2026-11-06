import { spawn } from 'node:child_process';
import { deploymentOrigin } from './release-checks.mjs';

try {
  if (process.argv.length !== 3)
    throw new Error(
      'Usage: npm run test:hosted -- https://your-deployment.vercel.app',
    );
  const origin = deploymentOrigin(process.argv[2]);
  const child = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', '--workers=1'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: origin,
        PLAYWRIGHT_PRODUCTION: '1',
        LIVE_LOCAL_DEMO: '0',
        LIVE_ANON_RPC: '0',
      },
    },
  );
  child.on('error', () => {
    console.error('Unable to start hosted browser checks');
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Invalid deployment origin',
  );
  process.exitCode = 1;
}
