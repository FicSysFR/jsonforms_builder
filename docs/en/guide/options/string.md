# Text & media

Controls based on `string` (and `object` for the WYSIWYG editor).

---

## String — `UInput`

**Trigger:** `type: "string"` (no `multi`, no special format).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `restrict` | `Boolean` | — | Enforces `schema.maxLength` and shows a character counter. |
| `input` | `Object` | — | Pass-through → [`UInput`](https://ui.nuxt.com/docs/components/input) (`size`, `color`, `ui`, …). |

The [common](./common) options (`placeholder`, `focus`, …) apply as well.

### Examples

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

Matching schema for `restrict`:

```json
{
  "type": "string",
  "maxLength": 32,
  "title": "Slug"
}
```

---

## Textarea — `UTextarea`

**Trigger:** `options.multi: true`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `multi` | `Boolean` | — | **Required** to enable the textarea renderer. |
| `rows` | `Number` | `30` | Maximum height (autoresize). |
| `minRows` | `Number` | — | Initial / minimum number of rows. |
| `textarea` | `Object` | — | Pass-through → `UTextarea`. |

### Examples

```json
{
  "type": "Control",
  "scope": "#/properties/description",
  "options": {
    "multi": true,
    "minRows": 3,
    "rows": 12,
    "placeholder": "Long description…"
  }
}
```

---

## Password

**Trigger:** schema `format: "password"`.

Same options as String (`placeholder`, `input`, …). The show / hide button is built in.

### Example

```json
{
  "type": "string",
  "format": "password",
  "title": "Password"
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

**Trigger:** `options.format: "pin"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"pin"` | — | **Required** to select this renderer. |
| `length` | `Number` | inferred (`maxLength` / pattern) | Number of cells. |
| `type` | `"text"` \| `"number"` | inferred | Keyboard / input type. |
| `mask` | `Boolean` | — | Masks the typed characters. |
| `otp` | `Boolean` | — | Enables SMS OTP autocomplete. |
| `pinInput` | `Object` | — | Pass-through → `UPinInput`. |

### Examples

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

**Trigger:** schema `format: "color"` **or** `options.format: "color"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"color"` | — | Forces the color picker when the schema has no `format: "color"`. |
| `colorFormat` | `"hex"` \| `"rgb"` \| `"hsl"` \| `"cmyk"` \| `"lab"` | `"hex"` | Notation emitted in the data. |
| `showInput` | `Boolean` | `true` | Shows the text field next to the picker. `false` = picker only. |
| `colorPicker` | `Object` | — | Pass-through → `UColorPicker`. |
| `input` | `Object` | — | Pass-through → the hex/text `UInput`. |

### Examples

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

**Trigger:** schema `format: "data-url"` **or** `options.format: "file"`.  
Multi-file: schema `type: "array"` of `string` items.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"file"` | — | Forces the upload control (useful for an array without `format: data-url`). |
| `accept` | `String` | schema `contentMediaType` | MIME filter (`image/*`, `application/pdf`, …). |
| `dropLabel` | `String` | — | Title of the drop zone. |
| `dropDescription` | `String` | — | Sub-text of the drop zone. |
| `layout` | `String` | `"list"` | Nuxt UI layout (`"list"`, `"grid"`, …). |
| `fileUpload` | `Object` | — | Pass-through → `UFileUpload`. |

### Examples

```json
{
  "type": "Control",
  "scope": "#/properties/cv",
  "options": {
    "accept": "application/pdf",
    "dropLabel": "Drop your résumé"
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/photos",
  "options": {
    "format": "file",
    "dropLabel": "Drop images here",
    "layout": "grid"
  }
}
```

---

## Autocomplete API — `UInputMenu`

**Trigger:** presence of `options.api`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `api` | `Object` | — | **Required.** Remote fetch configuration (see below). |
| `minLength` | `Number` | (internal) | Minimum number of characters before the request. |
| `suggestion` | `String[]` | — | Local fallback suggestions. |
| `placeholder` | `String` | — | Field placeholder. |
| `inputMenu` | `Object` | — | Pass-through → `UInputMenu`. |

#### `api` object

| Name | Type | Default | Description |
|---|---|---|---|
| `url` | `String` | — | **Required.** Endpoint path or URL. |
| `base` | `String` | — | Origin prefix (e.g. `https://api.example.com`). |
| `queryKey` | `String` | `"q"` | Name of the search parameter. |
| `params` | `Object` | — | Fixed query parameters. |
| `headers` | `Object` | — | HTTP headers. |
| `itemsPath` | `String` | — | Dot path to the array in the JSON response. |
| `labelKey` | `String` | `"label"` | Path to an item’s label. |
| `valueKey` | `String` | `"value"` | Path to the stored value. |

### Example

```json
{
  "type": "Control",
  "scope": "#/properties/addressId",
  "options": {
    "placeholder": "Search for an address…",
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

**Trigger:** `options.wysiwyg: true` on an `object` control (or string, depending on `contentType`).  
Requires `allRenderers` (not just `nuxtUiRenderers`).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `wysiwyg` | `Boolean` | — | **Required** (`true`) to enable the editor. |
| `contentType` | `"json"` \| `"html"` | inferred | Stored format: ProseMirror object (`json`) or HTML string (`html`). |
| `toolbar` | `Array` | Nuxt UI toolbar | Replaces the toolbar (`EditorToolbarItem[]`). |
| `placeholder` | `String` | — | Editor placeholder. |
| `editor` | `Object` | — | Pass-through → `UEditor`. |

### Examples

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
    "placeholder": "HTML input…"
  }
}
```

## Playground

- [String & Textarea](/en/playground#/?section=docs&example=nuxt-string)
- [Pin Input](/en/playground#/?section=docs&example=nuxt-pin-input)
- [Color](/en/playground#/?section=docs&example=nuxt-color)
- [File Upload](/en/playground#/?section=docs&example=nuxt-file-upload)
- [Autocomplete API](/en/playground#/?section=docs&example=nuxt-autocomplete)
- [WYSIWYG](/en/playground#/?section=docs&example=nuxt-wysiwyg)
