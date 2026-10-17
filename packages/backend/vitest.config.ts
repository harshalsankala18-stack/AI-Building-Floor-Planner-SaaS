import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ai-floor-planner/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@ai-floor-planner/ai-orchestration': path.resolve(__dirname, '../ai-orchestration/src/index.ts'),
    },
  },
  test: {
    name: '@ai-floor-planner/backend',
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
});
