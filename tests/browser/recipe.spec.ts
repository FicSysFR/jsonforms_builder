import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Browser, expect, type Page, test } from '@playwright/test'

type Violation = { directive: string; blocked: string; sample: string; source: string }

type RecipeWindow = Window & {
  __recipe?: { ready: boolean; data: Record<string, unknown>; changes: number }
  __violations?: Violation[]
}

const ORIGIN = `http://127.0.0.1:${Number(process.env.RECIPE_PORT ?? 4319)}`
const CATEGORIES = ['Simple', 'Dates', 'Structures']

/**
 * Records CSP violations (from an init script, which the page CSP does not govern; it listens
 * on `document`, so teleported popovers are covered), requests leaving the page origin and
 * uncaught errors.
 */
const watch = async (page: Page) => {
  const external: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.origin !== ORIGIN) external.push(url.href)
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const target = window as RecipeWindow
    target.__violations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      target.__violations?.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
        sample: event.sample,
        source: `${event.sourceFile}:${event.lineNumber}`,
      })
    })
  })
  return {
    external,
    errors,
    violations: () => page.evaluate(() => (window as RecipeWindow).__violations ?? []),
  }
}

/**
 * Nuxt UI's colors plugin (host configuration, not the library) writes the theme variables in an
 * inline `<style>`. A host allows it by hash or nonce: the recipe computes the exact hash once,
 * on a page loaded without CSP, and allows only that one.
 */
let hostStyleSources: string[] = []

