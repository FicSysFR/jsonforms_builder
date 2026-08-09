export interface Options {
  showUnfocusedDescription?: boolean
  hideRequiredAsterisk?: boolean
  focus?: boolean
  step?: number
  /**
   * When a control goes from visible to hidden (SHOW/HIDE rule), resets its value to the
   * schema `default` if present, otherwise `undefined`. Enabled by default; pass `false`
   * to keep data while off-screen.
   */
  clearOnHide?: boolean
  /**
   * Icon rendered before the control (Nuxt Icon name, e.g. `i-lucide-mail`).
   * Placed beside the widget inside `UFormField`.
   * For icons inside the Nuxt UI input chrome, use `options.input.leadingIcon` instead.
   */
  leadingIcon?: string
  /**
   * Icon rendered after the control (Nuxt Icon name, e.g. `i-lucide-check`).
   * See {@link leadingIcon}.
   */
  trailingIcon?: string
}
