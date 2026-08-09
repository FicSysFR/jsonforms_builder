# Options communes

Appliquées à la plupart des contrôles (label, description, lecture seule, erreurs).

## API

| Name | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `String` | — | Placeholder du champ (là où le composant Nuxt UI le supporte). |
| `focus` | `Boolean` | — | Autofocus au montage. |
| `readonly` | `Boolean` | — | Champ en lecture seule. Aussi activé si le schema a `readOnly: true` ou si `config.readonly` est vrai. |
| `hideRequiredAsterisk` | `Boolean` | — | Masque l’astérisque des champs requis. |
| `showUnfocusedDescription` | `Boolean` | — | Affiche la description du schema même hors focus. |
| `hideDescription` | `Boolean` | — | Supprime totalement la description. |
| `clearOnHide` | `Boolean` | `true` | Si une rule `HIDE` s’applique, remet la valeur à `default` / `undefined`. Mettre `false` pour conserver la valeur. |
| `enableFilterErrorsBeforeTouch` | `Boolean` | — | Masque les erreurs de validation tant que le champ n’a pas été touché. |
| `clearable` | `Boolean` | — | Comportement « clear » (notamment rating : re-clic pour vider). |
| `leadingIcon` | `String` | — | Icône Nuxt Icon avant le contrôle (ex. `i-lucide-mail`). |
| `trailingIcon` | `String` | — | Icône Nuxt Icon après le contrôle (ex. `i-lucide-check`). |
| `styles` | `Partial<Theme>` | — | Surcharge locale des classes Tailwind du thème (voir [Personnalisation](/guide/customization)). |
| `formField` | `Object` | — | Props pass-through vers `UFormField` (voir [Pass-through](./pass-through)). |

Pour une icône *à l’intérieur* du chrome Nuxt UI (`UInput`, `USelect`, …), utilisez plutôt le pass-through : `options.input.leadingIcon` / `trailingIcon` (voir [Pass-through](./pass-through)).

## Exemples

### Description toujours visible + sans astérisque

```json
{
  "type": "Control",
  "scope": "#/properties/bio",
  "options": {
    "showUnfocusedDescription": true,
    "hideRequiredAsterisk": true,
    "placeholder": "Quelques mots…"
  }
}
```

### Lecture seule

```json
{
  "type": "Control",
  "scope": "#/properties/id",
  "options": { "readonly": true }
}
```

### Conserver la valeur quand le contrôle est masqué

```json
{
  "type": "Control",
  "scope": "#/properties/secret",
  "rule": {
    "effect": "HIDE",
    "condition": {
      "scope": "#/properties/reveal",
      "schema": { "const": false }
    }
  },
  "options": { "clearOnHide": false }
}
```

### Autofocus

```json
{
  "type": "Control",
  "scope": "#/properties/email",
  "options": { "focus": true, "placeholder": "vous@exemple.fr" }
}
```

### Icônes avant / après le contrôle

```json
{
  "type": "Control",
  "scope": "#/properties/email",
  "options": {
    "leadingIcon": "i-lucide-mail",
    "trailingIcon": "i-lucide-check",
    "placeholder": "vous@exemple.fr"
  }
}
```

Ces options placent l’icône **à côté** du widget. Pour l’intégrer **dans** le chrome Nuxt UI (`UInput`, `USelect`, …), utilisez le pass-through : `options.input.leadingIcon` / `trailingIcon` (voir [Pass-through](./pass-through)).

Voir aussi l’exemple **Leading / Trailing Icons** (`prepend-append-slots`) dans le [playground](/playground).
