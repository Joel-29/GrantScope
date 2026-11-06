import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Cold lazy-route imports can exceed DOM query deadlines when multiple jsdom
// workers compete on development hosts. Serialize files; keep assertions intact.
export default mergeConfig(
  viteConfig,
  defineConfig({ test: { maxWorkers: 1 } }),
);
