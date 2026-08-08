import type { Theme } from './theme'

/**
 * Thème par défaut — délibérément minimal.
 *
 * La v1 déclarait des noms de classes maison (`control`, `wrapper`, `label`…) auxquels
 * aucune feuille de style n'était livrée : ils ne produisaient rien. Ici on ne pose que
 * l'espacement et la largeur, tout le reste (couleurs, rayons, focus, états d'erreur)
 * venant du thème Nuxt UI de l'application hôte.
 */
export const defaultTheme: Theme = {
  control: {
    root: '',
    input: 'w-full',
  },
  verticalLayout: {
    root: 'grid grid-cols-1 gap-4',
    item: 'min-w-0',
  },
  horizontalLayout: {
    root: 'grid gap-4',
    item: 'min-w-0',
  },
  group: {
    root: '',
    label: 'text-sm font-semibold',
    item: 'min-w-0',
  },
  arrayList: {
    root: 'space-y-3',
    legend: 'flex items-center justify-between gap-2',
    addButton: '',
    label: 'text-sm font-semibold',
    itemWrapper: 'space-y-2',
    noData: 'text-sm text-muted',
    item: '',
    itemToolbar: 'flex items-center gap-1',
    itemLabel: 'text-sm font-medium',
    itemContent: 'space-y-4',
    itemExpanded: '',
    itemMoveUp: '',
    itemMoveDown: '',
    itemDelete: '',
  },
  label: {
    root: 'text-base font-semibold',
  },
  oneOf: {
    root: 'space-y-4',
    select: 'w-full',
  },
  categorization: {
    root: 'space-y-4',
    tabs: '',
    panel: 'pt-4',
    stepper: '',
    stepperFooter: 'flex items-center justify-between gap-2 pt-4',
    stepperButtonBack: '',
    stepperButtonNext: '',
  },
}
