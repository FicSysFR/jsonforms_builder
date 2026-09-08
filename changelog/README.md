# Changelog sources

Each public version has one `X.Y.Z.md` source file. These files are the source of truth for
`CHANGELOG.md` and GitHub Release notes; do not edit the generated changelog directly.

```bash
yarn changelog:build
yarn changelog:check
```

Every entry starts with this frontmatter:

```markdown
---
version: 2.0.2
date: 2026-09-08
title: FicSysFR npm migration
previous: 2.0.1
prerelease: false
---
```

The body is written in English using the existing Keep a Changelog categories. `version`, `date`
and `title` are required; the version must match the filename. `previous` controls the GitHub
comparison link, and `prerelease: true` adds the `next` channel warning.
