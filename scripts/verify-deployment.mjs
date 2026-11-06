import { inspectDeployment } from './release-checks.mjs';

try {
  if (process.argv.length !== 3)
    throw new Error(
      'Usage: npm run verify:deployment -- https://your-deployment.vercel.app',
    );
  console.log(
    JSON.stringify(await inspectDeployment(process.argv[2]), null, 2),
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Deployment verification failed',
  );
  process.exitCode = 1;
}
