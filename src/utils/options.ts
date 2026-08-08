export interface Options {
  showUnfocusedDescription?: boolean
  hideRequiredAsterisk?: boolean
  focus?: boolean
  step?: number
  /**
   * Quand un contrôle passe de visible à masqué (règle SHOW/HIDE), remet sa
   * valeur au `default` du schéma s'il existe, sinon `undefined`.
   * Activé par défaut ; passer `false` pour conserver la donnée hors UI.
   */
  clearOnHide?: boolean
}
