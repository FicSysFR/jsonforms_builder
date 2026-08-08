import { defineConfig } from 'vitest/config'

/**
 * Configuration séparée de `vite.config.ts` : celle-ci décrit le *build de librairie*
 * (mode `lib`, génération de déclarations via `vite-plugin-dts`), inutile — et coûteux —
 * pour la suite de tests.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],

    // Les tests portent sur des fonctions pures (composables et utilitaires) : aucun DOM
    // n'est monté, l'environnement Node suffit.
    environment: 'node',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
})
