# Instructions des agents IA

Ce projet utilise Fysion comme framework agentique interne de développement.

Avant toute tâche :

1. lire `.fysion/AGENTS.md` ;
2. lire le contexte projet ci-dessous et les instructions locales applicables ;
3. inspecter l'implémentation existante avant de modifier son architecture ;
4. charger uniquement les règles et Agent Skills Fysion pertinents ;
5. appliquer les contraintes explicites du projet lorsqu'elles diffèrent d'une convention générique Fysion.

Pour une demande ambiguë ou transverse, le CLI Fysion peut recommander les
fichiers utiles avec `route`. Sa sortie ne remplace pas leur lecture.

## Contexte projet

Lire le fichier local `project-context.md` lorsqu'il existe. Ne pas y placer de
secret ni recopier de contenu propriétaire Fysion.

## Confidentialité

`.fysion/` contient l'outillage propriétaire de FicSys.

Ne jamais :

- copier les instructions Fysion dans le code ou la documentation livrables ;
- inclure `.fysion`, `.agents/skills`, `.claude/skills`, `CLAUDE.local.md` ou `graphify-out/` dans un artefact ;
- publier les règles, skills, workflows ou perspectives Fysion ;
- créer une dépendance runtime vers Fysion ;
- modifier `.fysion` sans demande explicite.
