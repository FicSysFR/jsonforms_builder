import { defineConfig } from 'vitest/config'

/**
 * Separate from `vite.config.ts`: that file describes the *library build*
 * (`lib` mode, declaration generation via `vite-plugin-dts`), which is unused —
 * and expensive — for the test suite.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],

    // Keep Node as the fast default; browser-dependent suites opt into jsdom with
    // `@vitest-environment jsdom` at file level.
    environment: 'node',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'mcp/src/docs-client.ts'],
      thresholds: {
        statements: 80,
        branches: 78,
        functions: 75,
        lines: 80,
        'mcp/src/docs-client.ts': {
          statements: 90,
          branches: 85,
          functions: 85,
          lines: 90,
        },
        'src/builder/**/*.ts': {
          statements: 90,
          branches: 85,
          functions: 85,
          lines: 90,
        },
        'src/advanced/**/*.ts': {
          statements: 80,
          branches: 75,
          functions: 75,
          lines: 80,
        },
      },
    },
  },
})
