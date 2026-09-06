import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type ElectronApplication, _electron as electron, expect, test } from '@playwright/test'

const ownProfile = () => mkdtempSync(join(tmpdir(), 'liminal-e2e-'))

const launch = (profile: string): Promise<ElectronApplication> =>
  electron.launch({ args: ['.', `--user-data-dir=${profile}`] })

type Window = Awaited<ReturnType<ElectronApplication['firstWindow']>>

const readout = (page: Window, field: string) =>
  page.locator(`.lm-readout-value[data-field="${field}"]`).textContent()

const recordEverySinkAsked = async (page: Window): Promise<void> => {
  await page.addInitScript(() => {
    const asked: string[] = []
    ;(window as unknown as { __sinks: string[] }).__sinks = asked
    const audio = AudioContext.prototype as unknown as {
      setSinkId: (id: unknown) => Promise<void>
    }
    const original = audio.setSinkId
    audio.setSinkId = function record(this: AudioContext, id: unknown) {
      asked.push(typeof id === 'string' ? id : String((id as { deviceId?: string })?.deviceId))
      return original.call(this, id)
    }
  })
  await page.reload()
}

const sinksAsked = (page: Window) =>
  page.evaluate(() => (window as unknown as { __sinks: string[] }).__sinks)

const outputLabels = (page: Window) =>
  page.evaluate(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((one) => one.kind === 'audiooutput').map((one) => one.label)
  })

test('the app opens with the set loaded and the numbers on screen', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-readout')

  await expect.poll(() => readout(page, 'tempo')).toBe('128')
  await expect.poll(() => readout(page, 'key')).toBe('A min')
  await expect(page.getByRole('heading', { name: 'Example set' })).toBeVisible()
  await expect(page.locator('.lm-slider-value')).toHaveText('−12 dB')
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})

test('play advances the position and stop returns it to the top', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-transport')

  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => page.locator('.lm-transport-word').textContent()).toBe('Playing')
  await expect.poll(() => readout(page, 'bar'), { timeout: 8000 }).not.toBe('1:1')
  await expect.poll(() => readout(page, 'elapsed'), { timeout: 8000 }).not.toBe('0:00')

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect.poll(() => page.locator('.lm-transport-word').textContent()).toBe('Stopped')
  await expect.poll(() => readout(page, 'bar')).toBe('1:1')
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})

test('the keyboard alone plays, changes the volume and the mute', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-slider-value')

  await page.keyboard.press('Digit5')
  await expect(page.locator('.lm-slider-value')).toHaveText('−30 dB')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.lm-slider-value')).toHaveText('−29 dB')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.lm-slider-value')).toHaveText('−30 dB')
  await page.keyboard.press('KeyM')
  await expect(page.getByRole('button', { name: 'Mute muted' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.locator('body').press('Space')
  await expect.poll(() => page.locator('.lm-transport-word').textContent()).toBe('Playing')
  await page.locator('body').press('Space')
  await expect.poll(() => page.locator('.lm-transport-word').textContent()).toBe('Stopped')
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})

test('the volume a person set is what the app comes back to', async () => {
  const profile = ownProfile()
  const first = await launch(profile)
  const one = await first.firstWindow()
  await one.waitForSelector('.lm-slider-value')
  await expect(one.locator('.lm-slider-value')).toHaveText('−12 dB')
  await one.keyboard.press('Digit5')
  await expect(one.locator('.lm-slider-value')).toHaveText('−30 dB')
  await first.close()

  const second = await launch(profile)
  const two = await second.firstWindow()
  await two.waitForSelector('.lm-slider-value')
  await expect(two.locator('.lm-slider-value')).toHaveText('−30 dB')
  await second.close()
  rmSync(profile, { recursive: true, force: true })
})

test('choosing another output moves the sound and the set keeps playing', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await recordEverySinkAsked(page)
  await page.waitForSelector('.lm-select-trigger')

  const outputs = await outputLabels(page)
  test.skip(
    outputs.length < 2,
    'this machine offers a single output, so there is nothing to switch to',
  )

  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => page.locator('.lm-transport-word').textContent()).toBe('Playing')

  const other = outputs.find((label) => !label.startsWith('Default')) ?? outputs[1] ?? ''
  await page.locator('.lm-select-trigger').click()
  await page.getByRole('option', { name: other }).click()

  await expect(page.locator('.lm-select-trigger')).toContainText(other)
  await expect(page.locator('.lm-transport-word')).toHaveText('Playing')
  await expect(page.locator('.lm-error-strip')).toHaveCount(0)

  const chosen = await page.evaluate(async (label) => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.find((one) => one.kind === 'audiooutput' && one.label === label)?.deviceId ?? ''
  }, other)
  await expect.poll(() => sinksAsked(page)).toContain(chosen)
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})

test('the output a person chose is the one the sound comes back to', async () => {
  const profile = ownProfile()
  const first = await launch(profile)
  const one = await first.firstWindow()
  await one.waitForSelector('.lm-select-trigger')

  const outputs = await outputLabels(one)
  test.skip(
    outputs.length < 2,
    'this machine offers a single output, so there is nothing to switch to',
  )
  const other = outputs.find((label) => !label.startsWith('Default')) ?? outputs[1] ?? ''
  await one.locator('.lm-select-trigger').click()
  await one.getByRole('option', { name: other }).click()
  await expect(one.locator('.lm-select-trigger')).toContainText(other)
  await first.close()

  const second = await launch(profile)
  const two = await second.firstWindow()
  await recordEverySinkAsked(two)
  await two.waitForSelector('.lm-select-trigger')
  await expect(two.locator('.lm-select-trigger')).toContainText(other)

  const chosen = await two.evaluate(async (label) => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.find((one) => one.kind === 'audiooutput' && one.label === label)?.deviceId ?? ''
  }, other)
  await two.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => two.locator('.lm-transport-word').textContent()).toBe('Playing')
  await expect.poll(() => sinksAsked(two)).toContain(chosen)
  await second.close()
  rmSync(profile, { recursive: true, force: true })
})

test('the window refuses to navigate away from itself', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await page.waitForSelector('.shell')

  const before = page.url()
  await page.evaluate(() => {
    window.location.href = 'file:///etc/hosts'
  })
  await page.waitForTimeout(600)
  expect(page.url()).toBe(before)

  const opened = await app.evaluate(async ({ BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows().length
    await BrowserWindow.getAllWindows()[0]?.webContents.executeJavaScript(
      "window.open('about:blank'), 1",
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    return BrowserWindow.getAllWindows().length - windows
  })
  expect(opened).toBe(0)
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})

test('the document the app ships carries the policy that was written for it', async () => {
  const profile = ownProfile()
  const app = await launch(profile)
  const page = await app.firstWindow()
  await page.waitForSelector('.shell')

  const policy = await page.evaluate(
    () =>
      document
        .querySelector('meta[http-equiv="Content-Security-Policy"]')
        ?.getAttribute('content') ?? '',
  )
  expect(policy).toContain("default-src 'none'")
  expect(policy).toContain("script-src 'self'")
  expect(policy).toContain("connect-src 'self'")
  expect(policy).not.toContain('%CONTENT_SECURITY_POLICY%')
  expect(policy).not.toContain('localhost')
  expect(policy).not.toMatch(/https?:/)
  await app.close()
  rmSync(profile, { recursive: true, force: true })
})
