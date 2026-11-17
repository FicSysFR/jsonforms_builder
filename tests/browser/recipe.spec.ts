import { expect, type Page, test } from '@playwright/test'

type Violation = { directive: string; blocked: string; sample: string; source: string }

type RecipeWindow = Window & {
  __recipe?: { ready: boolean; data: unknown; changes: number }
  __violations?: Violation[]
}

/**
 * Records CSP violations (from an init script, which the page CSP does not govern), requests
 * leaving the page origin and uncaught errors.
 */
const watch = async (page: Page) => {
  const external: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') external.push(url.href)
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
 * Host-level inline style, not the library's: Nuxt UI's colors plugin writes its theme variables
 * in a `<style>` element. A host allows it by hash or nonce (Nuxt renders it server-side).
 */
const isNuxtUiColorsStyle = (violation: Violation) =>
  violation.directive === 'style-src-elem' && violation.sample.startsWith('@layer theme')

const libraryViolations = async (watcher: Awaited<ReturnType<typeof watch>>) =>
  (await watcher.violations()).filter((violation) => !isNuxtUiColorsStyle(violation))

const open = async (page: Page, query: string) => {
  await page.goto(`/?${query}`)
  await page.waitForFunction(() => (window as RecipeWindow).__recipe?.ready === true)
  await expect(page.locator('#form [role=tab]').first()).toBeVisible()
}

const formData = (page: Page) =>
  page.evaluate(() => JSON.stringify((window as RecipeWindow).__recipe?.data))

const CATEGORIES = ['Simple', 'Dates', 'Structures']

/** Tries to edit every field of every category: typing, toggling, choosing, sliding, adding. */
const pokeEveryField = async (page: Page) => {
  const form = page.locator('#form')
  const attempt = async (action: () => Promise<unknown>) => {
    await action().catch(() => undefined)
    await page.keyboard.press('Escape').catch(() => undefined)
  }

  for (const category of CATEGORIES) {
    await page.getByRole('tab', { name: category }).click()
    await page.waitForTimeout(100)

    for (const field of await form.locator('input:not([type=hidden]), textarea').all()) {
      if (!(await field.isVisible())) continue
      await attempt(async () => {
        await field.click({ force: true, timeout: 1000 })
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
    for (const add of await form.getByRole('button', { name: /ajouter|add/i }).all()) {
      if (!(await add.isVisible())) continue
      await attempt(() => add.click({ force: true, timeout: 1000 }))
    }
  }
}

test.describe('strict CSP recipe (no unsafe-inline, no unsafe-eval)', () => {
  test('strictCspRenderers render and edit without a violation', async ({ page }) => {
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation')
    await pokeEveryField(page)

    expect(await libraryViolations(watcher)).toEqual([])
    expect(watcher.external, 'icons and assets must not leave the origin').toEqual([])
    expect(watcher.errors).toEqual([])
    await expect(page.locator('#form svg').first()).toBeVisible()
  })

  // These two prove the policy is enforced, and document what strictCspRenderers leave out.
  test('combinator renderers need unsafe-eval, even without validation', async ({ page }) => {
    const watcher = await watch(page)
    await open(page, 'validation=NoValidation&registry=full')
    await page.getByRole('tab', { name: 'Structures' }).click()
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
      const watcher = await watch(page)
      await open(page, `validation=NoValidation&readonly=${source}`)
      const before = await formData(page)

      for (const category of CATEGORIES) {
        await page.getByRole('tab', { name: category }).click()
        // Reka UI mirrors some fields in an `aria-hidden` native input for form submission.
        const fields = page.locator(
          '#form input:not([type=hidden]):not([aria-hidden=true]), #form textarea',
        )
        for (const field of await fields.all()) {
          if (!(await field.isVisible())) continue
          const locked = await field.evaluate(
            (element: HTMLInputElement) =>
              element.disabled ||
              element.readOnly ||
              element.getAttribute('aria-readonly') === 'true',
          )
          expect(locked, await field.evaluate((element) => element.outerHTML.slice(0, 200))).toBe(
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
      expect(await formData(page)).toBe(before)
      expect(await libraryViolations(watcher)).toEqual([])
    })
  }

  test('the same interactions do edit an editable form', async ({ page }) => {
    await watch(page)
    await open(page, 'validation=NoValidation')
    const before = await formData(page)
    await pokeEveryField(page)
    expect(await formData(page)).not.toBe(before)
  })
})
