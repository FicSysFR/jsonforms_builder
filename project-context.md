# Contexte du projet

## Produit

- Objectif : fournir `@ficsysfr/jsonforms_builder`, une bibliothèque de renderers JSON Forms pour Vue 3 basée sur Nuxt UI 4 et Tailwind CSS 4, ainsi qu'un builder visuel de formulaires.
- Utilisateurs : développeurs d'applications Vue 3 et Nuxt qui consomment JSON Forms.
- Contraintes métier majeures : préserver les contrats JSON Schema/UI schema de JSON Forms, hériter du thème de l'application hôte et ne pas imposer de dépendance runtime à Fysion.

## Architecture actuelle

- Applications ou services : bibliothèque Vue dans `src/`, playground Vite dans `playground/`, documentation VitePress bilingue dans `docs/`, paquet MCP documentaire dans `mcp/`.
- Frontières importantes : `src/controls` et `src/layouts` portent les composants Vue ; `src/composables` porte leur logique ; `src/builder` porte l'éditeur visuel ; `src/renderers.ts` et `src/rendererEntry.ts` exposent le registre JSON Forms.
- Sources de données : JSON Schema, UI schema et données de formulaire fournis par l'application hôte ; documentation construite exposée aussi via `llms.txt` et le serveur MCP.
- Intégrations externes : JSON Forms Core/Vue, Vue 3, Nuxt UI 4, Tailwind CSS 4, Vite et VitePress.

## Langage du domaine

Termes canoniques du métier, un par entrée, affûtés par le skill
`domain-language` au fil des sessions plutôt que remplis d'un coup :

- **JSON Schema** : schéma qui décrit la structure, les types et les contraintes des données du formulaire.
- **UI schema** : arbre JSON Forms qui décrit l'organisation visuelle, les contrôles et leurs options. Éviter : schéma de données.
- **Renderer** : association entre un tester JSON Forms et un composant Vue capable d'afficher un élément de UI schema.
- **Builder visuel** : interface qui compose une paire `{ schema, uischema }` sans édition JSON manuelle.

## Développement

- Runtime et versions : Node.js 22 ou supérieur ; TypeScript 5 ; Vue 3.5 ; JSON Forms 3.6 ; Nuxt UI 4.8.
- Package manager : Yarn Classic 1.22.22, avec un lockfile à la racine et un lockfile séparé dans `mcp/`.
- Commande d'installation : `yarn install --frozen-lockfile` ; pour le paquet MCP, `yarn --cwd mcp install --frozen-lockfile`.
- Commande de développement : `yarn start:dev` pour le playground sur le port 5174 ; `yarn docs:dev` pour VitePress sur le port 5173.
- Commande de build : `yarn build` pour la bibliothèque ; `yarn mcp:install && yarn mcp:build` pour le paquet MCP ; `yarn docs:build` pour le site.
- Commandes de lint, de type-check et de test : `yarn lint`, `yarn typecheck`, `yarn test`, `yarn test:coverage`, `yarn test:scripts`.
- Serveur de développement lancé par : le développeur, via les scripts Yarn ou les cibles équivalentes du `Makefile` ; un agent ne laisse pas de serveur persistant sans demande explicite.

## Conventions spécifiques

- Langue de la documentation : français sous `docs/guide` et anglais sous `docs/en/guide`; maintenir les deux variantes lorsqu'une page publique change.
- Conventions de code : TypeScript strict, composants Vue 3, templates Pug, formatage et lint avec Biome ; code, identifiants et commentaires techniques en anglais.
- Bibliothèques imposées ou interdites : réutiliser JSON Forms et Nuxt UI plutôt que dupliquer leur logique ; garder les dépendances hôtes listées comme externales dans `vite.config.ts` ; aucune dépendance runtime vers Fysion.
- Documentation à maintenir avec le code : README, guides FR/EN, catalogue du playground et sources de changelog lorsque les contrats publics évoluent.
- Fichiers générés à ne pas éditer directement : `CHANGELOG.md`, `dist/`, `coverage/`, `docs/.vitepress/dist/` et `.artifacts/`.
- Contraintes de compatibilité : build de bibliothèque ESM et CommonJS avec déclarations TypeScript ; consommation via un bundler ; versions de peer dependencies déclarées dans `package.json`.
- Exigences de sécurité ou de conformité : publication npm par Trusted Publishing/OIDC ; ne jamais ajouter de secret permanent au dépôt ou aux instructions agentiques.

## Livraison et exploitation

- Environnements : CI GitHub Actions sous Ubuntu et Node.js 22 ; environnement GitHub `npm` pour les releases ; GitHub Pages pour la documentation.
- Commande de release : préparer les sources puis présenter `make release VERSION=<version> CHANNEL=<latest|next> WATCH=1`; seul l'utilisateur déclenche cette commande.
- Déploiement : `.github/workflows/release.yml` publie les deux paquets npm et la GitHub Release ; `.github/workflows/deploy-docs.yml` déploie la documentation à chaque push sur `main`.
- Observabilité : couverture de tests publiée dans Codecov ; aucune observabilité runtime documentée pour la bibliothèque.
- Sauvegardes et rollback : aucun mécanisme applicatif documenté ; les versions npm, tags Git et releases GitHub constituent les points de restauration publiés.

Ne consigner aucun secret dans ce fichier.
