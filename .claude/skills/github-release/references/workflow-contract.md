# Contrat attendu des workflows GitHub Actions

Les workflows vivent sous `.github/workflows/` :

- `ci.yml` — lint + tests (coverage Codecov) + build. Réutilisable (`workflow_call`).
- `release.yml` — `workflow_dispatch` : appelle `ci.yml`, puis l'action composite
  `.github/actions/release` (bump + tag + Release GitHub + publication npm).
- `publish.yml` — `release: published` pour le chemin `make release`. Ignore les Releases créées par
  `github-actions[bot]` afin d'éviter une double publication npm.

## Pourquoi deux chemins

Une Release créée par le `GITHUB_TOKEN` **ne déclenche aucun autre workflow** (règle GitHub contre
les boucles). `release.yml` publie donc lui-même sur npm ; `publish.yml` couvre les Releases créées
par un humain (`make release`, CLI `gh`, UI GitHub) et se désactive sur l'auteur `github-actions[bot]`.

## Entrées de `release.yml` (`workflow_dispatch`)

| Entrée | Valeurs | Effet |
|--------|---------|-------|
| `version_increment` | `none` \| `major` \| `minor` \| `patch` | `none` publie la version déjà présente dans `package.json` ; sinon la CI bump et committe `chore(release): X.Y.Z` |
| `publish_npm` | `true` \| `false` | Build + `npm publish` (sinon Release GitHub seule) |
| `latest` | `true` \| `false` | `true` = release stable, `false` = prerelease |

## Mapping canal / dist-tag npm

| Release | `prerelease` | Tag git | dist-tag npm |
|---------|:------------:|---------|--------------|
| Stable (`latest: true`) | `false` | `X.Y.Z` | `latest` |
| Prerelease (`latest: false`) | `true` | `X.Y.Z` | `next` |

## Conventions

- **Tags nus** : `X.Y.Z`, sans préfixe `v` (convention en place depuis `1.0.0` → `1.0.3`).
- Le nom de la Release GitHub est le tag lui-même.
- Le corps de la Release vient de la section `## [X.Y.Z]` de `CHANGELOG.md` quand elle existe,
  complétée par les notes générées par GitHub (`generateReleaseNotes`).

## Garde-fous en place

- La release ne part **que si `ci.yml` est verte** (job `ci` en `needs`).
- Le tag est vérifié en local **et** sur `origin` avant toute écriture : un tag déjà pris fait
  échouer le run au lieu de produire une release incohérente.
- `npm publish` est ignoré si la version est déjà présente sur le registre (run rejoué).
- `publish.yml` vérifie que `package.json` correspond au tag de la Release avant de publier.
- `concurrency: release` empêche deux releases simultanées.

## Secrets requis

| Secret | Utilisé par |
|--------|-------------|
| `NPM_TOKEN` | `release.yml`, `publish.yml` (publication npm) |
| `CODECOV_TOKEN` | `ci.yml` (upload de couverture, non bloquant) |
| `GITHUB_TOKEN` | fourni automatiquement (push du bump/tag + création de la Release) |

## Remarques

- Toujours **pousser le commit de bump avant** de créer la Release : sinon la Release pointe sur un
  commit sans le bump de version.
- Le workflow pousse sur `main` : si la branche devient protégée, passer
  `is_branch_protected: 'true'` à l'action composite.
