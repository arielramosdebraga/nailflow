import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['firestore.rules.integration.test.ts', 'functions/src/**/*.integration.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    exclude: ['functions/lib/**', '**/node_modules/**', '.expo/**', 'dist/**'],
  },
});
