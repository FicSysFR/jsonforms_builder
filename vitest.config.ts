import { defineConfig } from 'vitest/config'

/**
 * Separate from `vite.config.ts`: that file describes the *library build*
 * (`lib` mode, declaration generation via `vite-plugin-dts`), which is unused —
 * and expensive — for the test suite.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],

    // Tests cover pure functions (composables and utilities): no DOM is mounted,
    // so the Node environment is enough.
    environment: 'node',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
})