const computeHostStyleSources = async (browser: Browser) => {
  const context = await browser.newContext({ baseURL: ORIGIN })
  const page = await context.newPage()
  await page.route('**/*', async (route) => {
    const response = await route.fetch()
    const headers = { ...response.headers() }
    delete headers['content-security-policy']
    await route.fulfill({ response, headers })
  })
  await page.goto('/')
  await page.waitForFunction(() => (window as RecipeWindow).__recipe?.ready === true)
  const styles = await page.evaluate(() =>
    [...document.querySelectorAll('style#nuxt-ui-colors, style[data-nuxt-ui-colors]')].map(
      (style) => style.textContent ?? '',
    ),
  )
  await context.close()
  return styles.map(
    (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`,
  )
}

/** Adds the host style hashes to the `style-src` of the page response, nothing else. */
const allowHostStyles = async (page: Page) => {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    const headers = { ...response.headers() }
    headers['content-security-policy'] = headers['content-security-policy'].replace(
      "style-src 'self'",
      `style-src 'self' ${hostStyleSources.join(' ')}`,
    )
    await route.fulfill({ response, headers })
  })
}

const open = async (page: Page, query: string) => {
  const response = await page.goto(`/?${query}`)
  const csp = response?.headers()['content-security-policy'] ?? ''
  expect(csp).toContain("script-src 'self'")
  expect(csp).not.toMatch(/unsafe-(inline|eval)|data:|blob:/)
  await page.waitForFunction(() => (window as RecipeWindow).__recipe?.ready === true)
  await expect(page.locator('#form [role=tab]').first()).toBeVisible()
}

const formData = (page: Page) =>
  page.evaluate(() => JSON.parse(JSON.stringify((window as RecipeWindow).__recipe?.data ?? {})))

const field = (page: Page, name: string) => page.locator(`[id="#/properties/${name}-input"]`)

/**
 * Tries to edit every field of every category: typing, toggling, choosing, sliding, adding,
 * opening popovers (color, date picker) and picking a calendar day.
 */
const pokeEveryField = async (page: Page) => {
  const form = page.locator('#form')
  const attempt = async (action: () => Promise<unknown>) => {
    await action().catch(() => undefined)
    await page.keyboard.press('Escape').catch(() => undefined)
  }

  for (const category of CATEGORIES) {
    await page.getByRole('tab', { name: category }).click()
    await page.waitForTimeout(100)
    await expect(page.getByText(/no applicable renderer/i)).toHaveCount(0)

    for (const input of await form.locator('input:not([type=hidden]), textarea').all()) {
      if (!(await input.isVisible())) continue
      await attempt(async () => {
        await input.click({ force: true, timeout: 1000 })
        await page.keyboard.type('9')
        await page.keyboard.press('Enter')
      })
    }
    for (const toggle of await form
      .locator('[role=checkbox], [role=switch], [role=radio], [role=slider]')
      .all()) {
      if (!(await toggle.isVisible())) continue
      await attempt(async () => {
        await toggle.click({ force: true, timeout: 1000 })
        await page.keyboard.press('ArrowRight')
      })
    }
    for (const combobox of await form.locator('[role=combobox]').all()) {
      if (!(await combobox.isVisible())) continue
      await attempt(async () => {
        await combobox.click({ force: true, timeout: 1000 })
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
      })
    }
    for (const trigger of await form.locator('button[aria-haspopup="dialog"]').all()) {
      if (!(await trigger.isVisible())) continue
      await attempt(async () => {
        await trigger.click({ force: true, timeout: 1000 })
        await page.waitForTimeout(100)
      })
    }
    const day = form.locator('[role=grid] [data-reka-calendar-cell-trigger]:not([data-disabled])')
    if (
      await day
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await attempt(() => day.nth(3).click({ force: true, timeout: 1000 }))
    }
    for (const add of await form.getByRole('button', { name: /ajouter|add/i }).all()) {
      if (!(await add.isVisible())) continue
      await attempt(() => add.click({ force: true, timeout: 1000 }))
    }
  }
}

/**
 * Deterministic edits of the kinds the sweep reaches unreliably (searchable select, nested
 * object, array). Each one is attempted, so a locked control simply stays as it is.
 */
const editTargetedFields = async (page: Page) => {
  const quietly = async (action: () => Promise<unknown>) => {
    await action().catch(() => undefined)
    await page.keyboard.press('Escape').catch(() => undefined)
    await page.waitForTimeout(250)
  }
  await page.getByRole('tab', { name: 'Simple' }).click()
  await quietly(async () => {
    await field(page, 'enum').click({ timeout: 1000 })
    await page.getByRole('option', { name: 'gamma' }).click({ timeout: 1000 })
  })
  await page.getByRole('tab', { name: 'Structures' }).click()
  await quietly(() => field(page, 'street').fill('2 avenue', { timeout: 1000 }))
  await quietly(() =>
    page.locator('#form').getByRole('button', { name: 'Ajouter' }).first().click({ timeout: 1000 }),
  )
}

test.beforeAll(async ({ browser }) => {
  hostStyleSources = await computeHostStyleSources(browser)
})

test.describe('strict CSP recipe (no unsafe-inline, no unsafe-eval, no data: or blob:)', () => {
  test('strictCspRenderers render and edit with zero violation', async ({ page }) => {
    expect(hostStyleSources, 'Nuxt UI colors style found').toHaveLength(1)
    await allowHostStyles(page)
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation')

    const before = await formData(page)
    await expect(page.locator('[id="#/properties/shownByRule-input"]')).toHaveCount(0)
    await pokeEveryField(page)
    const after = await formData(page)

    expect(await watcher.violations()).toEqual([])
    expect(watcher.external, 'icons and requests must stay on the origin').toEqual([])
    expect(watcher.errors).toEqual([])
    expect(after.checkbox).toBe(!before.checkbox)
    // The LEAF rule on `shownByRule` evaluated without Ajv once the checkbox flipped.
    await page.getByRole('tab', { name: 'Simple' }).click()
    await expect(field(page, 'shownByRule')).toBeVisible()
    // Nuxt UI's theme reached the page through the hashed style.
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-primary-500'),
    )
    expect(primary.trim()).not.toBe('')
  })

  test('the same interactions edit every kind of field', async ({ page }) => {
    await allowHostStyles(page)
    await watch(page)
    await open(page, 'validation=NoValidation')
    const before = await formData(page)
    await pokeEveryField(page)
    const after = await formData(page)

    const changed = Object.keys(before).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    )
    for (const key of [
      'text',
      'multiline',
      'password',
      'pin',
      'color',
      'slider',
      'rating',
      'checkbox',
      'toggle',
      'radio',
      'multiEnum',
      'tags',
    ]) {
      expect(changed, `${key} should have changed`).toContain(key)
    }

    await editTargetedFields(page)
    const edited = await formData(page)
    expect(edited.enum).toBe('gamma')
    expect((edited.address as { street: string }).street).toBe('2 avenue')
    expect(edited.contacts).toHaveLength((after.contacts as unknown[]).length + 1)
  })

  test('the autocomplete queries its same-origin API under the policy', async ({ page }) => {
    await allowHostStyles(page)
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation')
    await field(page, 'city').fill('Ma')
    await page.getByRole('option', { name: 'Marseille' }).click()

    await expect.poll(async () => (await formData(page)).city).toBe('marseille')
    expect(await watcher.violations()).toEqual([])
    expect(watcher.external).toEqual([])
  })

  test('server errors show before any touch and clear when the host drops them', async ({
    page,
  }) => {
    await allowHostStyles(page)
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation&serverErrors')
    const message = page.locator('#form').getByText('Already used on the server')

    await expect(message).toBeVisible()
    await field(page, 'text').fill('a new value')
    await expect(message).toHaveCount(0)
    expect(await watcher.violations()).toEqual([])
  })

  // Counter-tests: the policy is enforced, and these Ajv paths stay outside the recipe.
  test('a rule with a schema condition needs unsafe-eval', async ({ page }) => {
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation&rule=schema')
    await expect
      .poll(async () => (await watcher.violations()).map((violation) => violation.blocked))
      .toContain('eval')
  })

  test('Ajv validation needs unsafe-eval', async ({ page }) => {
    const watcher = await watch(page)
    await page.goto('/?validation=ValidateAndShow')
    await expect
      .poll(async () => (await watcher.violations()).map((violation) => violation.blocked))
      .toContain('eval')
  })
})

test.describe('read-only recipe', () => {
  for (const source of ['form', 'config']) {
    test(`read-only by ${source}: every field locked, data unchanged`, async ({ page }) => {
      await allowHostStyles(page)
      const watcher = await watch(page)
      await open(page, `validation=NoValidation&readonly=${source}`)
      const before = await formData(page)

      for (const category of CATEGORIES) {
        await page.getByRole('tab', { name: category }).click()
        // Reka UI mirrors some fields in an `aria-hidden` native input for form submission.
        const inputs = page.locator(
          '#form input:not([type=hidden]):not([aria-hidden=true]), #form textarea',
        )
        for (const input of await inputs.all()) {
          if (!(await input.isVisible())) continue
          const locked = await input.evaluate(
            (element: HTMLInputElement) =>
              element.disabled ||
              element.readOnly ||
              element.getAttribute('aria-readonly') === 'true',
          )
          expect(locked, await input.evaluate((element) => element.outerHTML.slice(0, 200))).toBe(
            true,
          )
        }
        for (const add of await page
          .locator('#form')
          .getByRole('button', { name: /ajouter|add/i })
          .all()) {
          await expect(add).toBeDisabled()
        }
      }

      await pokeEveryField(page)
      await editTargetedFields(page)
      expect(await formData(page)).toEqual(before)
      expect(await watcher.violations()).toEqual([])
    })
  }
})

test('the ./core entry ships no Tiptap or ProseMirror code', () => {
  const assets = fileURLToPath(new URL('./.dist/assets/', import.meta.url))
  const bundle = readdirSync(assets)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(`${assets}${file}`, 'utf8'))
    .join('\n')
  expect(bundle).not.toMatch(/@tiptap\/|prosemirror/i)
})
