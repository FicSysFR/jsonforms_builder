# Dates & calendar

Segmented controls (`UInputDate` / `UInputTime`) or an inline calendar (`UCalendar`).

---

## Date / Date-time / Time — segmented fields

**Trigger:**

- schema `format: "date"` | `"date-time"` | `"time"`, **or**
- `options.format: "date"` | `"time"` | `"date-time"`

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"date"` \| `"time"` \| `"date-time"` | (schema) | Control type when the schema has no `format`. |
| `pattern` | `String` | per format | dayjs storage / display format (`YYYY-MM-DD`, `HH:mm`, `YYYY.MM`, `YYYY`, …). |
| `dateTimeOffset` | `"local"` \| `"none"` | `"local"` | `date-time` without `pattern`: offset written on a new value (`local`: the browser's at that time; `none`: naive value). |
| `locale` | `String` | `"fr-FR"` | Locale of the popover calendar. |
| `months` | `Number` | — | Number of months shown in the popover. |
| `weekNumbers` | `Boolean` | — | Shows week numbers. |
| `minDate` | `String` | — | Inclusive lower bound (`YYYY-MM-DD`, `YYYY-MM` or `YYYY`). |
| `maxDate` | `String` | — | Inclusive upper bound. |
| `disabledDates` | `String[]` | — | Excluded days (`YYYY-MM-DD`). |
| `disabledWeekdays` | `Number[]` | — | Excluded weekdays (`0` = Sunday … `6` = Saturday). |
| `disabledMonths` | `Number[]` | — | Excluded months (`1`–`12`). |
| `disabledYears` | `Number[]` | — | Excluded years. |
| `inputDate` | `Object` | — | Pass-through → `UInputDate`. |
| `inputTime` | `Object` | — | Pass-through → `UInputTime`. |
| `calendar` | `Object` | — | Pass-through → the popover calendar. |
| `calendarCard` | `Object` | — | Pass-through to the calendar card. |
| `timeCard` / `timeHour` / `timeMinute` / `timeSecond` | `Object` | — | Pass-through to the time parts. |

### Time zone offset (`date-time`)

Without a custom `pattern`, an RFC 3339 `date-time` keeps its offset: `2026-11-17T10:30:00+05:30`
shows `10:30` followed by `UTC+05:30`, and an edit is written back with `+05:30`; a `Z` value stays
in UTC. A naive value (`2026-11-17T10:30:00`) stays naive. A new value gets the browser's offset at
that date and time, daylight saving included, unless `dateTimeOffset: "none"`. With a `pattern`,
that pattern remains the sole contract.

### Examples

```json
{
  "type": "string",
  "format": "date",
  "title": "Start date"
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/startDate",
  "options": {
    "pattern": "YYYY-MM-DD",
    "locale": "en-US",
    "minDate": "2026-01-01",
    "maxDate": "2026-12-31",
    "disabledWeekdays": [0, 6]
  }
}
```

Month / year precision:

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

Time only:

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

## Calendar — inline `UCalendar`

**Trigger:** `options.format: "calendar"`.

### API

All the date constraints above (`minDate`, `disabledDates`, …) **plus**:

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"calendar"` | — | **Required**. |
| `range` | `Boolean` | — | `{ start, end }` range selection (an object schema is recommended). |
| `months` | `Number` | `2` when `range` | Number of months side by side. |
| `calendar` | `Object` | — | Pass-through → `UCalendar`. |

### Examples

Simple calendar:

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

Range with constraints:

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

- [Date & Time](/en/playground#/?section=docs&example=nuxt-dates)
- [Calendar](/en/playground#/?section=docs&example=nuxt-calendar)
- [Date ranges & constraints](/en/playground#/?section=docs&example=nuxt-date-ranges)
