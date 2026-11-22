import { defineConfig } from 'vitest/config';

// Tests run in UTC, like CI and production servers.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 10_000,
    env: { TZ: 'UTC' },
  },
});
