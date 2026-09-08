# Changelog

All notable changes to `@tacxou/jsonforms_builder` are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/),
versioning follows [SemVer](https://semver.org/).

## [2.0.0](https://github.com/FicSysFR/jsonforms_builder/compare/1.0.3...2.0.0) - 2026-08-11

Complete stack change: the renderers no longer build on Quasar but on
**Nuxt UI 4 + Tailwind CSS 4**, and therefore inherit the host application's theme automatically.

### ⚠️ Breaking Changes
- Renderers rewritten on the Nuxt UI `U*` components: `nuxtUiRenderers` (controls,
  layouts, additional elements) and `allRenderers` (same + the `UEditor` rich text editor) replace the
  Quasar entry points (`c3a864d`)
- `@nuxt/ui` becomes a **peerDependency** alongside `vue`, `@jsonforms/core` and
  `@jsonforms/vue`: the library bundles no component of its own and imports them from the host app's
  installation (`c3a864d`)
- Tailwind 4 must declare the library as a source — without
  `@source "../node_modules/@tacxou/jsonforms_builder/dist";`, the renderers' classes no longer have
  a matching CSS rule (`c3a864d`)
- Quasar components and styles that became unnecessary removed from the public surface (`3330b90`)
- v1 remains available: `v1-quasar` branch and `@tacxou/jsonforms_builder@1.x` on npm

### ✨ Features
- **Visual builder**: import of an existing `{ schema, uischema }`, automatic draft save
  in `localStorage`, JSON export including the data (`b7deded`, `586c236`)
- New controls: PIN, color picker, file upload, rating, calendar and tags
  (`6abee43`)
- Slider control split from the number control, with its own options (`c5cf5d5`)
- Dates: calendar popover + `TimePicker` on the date control (`aa5c2f3`), date constraints and
  range selection (`919712d`, `3b6acff`), calendar type resolution (`f448bb0`)
- `leading` / `trailing` icons on controls, with `iconPlacement` to render them inside
  or outside the Nuxt UI component (`ce1da48`, `0ec768d`)
- WYSIWYG: JSON or HTML `contentType`, configurable toolbar and density, image upload with
  drag-resize and a replace/delete bubble (`55f8fd5`, `030abe8`, `4e103fc`)
- `clearOnHide` option: resets the value of a control hidden by a rule (`4e48c83`)
- `allOf` schemas handled by a dedicated `useAllOfControl` composable (`5004164`)
- Arrays: support for combinator schemas in items (`a9085ce`)
- JSONForms translator wired into the gallery and i18n exports completed (`6fe83fc`)

### 🐛 Fixes
- Year input: years being typed and years below 100 are no longer rewritten
  (`bf3b611`)
- Object control: the data structure is preserved on render (`bcd39d9`) and infinite recursion
  on self-referencing schemas is now blocked (`be9b8d9`)
- Menus: workaround for the upstream `onClickOutside` defect (`@vueuse/core`) that threw
  `Cannot read properties of null (reading 'subTree')` when unmounting a subtree (`7c9ba21`)
- Gallery search field: no more unwanted autofill from Chrome's password manager
  (`85c1543`, `9010da2`)

### ⚡ Performance
- Object control: optimized render logic and lighter error propagation (`c89e42b`)
- `allOf`: `useJsonFormsControl` replaces `useJsonFormsAllOfControl`, with a performance test on
  deep schema flattening (`dd8ac16`, `6c4fbc4`)

### ♻️ Refactoring
- Stronger typing: `any` replaced by `unknown` and refined definitions in the configuration and the
  controls (`a93e06a`, `85e6357`)
- Date control cleaned of unused references, popover alignment revised, tests added for the
  `readonly` and `disabled` states (`79fe52f`)

### 📝 Documentation
- VitePress site with an embedded playground (routes `#/?example=…` / `#/builder`), sidebar
  filtering through the query string and an inspection tab (`1d5e1a9`, `dda2adc`, `fb01be0`, `0fd4a41`,
  `edc06f0`)
- Enriched option guides: icons, slider, WYSIWYG, interactive showcases (`6c051f7`, `030abe8`)

### 🔧 Internal
- Migration from Bun to Yarn Classic as the single package manager (`c662022`)
- ESLint and Prettier replaced by **Biome** (lint + format), rules adjusted for Vue/Pug and
  Tailwind (`88b09ca`, `11b5a8f`, `d240bba`, `e30540e`, `352fa4c`)
- GitHub Actions workflows moved to `actions/checkout@v5` and `actions/setup-node@v5` (`2934f27`)
- Regression and performance test suites exposed as dedicated commands, performance budgets
  readjusted (`ab80049`, `25fc56d`)
