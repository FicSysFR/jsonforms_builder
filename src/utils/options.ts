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
}
