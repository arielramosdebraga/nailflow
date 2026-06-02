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
    exclude: [
      '**/*.integration.test.ts',
      'functions/lib/**',
      'node_modules/**',
      '.expo/**',
      'dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        statements: 20,
        branches: 10,
        functions: 20,
        lines: 20,
      },
    },
  },
});
