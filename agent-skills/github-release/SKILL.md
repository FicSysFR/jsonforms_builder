---
name: github-release
description: >-
  Prépare une release GitHub et npm de @ficsysfr/jsonforms_builder et de son paquet MCP : analyse
  les commits depuis le dernier tag, propose la version SemVer et le canal, rédige la source de
  changelog versionnée, lance les validations, puis fournit la commande make qui déclenche l'unique
  workflow Release. À utiliser pour toute demande de release, version, tag, changelog ou publication
  npm.
---

# Préparer une release de `@ficsysfr/jsonforms_builder`

Le skill prépare les fichiers et vérifie les artefacts. Le workflow `release.yml` est le seul
composant autorisé à modifier `main`, créer le tag, publier les deux paquets npm et créer la Release
GitHub.

## Règles

- Ne jamais exécuter `npm publish`, `git tag`, `gh release create` ou `make release` à la place de
  l'utilisateur.
- Travailler depuis un `main` propre et synchronisé avec `origin/main`.
- Conserver les tags nus (`X.Y.Z`, sans `v`) et les versions identiques dans `package.json` et
  `mcp/package.json`.
- Stable : version `X.Y.Z`, canal `latest`. Prerelease : version avec suffixe SemVer, par exemple
  `X.Y.Z-rc.1`, canal `next`.
- Ne jamais réintroduire de secret npm permanent : la publication normale utilise OIDC depuis le
  workflow `release.yml` et l'environnement GitHub `npm`.

## Préparation

1. Vérifier `git status`, `gh auth status`, le dernier tag et les commits depuis ce tag.
2. Classer les changements selon Conventional Commits et leur effet réel : breaking changes,
   features, fixes, performance, refactoring, documentation, interne.
3. Proposer major/minor/patch, demander confirmation et annoncer le numéro exact.
4. Demander le canal stable/prerelease. Le suffixe de version doit correspondre au canal.
5. Créer `changelog/<version>.md` selon `references/changelog-format.md`; ne pas éditer directement
   le fichier généré `CHANGELOG.md`.
6. Lancer :

```bash
yarn changelog:build
yarn lint
yarn typecheck
yarn test:coverage
yarn test:scripts
yarn docs:build
yarn package:check
```

7. Vérifier les deux tarballs et `SHA256SUMS.txt` sous `.artifacts/npm/`.
8. Présenter la commande unique, sans l'exécuter :

```bash
make release VERSION=<X.Y.Z> CHANNEL=latest WATCH=1
# ou VERSION=<X.Y.Z-rc.1> CHANNEL=next
```

Le workflow accepte une version explicite afin qu'une relance publie ou vérifie la même version au
lieu de l'incrémenter une seconde fois.

## Surface publique

Avant de choisir le bump, inspecter les exports, les types, les peer dependencies, les options
d'UI-schema et le binaire MCP. Le changement de scope historique vers `@ficsysfr` est documenté en
2.0.2 ; la clé `@tacxou/jsonforms_builder:draft` reste volontairement inchangée.
