import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.RECIPE_PORT ?? 4319)

/** Browser recipe: built page (`yarn test:browser` builds it first) served under a strict CSP. */
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: './.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node serve.mjs',
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { RECIPE_PORT: String(port) },
  },
})
