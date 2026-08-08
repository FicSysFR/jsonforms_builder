/**
 * REGRESSION P2 — golden des exemples playground critiques.
 */
import { describe, expect, it } from 'vitest'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { collectCoverageGaps, formatCoverageGaps } from './coverage-walk'
import { resolveWinner } from './testers-mirror'

import { schema as allOfSchema, uischema as allOfUi } from '../../playground/examples/items/allOf'
import {
  schema as allOfPerfSchema,
  uischema as allOfPerfUi,
} from '../../playground/examples/items/allOf-perf'
import {
  schema as objectSchema,
  uischemaNonRoot as objectUi,
  uischemaRoot as objectRootUi,
} from '../../playground/examples/items/object'
import { schema as oneOfSchema, uischema as oneOfUi } from '../../playground/examples/items/oneOf'
import { schema as anyOfSchema, uischema as anyOfUi } from '../../playground/examples/items/anyOf'
import {
  schema as oneOfArraySchema,
  uischema as oneOfArrayUi,
} from '../../playground/examples/items/oneOfArray'
import {
  schema as arraysSchema,
  uischema as arraysUi,
} from '../../playground/examples/items/arrays'
import {
  schema as additionalSchema,
  uischema as additionalUi,
} from '../../playground/examples/items/additional-properties'
import {
  schema as mixedSchema,
  uischema as mixedUi,
} from '../../playground/examples/items/mixed-object'

const expectNoGaps = (name: string, schema: JsonSchema, uischema: UISchemaElement) => {
  const gaps = collectCoverageGaps(schema, uischema)
  expect(gaps, `${name}: ${formatCoverageGaps(gaps)}`).toEqual([])
}

describe('REGRESSION — golden exemples playground', () => {
  it('REGRESSION: allOf n’a aucun trou', () => {
    expectNoGaps('allOf', allOfSchema as JsonSchema, allOfUi as UISchemaElement)
  })

  it('REGRESSION: allOf-perf n’a aucun trou', () => {
    expectNoGaps('allOf-perf', allOfPerfSchema as JsonSchema, allOfPerfUi as UISchemaElement)
  })

  it('REGRESSION: object (root + nested) n’a aucun trou', () => {
    expectNoGaps('rootObject', objectSchema as JsonSchema, objectRootUi as UISchemaElement)
    expectNoGaps('object', objectSchema as JsonSchema, objectUi as UISchemaElement)
  })

  it('REGRESSION: oneOf n’a aucun trou / $ref nu', () => {
    expectNoGaps('oneOf', oneOfSchema as JsonSchema, oneOfUi as UISchemaElement)
  })

  it('REGRESSION: anyOf n’a aucun trou', () => {
    expectNoGaps('anyOf', anyOfSchema as JsonSchema, anyOfUi as UISchemaElement)
  })

  it('REGRESSION: oneOfArray (items combinator) n’a aucun trou', () => {
    expectNoGaps('oneOfArray', oneOfArraySchema as JsonSchema, oneOfArrayUi as UISchemaElement)
  })

  it('REGRESSION: arrays n’a aucun trou', () => {
    expectNoGaps('arrays', arraysSchema as JsonSchema, arraysUi as UISchemaElement)
  })

  it('REGRESSION: additional-properties n’a aucun trou', () => {
    expectNoGaps(
      'additional-properties',
      additionalSchema as JsonSchema,
      additionalUi as UISchemaElement,
    )
  })

  it('REGRESSION: mixed-object n’a aucun trou (unions)', () => {
    expectNoGaps('mixed-object', mixedSchema as JsonSchema, mixedUi as UISchemaElement)
  })

  it('REGRESSION: shipping_address est AllOfControl', () => {
    expect(
      resolveWinner(
        { type: 'Control', scope: '#/properties/shipping_address' },
        allOfSchema as JsonSchema,
        allOfSchema as JsonSchema,
      ),
    ).toEqual({ name: 'AllOfControl', rank: 4 })
  })

  it('REGRESSION: mixed (json-editor) n’est pas ObjectControl', () => {
    /**
     * Symptôme : union complète sans properties → carte vide via ObjectControl rang 2.
     */
    const winner = resolveWinner(
      { type: 'Control', scope: '#/properties/mixed' },
      mixedSchema as JsonSchema,
      mixedSchema as JsonSchema,
    )

    expect(winner?.name).not.toBe('ObjectControl')
    expect(winner?.name).toBe('InputControl')
  })

  it('REGRESSION: nullableObject avec properties reste ObjectControl', () => {
    expect(
      resolveWinner(
        { type: 'Control', scope: '#/properties/nullableObject' },
        mixedSchema as JsonSchema,
        mixedSchema as JsonSchema,
      ),
    ).toEqual({ name: 'ObjectControl', rank: 2 })
  })

  it('REGRESSION: addressOrUsers est ArrayControl (items oneOf)', () => {
    expect(
      resolveWinner(
        { type: 'Control', scope: '#/properties/addressOrUsers' },
        oneOfArraySchema as JsonSchema,
        oneOfArraySchema as JsonSchema,
      ),
    ).toEqual({ name: 'ArrayControl', rank: 2 })
  })

  it('REGRESSION: entries allOf-perf → ListWithDetail / ArrayControl', () => {
    expect(
      resolveWinner(
        { type: 'ListWithDetail', scope: '#/properties/entries' } as UISchemaElement,
        allOfPerfSchema as JsonSchema,
        allOfPerfSchema as JsonSchema,
      ),
    ).toMatchObject({ name: 'ListWithDetail', rank: 4 })

    expect(
      resolveWinner(
        { type: 'Control', scope: '#/properties/entries' },
        allOfPerfSchema as JsonSchema,
        allOfPerfSchema as JsonSchema,
      ),
    ).toEqual({ name: 'ArrayControl', rank: 2 })
  })
})
