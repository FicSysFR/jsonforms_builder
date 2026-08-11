import { rendererEntry } from '../rendererEntry'

import ControlWrapper from '../common/control-wrapper.vue'
import InputControlRenderer, { entry as inputControlRendererEntry } from './input.vue'
import BooleanControlRenderer, { entry as booleanControlRendererEntry } from './boolean.vue'
import DateControlRenderer, { entry as dateControlRendererEntry } from './date.vue'
import PasswordControlRenderer, { entry as passwordControlRendererEntry } from './password.vue'
import SliderControlRenderer, { entry as sliderControlRendererEntry } from './slider.vue'
import EnumAndSuggestionControlRenderer, {
  entry as enumAndSuggestionControlRenderer,
} from './enum-and-suggestion.vue'
import RadioGroupControlRenderer, { entry as radioGroupControlRenderer } from './radio-group.vue'
import NumericControlRenderer, { entry as numericControlRendererEntry } from './numeric.vue'
import TextareaControlRenderer, { entry as textareaControlRendererEntry } from './textarea.vue'
import AutocompleteControlRenderer, {
  entry as autocompleteControlRendererEntry,
} from './autocomplete.vue'
import ArrayControlRenderer, { entry as arrayControlRendererEntry } from './array.vue'
import OneOfControlRenderer, { entry as oneOfControlRendererEntry } from './one-of.vue'
import ObjectControlRenderer, { entry as objectControlRendererEntry } from './object.vue'
import MultiEnumControlRenderer, { entry as multiEnumControlRendererEntry } from './multi-enum.vue'
import ConstControlRenderer, { entry as constControlRendererEntry } from './const.vue'
import AllOfControlRenderer, { entry as allOfControlRendererEntry } from './all-of.vue'
import PinInputControlRenderer, { entry as pinInputControlRendererEntry } from './pin-input.vue'
import RatingControlRenderer, { entry as ratingControlRendererEntry } from './rating.vue'
import TagsControlRenderer, { entry as tagsControlRendererEntry } from './tags.vue'
import ColorControlRenderer, { entry as colorControlRendererEntry } from './color.vue'
import FileUploadControlRenderer, {
  entry as fileUploadControlRendererEntry,
} from './file-upload.vue'
import CalendarControlRenderer, { entry as calendarControlRendererEntry } from './calendar.vue'
import SelectControlRenderer, { entry as selectControlRendererEntry } from './select.vue'

export {
  ControlWrapper,
  InputControlRenderer,
  BooleanControlRenderer,
  DateControlRenderer,
  PasswordControlRenderer,
  SliderControlRenderer,
  EnumAndSuggestionControlRenderer,
  RadioGroupControlRenderer,
  NumericControlRenderer as numericControlRenderer,
  TextareaControlRenderer,
  AutocompleteControlRenderer,
  ArrayControlRenderer,
  OneOfControlRenderer,
  ObjectControlRenderer,
  MultiEnumControlRenderer,
  ConstControlRenderer,
  AllOfControlRenderer,
  PinInputControlRenderer,
  RatingControlRenderer,
  TagsControlRenderer,
  ColorControlRenderer,
  FileUploadControlRenderer,
  CalendarControlRenderer,
  SelectControlRenderer,
}

// `rendererEntry` pairs each entry with the component's default export — see its doc:
// without that reference the compiled templates are tree-shaken out of production builds.
export const controlsRenderers = [
  rendererEntry(inputControlRendererEntry, InputControlRenderer),
  rendererEntry(booleanControlRendererEntry, BooleanControlRenderer),
  rendererEntry(dateControlRendererEntry, DateControlRenderer),
  rendererEntry(passwordControlRendererEntry, PasswordControlRenderer),
  rendererEntry(sliderControlRendererEntry, SliderControlRenderer),
  rendererEntry(enumAndSuggestionControlRenderer, EnumAndSuggestionControlRenderer),
  rendererEntry(radioGroupControlRenderer, RadioGroupControlRenderer),
  rendererEntry(numericControlRendererEntry, NumericControlRenderer),
  rendererEntry(textareaControlRendererEntry, TextareaControlRenderer),
  rendererEntry(autocompleteControlRendererEntry, AutocompleteControlRenderer),
  rendererEntry(arrayControlRendererEntry, ArrayControlRenderer),
  rendererEntry(oneOfControlRendererEntry, OneOfControlRenderer),
  rendererEntry(objectControlRendererEntry, ObjectControlRenderer),
  rendererEntry(multiEnumControlRendererEntry, MultiEnumControlRenderer),
  rendererEntry(constControlRendererEntry, ConstControlRenderer),
  rendererEntry(allOfControlRendererEntry, AllOfControlRenderer),
  rendererEntry(pinInputControlRendererEntry, PinInputControlRenderer),
  rendererEntry(ratingControlRendererEntry, RatingControlRenderer),
  rendererEntry(tagsControlRendererEntry, TagsControlRenderer),
  rendererEntry(colorControlRendererEntry, ColorControlRenderer),
  rendererEntry(fileUploadControlRendererEntry, FileUploadControlRenderer),
  rendererEntry(calendarControlRendererEntry, CalendarControlRenderer),
  rendererEntry(selectControlRendererEntry, SelectControlRenderer),
]
