---
name: github-release
description: >-
  Prépare une release GitHub versionnée de @tacxou/jsonforms_builder : analyse les commits depuis le
  dernier tag, classe les changements (breaking changes, features, fixes, perf, refactor…), propose le
  bump SemVer adapté (major/minor/patch), met à jour package.json + CHANGELOG.md, rédige les notes de
  version, puis fournit la commande `make` exacte qui déclenche la release (stable = dist-tag npm
  `latest`, prerelease = dist-tag `next`). C'est la Release GitHub publiée qui déclenche la
  publication du paquet sur npm. Déclenche ce skill dès que l'utilisateur parle de « créer/publier une
  release », « nouvelle version », « bump de version », « tag », « changelog », « publier sur npm »,
  « sortir une version », ou demande d'incrémenter la version — même sans dire « release GitHub ».
---

# github-release — Préparer une release de `@tacxou/jsonforms_builder`

Ce skill prépare une release versionnée de la librairie. Le but final est un paquet publié sur
**npm** : c'est la **Release GitHub** qui déclenche la publication (voir
`references/workflow-contract.md`).

## Règles non négociables

- **Ne jamais publier soi-même.** Le skill **édite des fichiers** (`package.json`, `CHANGELOG.md`,
  `RELEASE_NOTES.md`), lance les vérifications, puis **affiche la commande** que l'utilisateur
  lancera. Ne jamais exécuter `git commit`, `git push`, `git tag`, `gh release create`,
  `npm publish`, `make release` ni `make release-ci`.
- Publier une release pousse un tag, crée une Release et met un paquet public sur npm : trois actions
  irréversibles réservées à l'utilisateur.

## Vue d'ensemble du flux

1. Vérifier les préconditions.
2. Déterminer le dernier tag et collecter les commits depuis.
3. Classer les changements et rédiger les notes de version.
4. Proposer le bump SemVer, **demander confirmation**, calculer le nouveau numéro.
5. Demander le canal : **stable** (`latest`) ou **prerelease** (`next`).
6. Appliquer : bump `package.json` + section `CHANGELOG.md` + `RELEASE_NOTES.md`.
7. Lancer les vérifications (lint + tests + build).
8. Afficher la commande à exécuter.

---

## 1. Préconditions

Vérifier et signaler tout problème **avant** de modifier quoi que ce soit :

- Working tree propre (`git status --porcelain`). S'il reste des modifs non liées, le signaler et
  demander comment procéder — ne pas les emporter dans la release.
- Branche de release = `main` (sauf indication contraire). La branche `v1-quasar` porte la v1 Quasar
  et ne doit pas servir de base à une release v2.
- `gh auth status` OK — sinon prévenir que la commande finale échouera.
- Repo : `FicSysFR/jsonforms_builder` · paquet npm : `@tacxou/jsonforms_builder`.
- Workflows présents : `ls .github/workflows/` doit montrer `release.yml` et `publish.yml`, qui
  honorent `references/workflow-contract.md`. S'ils manquent, **avertir** que rien ne sera publié
  sur npm.
- Secret `NPM_TOKEN` configuré côté dépôt (`gh secret list`) — sans lui, l'étape npm échoue.

## 2. Dernier tag et collecte des commits

- Dernier tag : `git describe --tags --abbrev=0` (ou `gh release list --limit 1`). **Les tags sont
  nus** (`1.0.3`, sans préfixe `v`) — conserver cette convention.
- Commits depuis : `git log <dernier_tag>..HEAD --pretty=format:"%h %s%n%b---END---"`. Récupérer
  sujet ET corps (le corps porte les `BREAKING CHANGE:`).
- Utile pour la lisibilité : croiser avec les PR mergées
  (`gh pr list --state merged --base main --search "merged:>=<date_dernier_tag>"`).

## 3. Classer les changements

Approche **hybride** : utiliser la convention quand elle est présente, sinon classer par le sens.

- **Conventional Commits** quand le préfixe existe :
  - `feat:` → Features
  - `fix:` → Corrections
  - `perf:` → Performance
  - `refactor:` → Refactoring
  - `docs:` → Documentation
  - `build:` / `ci:` / `chore:` / `test:` → Interne
  - Suffixe `!` (ex. `feat!:`) **ou** ligne `BREAKING CHANGE:` dans le corps → **Breaking Changes**
- **Sans préfixe** : lire le message (et si besoin `git show <hash> --stat`) pour classer. Ne jamais
  jeter un commit : s'il n'entre nulle part, le mettre en « Interne ».
- Cette librairie a une **surface publique** (renderers exportés, `options` d'uischema, props des
  composants, peerDependencies) : tout changement de cette surface est un candidat breaking change.
  Vérifier `src/index.ts` et les `peerDependencies` du diff.
- Regrouper par catégorie, reformuler chaque ligne de façon claire et orientée utilisateur, conserver
  le hash court entre parenthèses.

