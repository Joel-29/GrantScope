import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['motion/react'],
          'anon-harness': ['@anon-rpc/browser-harness'],
        },
      },
    },
  },
  test: {
    // Bound concurrent jsdom/transform work on development and CI hosts.
    maxWorkers: 4,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
