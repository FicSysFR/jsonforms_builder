export { default as ControlWrapper } from '../common/control-wrapper.vue'
export { default as InputControlRenderer } from './input.vue'
export { default as BooleanControlRenderer } from './boolean.vue'
export { default as DateControlRenderer } from './date.vue'
export { default as PasswordControlRenderer } from './password.vue'
export { default as SliderControlRenderer } from './slider.vue'
export { default as EnumAndSuggestionControlRenderer } from './enum-and-suggestion.vue'
export { default as RadioGroupControlRenderer } from './radio-group.vue'
export { default as numericControlRenderer } from './numeric.vue'
export { default as TextareaControlRenderer } from './textarea.vue'
export { default as AutocompleteControlRenderer } from './autocomplete.vue'
export { default as ArrayControlRenderer } from './array.vue'
export { default as OneOfControlRenderer } from './one-of.vue'
export { default as ObjectControlRenderer } from './object.vue'
export { default as MultiEnumControlRenderer } from './multi-enum.vue'
export { default as ConstControlRenderer } from './const.vue'
export { default as AllOfControlRenderer } from './all-of.vue'
export { default as PinInputControlRenderer } from './pin-input.vue'
export { default as RatingControlRenderer } from './rating.vue'
export { default as TagsControlRenderer } from './tags.vue'
export { default as ColorControlRenderer } from './color.vue'
export { default as FileUploadControlRenderer } from './file-upload.vue'
export { default as CalendarControlRenderer } from './calendar.vue'
export { default as SelectControlRenderer } from './select.vue'

import { entry as inputControlRendererEntry } from './input.vue'
import { entry as booleanControlRendererEntry } from './boolean.vue'
import { entry as dateControlRendererEntry } from './date.vue'
import { entry as passwordControlRendererEntry } from './password.vue'
import { entry as sliderControlRendererEntry } from './slider.vue'
import { entry as enumAndSuggestionControlRenderer } from './enum-and-suggestion.vue'
import { entry as radioGroupControlRenderer } from './radio-group.vue'
import { entry as numericControlRendererEntry } from './numeric.vue'
import { entry as textareaControlRendererEntry } from './textarea.vue'
import { entry as autocompleteControlRendererEntry } from './autocomplete.vue'
import { entry as arrayControlRendererEntry } from './array.vue'
import { entry as oneOfControlRendererEntry } from './one-of.vue'
import { entry as objectControlRendererEntry } from './object.vue'
import { entry as multiEnumControlRendererEntry } from './multi-enum.vue'
import { entry as constControlRendererEntry } from './const.vue'
import { entry as allOfControlRendererEntry } from './all-of.vue'
import { entry as pinInputControlRendererEntry } from './pin-input.vue'
import { entry as ratingControlRendererEntry } from './rating.vue'
import { entry as tagsControlRendererEntry } from './tags.vue'
import { entry as colorControlRendererEntry } from './color.vue'
import { entry as fileUploadControlRendererEntry } from './file-upload.vue'
import { entry as calendarControlRendererEntry } from './calendar.vue'
import { entry as selectControlRendererEntry } from './select.vue'

export const controlsRenderers = [
  inputControlRendererEntry,
  booleanControlRendererEntry,
  dateControlRendererEntry,
  passwordControlRendererEntry,
  sliderControlRendererEntry,
  enumAndSuggestionControlRenderer,
  radioGroupControlRenderer,
  numericControlRendererEntry,
  textareaControlRendererEntry,
  autocompleteControlRendererEntry,
  arrayControlRendererEntry,
  oneOfControlRendererEntry,
  objectControlRendererEntry,
  multiEnumControlRendererEntry,
  constControlRendererEntry,
  allOfControlRendererEntry,
  pinInputControlRendererEntry,
  ratingControlRendererEntry,
  tagsControlRendererEntry,
  colorControlRendererEntry,
  fileUploadControlRendererEntry,
  calendarControlRendererEntry,
  selectControlRendererEntry,
]
