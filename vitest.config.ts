import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['workspace'] },
  test: {
    environment: 'node',
    include: ['artifacts/**/*.test.ts'],
    clearMocks: true,
  },
});