Format des notes : voir `references/changelog-format.md`.

## 4. Proposer le bump SemVer

Version courante = champ `version` de `package.json`.

| Présence dans les commits | Bump proposé par défaut |
|---------------------------|-------------------------|
| Au moins un Breaking Change (API publique, peer deps, comportement de rendu cassé) | **major** |
| Au moins une Feature (sans breaking) | **minor** |
| Uniquement fixes / perf / interne | **patch** |

Présenter le raisonnement (« N breaking changes détectés → je propose un **major** »), puis
**demander confirmation** via une question à choix (option recommandée en premier, suffixée
« (recommandé) »). L'utilisateur peut surclasser le choix.

Après réponse, **annoncer le nouveau numéro explicitement** (ex. « Nouvelle version : **2.1.0** »).

⚠️ Cas particulier : si `package.json` porte déjà le numéro visé (bump fait dans un commit
antérieur, comme la 2.0.0 préparée pendant la migration Nuxt UI), **ne pas re-bumper** — la release
se fera avec `INCREMENT=none`.

## 5. Canal : stable (`latest`) ou prerelease (`next`)

Demander : « Cette version est-elle **stable** (installée par défaut via `npm i
@tacxou/jsonforms_builder`) ? »

- **Oui → stable** : Release `--latest`, dist-tag npm **`latest`**.
- **Non → prerelease** : Release `--prerelease`, dist-tag npm **`next`**
  (installation explicite : `yarn add @tacxou/jsonforms_builder@next`).

Le numéro reste `X.Y.Z` dans les deux cas (pas de suffixe `-rc`/`-beta`) : c'est le flag prerelease
de la Release qui pilote le dist-tag (cf. `references/workflow-contract.md`).

## 6. Appliquer les modifications (édition de fichiers uniquement)

- **`package.json`** — champ `version` uniquement (paquet unique, pas de workspaces).
- **`CHANGELOG.md`** — prépendre la nouvelle section en haut, sous l'en-tête (créer le fichier s'il
  est absent). Format imposé : `references/changelog-format.md`. Le workflow Release **extrait cette
  section** pour en faire le corps de la Release GitHub : la version doit y figurer exactement sous
  la forme `## [X.Y.Z] - YYYY-MM-DD`.
- **`RELEASE_NOTES.md`** — même contenu (sans l'entête `## [X.Y.Z]`), à la racine. Utilisé
  uniquement par `make release` (chemin local) via `--notes-file`, puis supprimable. Il n'a pas
  vocation à être committé.

## 7. Vérifications obligatoires

Avant de présenter la release comme prête, lancer et faire passer au vert :

```bash
yarn lint
yarn test
yarn build
```

Si un check échoue, corriger la cause racine (jamais de `--no-verify`, jamais de test désactivé).
Une release n'est « prête » que lorsque lint + tests + build passent.

## 8. Afficher la commande finale (l'utilisateur la lance)

Deux chemins, tous deux en une seule cible Makefile. **Recommander `make release-ci`** : tout se
passe sur GitHub Actions (CI verte obligatoire avant publication), rien n'est publié depuis le poste.

```bash
# Chemin CI (recommandé) — la version est déjà dans package.json (committée + poussée) :
make release-ci INCREMENT=none WATCH=1

# Prerelease (dist-tag npm `next`) :
make release-ci INCREMENT=none LATEST=false WATCH=1

# Sans publication npm (Release GitHub seule) :
make release-ci INCREMENT=none NPM=false
```

`INCREMENT=patch|minor|major` laisse la CI faire le bump elle-même — à réserver aux releases sans
CHANGELOG rédigé, puisque le bump n'est alors pas connu au moment de préparer les notes.

```bash
# Chemin local — commit du bump + CHANGELOG, push, création de la Release :
make release VERSION=<X.Y.Z>

# Prerelease :
make release VERSION=<X.Y.Z> PRERELEASE=1
```

La cible `release` refuse de tourner si `VERSION` est absente, si `RELEASE_NOTES.md` n'existe pas, si
le tag existe déjà ou si `package.json` ne porte pas la version demandée — ce qui évite une release
incomplète.

Rappeler qu'une fois la Release publiée, le paquet part sur npm automatiquement, et que le commit de
bump doit être **poussé avant** (sinon la release pointe sur un commit sans le bump).

---

## Récapitulatif de ce que le skill modifie vs délègue

| Action | Fait par le skill | Délégué à l'utilisateur |
|--------|:-----------------:|:-----------------------:|
| Éditer `package.json` (version) | ✅ | |
| Éditer `CHANGELOG.md` | ✅ | |
| Écrire `RELEASE_NOTES.md` | ✅ | |
| Lancer lint + tests + build | ✅ | |
| `make release-ci` / `make release` | | ✅ |
| Tag, Release GitHub, publication npm | | GitHub Actions |
