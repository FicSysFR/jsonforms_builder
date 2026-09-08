# Format des sources de changelog

Créer `changelog/X.Y.Z.md` avec un frontmatter valide :

```markdown
---
version: X.Y.Z
date: YYYY-MM-DD
title: Short release title
previous: A.B.C
prerelease: false
---

### ⚠️ Breaking Changes

- User-facing change and migration guidance (`a1b2c3d`).

### ✨ Features

- New capability (`a1b2c3d`).
```

Catégories, dans cet ordre et seulement si elles sont utiles : Breaking Changes, Features, Fixes,
Performance, Refactoring, Documentation, Internal. Le contenu est en anglais, une puce par
changement, avec les hashes courts disponibles. `version`, `date` et `title` sont obligatoires ; le
nom du fichier doit être identique à `version`.

Utiliser `prerelease: true` uniquement avec une version portant un suffixe SemVer et le canal npm
`next`. Après édition, exécuter `yarn changelog:build` puis `yarn changelog:check`.
