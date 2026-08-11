# Customization

Two levels, from the broadest to the most specific:

```ts
// 1. Global theme, injected once for the whole tree.
provide('styles', { control: { input: 'font-mono' } })
```

```json
// 2. Per element, through the uischema options — the key targets the Nuxt UI component.
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": { "input": { "size": "lg", "ui": { "base": "tracking-wide" } } }
}
```

## Options reference

Every option is documented in tables (Name / Type / Default / Description) with JSON examples:

- [Common options](/en/guide/options/common)
- [Text & media](/en/guide/options/string)
- [Numbers](/en/guide/options/number)
- [Boolean](/en/guide/options/boolean)
- [Enums](/en/guide/options/enum)
- [Dates](/en/guide/options/date)
- [Arrays & objects](/en/guide/options/array)
- [Layouts](/en/guide/options/layouts)
- [Nuxt UI pass-through](/en/guide/options/pass-through)

The **Control Options** playground showcase (Documentation tab) shows some of these options side by side.
