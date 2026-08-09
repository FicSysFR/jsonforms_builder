# Dates & calendrier

Contrôles segmentés (`UInputDate` / `UInputTime`) ou calendrier déplié (`UCalendar`).

---

## Date / Date-time / Time — champs segmentés

**Activation :**

- schema `format: "date"` | `"date-time"` | `"time"`, **ou**
- `options.format: "date"` | `"time"` | `"date-time"`

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"date"` \| `"time"` \| `"date-time"` | (schema) | Type de contrôle si le schema n’a pas de `format`. |
| `pattern` | `String` | selon format | Format dayjs de stockage / affichage (`YYYY-MM-DD`, `HH:mm`, `YYYY.MM`, `YYYY`, …). |
| `locale` | `String` | `"fr-FR"` | Locale du calendrier popover. |
| `months` | `Number` | — | Nombre de mois affichés dans le popover. |
| `weekNumbers` | `Boolean` | — | Affiche les numéros de semaine. |
| `minDate` | `String` | — | Borne min inclusive (`YYYY-MM-DD`, `YYYY-MM` ou `YYYY`). |
| `maxDate` | `String` | — | Borne max inclusive. |
| `disabledDates` | `String[]` | — | Jours exclus (`YYYY-MM-DD`). |
| `disabledWeekdays` | `Number[]` | — | Jours de semaine exclus (`0` = dimanche … `6` = samedi). |
| `disabledMonths` | `Number[]` | — | Mois exclus (`1`–`12`). |
| `disabledYears` | `Number[]` | — | Années exclues. |
| `inputDate` | `Object` | — | Pass-through → `UInputDate`. |
| `inputTime` | `Object` | — | Pass-through → `UInputTime`. |
| `calendar` | `Object` | — | Pass-through → calendrier du popover. |
| `calendarCard` | `Object` | — | Pass-through carte calendrier. |
| `timeCard` / `timeHour` / `timeMinute` / `timeSecond` | `Object` | — | Pass-through parties heure. |

### Exemples

```json
{
  "type": "string",
  "format": "date",
  "title": "Date de début"
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/startDate",
  "options": {
    "pattern": "YYYY-MM-DD",
    "locale": "fr-FR",
    "minDate": "2026-01-01",
    "maxDate": "2026-12-31",
    "disabledWeekdays": [0, 6]
  }
}
```

Précision mois / année :

```json
{
  "type": "Control",
  "scope": "#/properties/period",
  "options": {
    "format": "date",
    "pattern": "YYYY-MM"
  }
}
```

Heure seule :

```json
{
  "type": "Control",
  "scope": "#/properties/opening",
  "options": {
    "format": "time",
    "pattern": "HH:mm"
  }
}
```

---

## Calendar — `UCalendar` déplié

**Activation :** `options.format: "calendar"`.

### API

Toutes les contraintes de dates ci-dessus (`minDate`, `disabledDates`, …) **plus** :

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"calendar"` | — | **Requis**. |
| `range` | `Boolean` | — | Sélection de plage `{ start, end }` (schema object recommandé). |
| `months` | `Number` | `2` si `range` | Nombre de mois côte à côte. |
| `calendar` | `Object` | — | Pass-through → `UCalendar`. |

### Exemples

Calendrier simple :

```json
{
  "type": "Control",
  "scope": "#/properties/day",
  "options": {
    "format": "calendar",
    "weekNumbers": true
  }
}
```

Plage avec contraintes :

```json
{
  "type": "object",
  "properties": {
    "start": { "type": "string", "format": "date" },
    "end": { "type": "string", "format": "date" }
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/stay",
  "options": {
    "format": "calendar",
    "range": true,
    "months": 2,
    "minDate": "2026-08-01",
    "maxDate": "2026-09-30",
    "disabledWeekdays": [0, 6],
    "disabledDates": ["2026-08-15"]
  }
}
```

## Playground

- [Date & Time](/play/index.html?section=docs&example=nuxt-dates)
- [Calendar](/play/index.html?section=docs&example=nuxt-calendar)
- [Date ranges & constraints](/play/index.html?section=docs&example=nuxt-date-ranges)