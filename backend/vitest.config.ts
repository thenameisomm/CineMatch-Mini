import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    // Run test files sequentially: each file boots its own in-memory MongoDB.
    fileParallelism: false,
    exclude: ['node_modules', 'dist'],
  },
});
