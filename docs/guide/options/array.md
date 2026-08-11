# Tableaux & objets

---

## Tags — `UInputTags`

**Activation :** schema `type: "array"` d’items `string` + `options.format: "tags"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"tags"` | — | **Requis**. |
| `delimiter` | `String` | `","` | Séparateur à la saisie (coller une liste). |
| `placeholder` | `String` | — | Placeholder. |
| `inputTags` | `Object` | — | Pass-through → `UInputTags`. |

Les contraintes `uniqueItems`, `maxItems`, `items.maxLength` viennent du **schema**.

### Exemple

```json
{
  "type": "array",
  "title": "E-mails",
  "uniqueItems": true,
  "maxItems": 10,
  "items": { "type": "string", "format": "email" }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/emails",
  "options": {
    "format": "tags",
    "delimiter": ";",
    "placeholder": "nom@exemple.fr ;"
  }
}
```

---

## Array — cartes répétables

**Activation :** schema `type: "array"` d’objets (hors tags / multi-enum / file).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `showSortButtons` | `Boolean` | — | Affiche les boutons monter / descendre. |
| `elementLabelProp` | `String` | — | Chemin (évent. profond) de la propriété servant de titre à chaque item. |
| `detail` | `UISchemaElement` | — | UISchema template rendu pour chaque élément. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/employees",
  "options": {
    "showSortButtons": true,
    "elementLabelProp": "name"
  }
}
```

Avec UISchema détaillé :

```json
{
  "type": "Control",
  "scope": "#/properties/addresses",
  "options": {
    "showSortButtons": true,
    "elementLabelProp": "city",
    "detail": {
      "type": "HorizontalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/street" },
        { "type": "Control", "scope": "#/properties/city" }
      ]
    }
  }
}
```

---

## List with detail

Même jeu d’options que Array (`showSortButtons`, `elementLabelProp`, `detail`) lorsque le UISchema utilise le layout list-with-detail JSON Forms.

---

## Object / allOf

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `detail` | `UISchemaElement` | — | UISchema enfant personnalisé à la place de la génération automatique. |

### Exemple

```json
{
  "type": "Control",
  "scope": "#/properties/address",
  "options": {
    "detail": {
      "type": "VerticalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/line1" },
        { "type": "Control", "scope": "#/properties/zip" }
      ]
    }
  }
}
```

---

## oneOf / anyOf

Sélecteur de variante + sous-formulaire. Pas d’options métier dédiées au-delà des [options communes](./common) et du pass-through `select` / `selectMenu` sur le sélecteur.

### Exemple minimal

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "kind": { "const": "person", "title": "Personne" },
        "name": { "type": "string" }
      }
    },
    {
      "type": "object",
      "properties": {
        "kind": { "const": "company", "title": "Société" },
        "siret": { "type": "string" }
      }
    }
  ]
}
```

## Playground

- [Tags](/playground#/?section=docs&example=nuxt-tags)
- [Array](/playground#/?section=docs&example=nuxt-array)