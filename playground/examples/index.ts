/**
 * Import à effet de bord, chargé par `app.ts`.
 *
 * `eager: true` transforme le motif en imports statiques de chaque `items/*.ts`, dont le
 * corps appelle `registerExamples` au chargement. C'est ce qui peuple le registre que
 * `getExamples` restitue ensuite — le résultat du glob lui-même ne sert à rien, seul son
 * effet de bord compte.
 */
import.meta.glob('./items/*.ts', { eager: true })
