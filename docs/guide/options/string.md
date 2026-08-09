# Texte & médias

Contrôles basés sur `string` (et `object` pour le WYSIWYG).

---

## String — `UInput`

**Activation :** `type: "string"` (sans `multi`, sans format spécial).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `restrict` | `Boolean` | — | Applique `schema.maxLength` et affiche un compteur de caractères. |
| `input` | `Object` | — | Pass-through → [`UInput`](https://ui.nuxt.com/docs/components/input) (`size`, `color`, `ui`, …). |

Les options [communes](./common) (`placeholder`, `focus`, …) s’appliquent aussi.

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "placeholder": "Camille Dupont",
    "input": { "size": "lg" }
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/slug",
  "options": { "restrict": true }
}
```

Schéma associé pour `restrict` :

```json
{
  "type": "string",
  "maxLength": 32,
  "title": "Slug"
}
```

---

## Textarea — `UTextarea`

**Activation :** `options.multi: true`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `multi` | `Boolean` | — | **Requis** pour activer le renderer textarea. |
| `rows` | `Number` | `30` | Hauteur maximale (autoresize). |
| `minRows` | `Number` | — | Nombre de lignes initial / minimum. |
| `textarea` | `Object` | — | Pass-through → `UTextarea`. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/description",
  "options": {
    "multi": true,
    "minRows": 3,
    "rows": 12,
    "placeholder": "Description longue…"
  }
}
```

---

## Password

**Activation :** schema `format: "password"`.

Mêmes options que String (`placeholder`, `input`, …). Le bouton d’affichage / masquage est intégré.

### Exemple

```json
{
  "type": "string",
  "format": "password",
  "title": "Mot de passe"
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/password",
  "options": { "placeholder": "••••••••" }
}
```

---

## Pin — `UPinInput`

**Activation :** `options.format: "pin"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"pin"` | — | **Requis** pour sélectionner ce renderer. |
| `length` | `Number` | inféré (`maxLength` / pattern) | Nombre de cellules. |
| `type` | `"text"` \| `"number"` | inféré | Type de clavier / saisie. |
| `mask` | `Boolean` | — | Masque les caractères saisis. |
| `otp` | `Boolean` | — | Active l’autocomplete SMS OTP. |
| `pinInput` | `Object` | — | Pass-through → `UPinInput`. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/code",
  "options": { "format": "pin", "otp": true }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/secretCode",
  "options": { "format": "pin", "mask": true, "length": 6 }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/token",
  "options": { "format": "pin", "length": 8, "type": "text" }
}
```

---

## Color — `UColorPicker`

**Activation :** schema `format: "color"` **ou** `options.format: "color"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"color"` | — | Force le color picker si le schema n’a pas `format: "color"`. |
| `colorFormat` | `"hex"` \| `"rgb"` \| `"hsl"` \| `"cmyk"` \| `"lab"` | `"hex"` | Notation émise dans les données. |
| `showInput` | `Boolean` | `true` | Affiche le champ texte à côté du picker. `false` = picker seul. |
| `colorPicker` | `Object` | — | Pass-through → `UColorPicker`. |
| `input` | `Object` | — | Pass-through → le `UInput` hex/texte. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/brandColor",
  "options": { "format": "color", "colorFormat": "rgb" }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/accent",
  "options": { "format": "color", "showInput": false }
}
```

---

## File upload — `UFileUpload`

**Activation :** schema `format: "data-url"` **ou** `options.format: "file"`.  
Multi-fichiers : schema `type: "array"` d’items `string`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"file"` | — | Force l’upload (utile pour un array sans `format: data-url`). |
| `accept` | `String` | `contentMediaType` du schema | Filtre MIME (`image/*`, `application/pdf`, …). |
| `dropLabel` | `String` | — | Titre de la zone de dépôt. |
| `dropDescription` | `String` | — | Sous-texte de la zone. |
| `layout` | `String` | `"list"` | Layout Nuxt UI (`"list"`, `"grid"`, …). |
| `fileUpload` | `Object` | — | Pass-through → `UFileUpload`. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/cv",
  "options": {
    "accept": "application/pdf",
    "dropLabel": "Déposez votre CV"
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/photos",
  "options": {
    "format": "file",
    "dropLabel": "Déposez des images",
    "layout": "grid"
  }
}
```

---

## Autocomplete API — `UInputMenu`

**Activation :** présence de `options.api`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `api` | `Object` | — | **Requis.** Configuration du fetch distant (voir ci-dessous). |
| `minLength` | `Number` | (interne) | Nombre minimum de caractères avant la requête. |
| `suggestion` | `String[]` | — | Suggestions locales de secours. |
| `placeholder` | `String` | — | Placeholder du champ. |
| `inputMenu` | `Object` | — | Pass-through → `UInputMenu`. |

#### Objet `api`

| Name | Type | Default | Description |
|---|---|---|---|
| `url` | `String` | — | **Requis.** Chemin ou URL de l’endpoint. |
| `base` | `String` | — | Préfixe d’origine (ex. `https://api.example.com`). |
| `queryKey` | `String` | `"q"` | Nom du paramètre de recherche. |
| `params` | `Object` | — | Paramètres de query fixes. |
| `headers` | `Object` | — | En-têtes HTTP. |
| `itemsPath` | `String` | — | Chemin (dot) vers le tableau dans la réponse JSON. |
| `labelKey` | `String` | `"label"` | Chemin vers le libellé d’un item. |
| `valueKey` | `String` | `"value"` | Chemin vers la valeur stockée. |

### Exemple

```json
{
  "type": "Control",
  "scope": "#/properties/addressId",
  "options": {
    "placeholder": "Rechercher une adresse…",
    "minLength": 3,
    "api": {
      "base": "https://data.geopf.fr",
      "url": "/geocodage/search",
      "queryKey": "q",
      "itemsPath": "features",
      "labelKey": "properties.label",
      "valueKey": "properties.id"
    }
  }
}
```

---

## WYSIWYG — `UEditor`

**Activation :** `options.wysiwyg: true` sur un contrôle `object` (ou string selon `contentType`).  
Nécessite `allRenderers` (pas seulement `nuxtUiRenderers`).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `wysiwyg` | `Boolean` | — | **Requis** (`true`) pour activer l’éditeur. |
| `contentType` | `"json"` \| `"html"` | inféré | Format stocké : objet ProseMirror (`json`) ou chaîne HTML (`html`). |
| `toolbar` | `Array` | toolbar Nuxt UI | Remplace la barre d’outils (`EditorToolbarItem[]`). |
| `placeholder` | `String` | — | Placeholder de l’éditeur. |
| `editor` | `Object` | — | Pass-through → `UEditor`. |

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/body",
  "options": { "wysiwyg": true, "contentType": "json" }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/notesHtml",
  "options": {
    "wysiwyg": true,
    "contentType": "html",
    "placeholder": "Saisie HTML…"
  }
}
```

## Playground

- [String & Textarea](/play/index.html?section=docs&example=nuxt-string)
- [Pin Input](/play/index.html?section=docs&example=nuxt-pin-input)
- [Color](/play/index.html?section=docs&example=nuxt-color)
- [File Upload](/play/index.html?section=docs&example=nuxt-file-upload)
- [Autocomplete API](/play/index.html?section=docs&example=nuxt-autocomplete)
- [WYSIWYG](/play/index.html?section=docs&example=nuxt-wysiwyg)