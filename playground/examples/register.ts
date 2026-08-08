import type { ExampleDescription, ExampleSection } from './example'

const knownExamples: { [key: string]: ExampleDescription } = {}

/**
 * Examples that document renderer capabilities rather than exercising JSONForms
 * edge cases. Names starting with `nuxt-` are treated as docs by default.
 */
const DOC_EXAMPLE_NAMES = new Set(['control-options', 'nuxt-ui-showcase', 'simple-form'])

const resolveSection = (example: ExampleDescription): ExampleSection => {
  if (example.section) {
    return example.section
  }
  if (example.name.startsWith('nuxt-') || DOC_EXAMPLE_NAMES.has(example.name)) {
    return 'docs'
  }
  return 'examples'
}

export const registerExamples = (examples: ExampleDescription[]): void => {
  examples.forEach((example) => {
    knownExamples[example.name] = example
  })
}

export const getExamples: () => ExampleDescription[] = () => {
  const examples = Object.keys(knownExamples).map((key) => {
    const example = knownExamples[key]
    return { ...example, section: resolveSection(example) }
  })
  examples.sort((a, b) => a.label.localeCompare(b.label))

  return examples
}

export const getExamplesBySection = (section: ExampleSection): ExampleDescription[] =>
  getExamples().filter((example) => example.section === section)
