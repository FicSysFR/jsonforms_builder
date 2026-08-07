import type { DefineComponent, InjectionKey } from 'vue'
import { useControlAppliedOptions } from './composition'
import type { Theme } from '../theme'

export const IsDynamicPropertyContext: InjectionKey<boolean> = Symbol.for(
  'jsonforms-vue-nuxtui:IsDynamicPropertyContext',
)

export type AppliedOptions = ReturnType<typeof useControlAppliedOptions>

export interface ControlWrapperProps {
  id?: string
  description?: string
  errors?: string
  label?: string
  visible?: boolean
  required?: boolean
  isFocused?: boolean
  styles?: Theme
  appliedOptions?: AppliedOptions
}

export type ControlWrapperType = DefineComponent<
  ControlWrapperProps,
  any,
  any,
  any
>

export const ControlWrapperSymbol: InjectionKey<ControlWrapperType> =
  Symbol.for('jsonforms-vue-nuxtui:ControlWrapper')
