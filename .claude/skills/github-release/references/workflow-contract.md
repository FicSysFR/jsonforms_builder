# Contrat du workflow Release

- `ci.yml` est réutilisable et bloque sur lint, tests, build, documentation, changelog et audit npm.
- `release.yml` est le seul workflow de publication et ne se déclenche que manuellement.
- Entrées : `version` SemVer explicite et `channel` (`latest` ou `next`).
- Environnement : `npm`; permissions minimales `contents: write` et `id-token: write`.
- Paquets : `@ficsysfr/jsonforms_builder` et `@ficsysfr/jsonforms_builder-mcp`, toujours à la même
  version.
- Tags Git nus ; le nom de la Release est le tag.
- Les tarballs générés par `yarn package:check` sont ceux publiés et joints à la Release avec leurs
  sommes SHA-256.
- Une version déjà présente n'est ignorée que si son intégrité npm correspond exactement au
  tarball local. Toute divergence échoue.
- Une relance réutilise un tag existant après validation ; un avancement concurrent de `main`
  entraîne un rebase et une nouvelle validation avant le push atomique.
- La Release GitHub n'est créée qu'après publication et vérification des deux paquets.

Authentification normale : npm Trusted Publishing pour `FicSysFR/jsonforms_builder`, fichier
`release.yml`, environnement `npm`, publication directe autorisée. `NPM_BOOTSTRAP_TOKEN` est un
secret temporaire réservé à la toute première publication et doit être révoqué ensuite.
