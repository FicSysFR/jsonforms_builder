/**
 * Side-effect import, loaded by `app.ts`.
 *
 * `eager: true` turns the pattern into static imports of each `items/*.ts`, whose
 * body calls `registerExamples` on load. That is what populates the registry that
 * `getExamples` later returns — the glob result itself is unused; only its side
 * effect matters.
 */
import.meta.glob('./items/*.ts', { eager: true })
