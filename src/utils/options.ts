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
   * Icon before the control (Nuxt Icon name, e.g. `i-lucide-mail`).
   * Placement depends on {@link iconPlacement}.
   */
  leadingIcon?: string
  /**
   * Icon after the control (Nuxt Icon name, e.g. `i-lucide-check`).
   * See {@link leadingIcon}.
   */
  trailingIcon?: string
  /**
   * Where `leadingIcon` / `trailingIcon` render:
   * - `outside` (default) — beside the widget in the form field wrapper
   * - `inside` — Nuxt UI chrome (`leadingIcon` / `trailingIcon` on UInput, USelect, …)
   *
   * Pass-through still wins when set (`options.input.leadingIcon`, …).
   */
  iconPlacement?: 'outside' | 'inside'
}
