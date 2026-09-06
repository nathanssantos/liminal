import { rmSync } from 'node:fs'
import { type ElectronApplication, _electron as electron, expect, test } from '@playwright/test'

const PROFILE = '/tmp/liminal-e2e'

const launch = (): Promise<ElectronApplication> =>
  electron.launch({ args: ['.', `--user-data-dir=${PROFILE}`] })

const readout = (page: Awaited<ReturnType<ElectronApplication['firstWindow']>>, field: string) =>
  page.locator(`.lm-readout-value[data-field="${field}"]`).textContent()

test('the app opens with the set loaded and the numbers on screen', async () => {
  rmSync(PROFILE, { recursive: true, force: true })
  const app = await launch()
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-readout')

  await expect.poll(() => readout(page, 'tempo')).toBe('128')
  await expect.poll(() => readout(page, 'key')).toBe('A min')
  await expect(page.getByRole('heading', { name: 'Example set' })).toBeVisible()
  await expect(page.locator('.lm-slider-value')).toHaveText('−12 dB')
  await app.close()
})

test('play advances the position and stop returns it to the top', async () => {
  const app = await launch()
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
})

test('the keyboard alone changes the volume and the mute', async () => {
  const app = await launch()
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-slider-value')

  await page.keyboard.press('Digit5')
  await expect(page.locator('.lm-slider-value')).toHaveText('−30 dB')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.lm-slider-value')).toHaveText('−29 dB')
  await page.keyboard.press('KeyM')
  await expect(page.getByRole('button', { name: 'Mute muted' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await app.close()
})

test('the volume a person set is what the app comes back to', async () => {
  rmSync(PROFILE, { recursive: true, force: true })
  const first = await launch()
  const one = await first.firstWindow()
  await one.waitForSelector('.lm-slider-value')
  await expect(one.locator('.lm-slider-value')).toHaveText('−12 dB')
  await one.keyboard.press('Digit5')
  await expect(one.locator('.lm-slider-value')).toHaveText('−30 dB')
  await first.close()

  const second = await launch()
  const two = await second.firstWindow()
  await two.waitForSelector('.lm-slider-value')
  await expect(two.locator('.lm-slider-value')).toHaveText('−30 dB')
  await second.close()
})

test('choosing another output moves the sound and the set keeps playing', async () => {
  const app = await launch()
  const page = await app.firstWindow()
  await page.waitForSelector('.lm-select-trigger')

  const outputs = await page.evaluate(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((one) => one.kind === 'audiooutput').map((one) => one.label)
  })
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
  await app.close()
})

test('the window refuses to navigate away from itself', async () => {
  const app = await launch()
  const page = await app.firstWindow()
  await page.waitForSelector('.shell')

  const before = page.url()
  await page.evaluate(() => {
    window.location.href = 'https://example.invalid'
  })
  await page.waitForTimeout(600)
  expect(page.url()).toBe(before)
  await app.close()
})
