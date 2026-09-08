# Format du CHANGELOG et des notes de version

Le même contenu sert pour la section ajoutée à `CHANGELOG.md` **et** pour le corps de la Release
GitHub. Inspiré de [Keep a Changelog](https://keepachangelog.com) + SemVer.

⚠️ Le workflow Release **parse** `CHANGELOG.md` pour retrouver la section de la version publiée :
l'entête doit être exactement `## [X.Y.Z] - YYYY-MM-DD` (ou `## [X.Y.Z](lien) - YYYY-MM-DD`), et la
section s'arrête au `##` suivant. Un entête non conforme fait retomber la Release sur les notes
générées automatiquement par GitHub.

## En-tête du fichier CHANGELOG.md (si création)

```markdown
# Changelog

All notable changes to `@tacxou/jsonforms_builder` are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/),
versioning follows [SemVer](https://semver.org/).
```

## Section d'une version (à prépendre en haut, sous l'en-tête)

Ordre des catégories (n'inclure que les catégories non vides) :

```markdown
## [X.Y.Z] - YYYY-MM-DD

### ⚠️ Breaking Changes
- Description claire du changement cassant et de la migration nécessaire (`a1b2c3d`)

### ✨ Features
- Nouvelle fonctionnalité décrite côté utilisateur (`a1b2c3d`)

### 🐛 Fixes
- Bug corrigé, formulé par l'effet observable (`a1b2c3d`)

### ⚡ Performance
- Optimisation et gain mesuré si connu (`a1b2c3d`)

### ♻️ Refactoring
- Changement interne sans impact fonctionnel (`a1b2c3d`)

### 📝 Documentation
- ... (`a1b2c3d`)

### 🔧 Internal
- CI, build, chore, tests, dépendances (`a1b2c3d`)
```

## Règles de rédaction

- **Contenu rédigé en anglais** (le CHANGELOG et les notes de Release sont en anglais), ton clair,
  orienté valeur pour l'utilisateur de la librairie — pas de copier-coller brut du message de commit.
- Une puce = un changement. Conserver le hash court entre parenthèses pour la traçabilité.
- Ce qui touche la **surface publique** (renderers exportés, options d'uischema, props, peer
  dependencies) doit être explicite : c'est ce que lisent les intégrateurs avant de monter de version.
- Pour une **prerelease**, ajouter en tête de section :
  `> ⚠️ Version instable (prerelease) — publiée sur npm sous le dist-tag `next`.`
- Date au format ISO `YYYY-MM-DD` (jour de préparation de la release).
- Lien de comparaison optionnel dans le titre :
  `## [X.Y.Z](https://github.com/FicSysFR/jsonforms_builder/compare/<prev>...<X.Y.Z>) - DATE`
  (tags nus, sans préfixe `v`).
