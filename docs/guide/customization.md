# Personnalisation

Deux niveaux, du plus large au plus spécifique :

```ts
// 1. Thème global, injecté une fois pour tout l’arbre.
provide('styles', { control: { input: 'font-mono' } })
```

```json
// 2. Par élément, via les options uischema — la clé cible le composant Nuxt UI.
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": { "input": { "size": "lg", "ui": { "base": "tracking-wide" } } }
}
```

## Référence options

Chaque option est documentée en tableaux (Name / Type / Default / Description) avec exemples JSON :

- [Options communes](/guide/options/common)
- [Texte & médias](/guide/options/string)
- [Nombres](/guide/options/number)
- [Booléen](/guide/options/boolean)
- [Enumérations](/guide/options/enum)
- [Dates](/guide/options/date)
- [Tableaux & objets](/guide/options/array)
- [Layouts](/guide/options/layouts)
- [Pass-through Nuxt UI](/guide/options/pass-through)

Le playground **Control Options** (onglet Documentation) montre une partie de ces options côte à côte.
