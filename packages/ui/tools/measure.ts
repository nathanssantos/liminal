import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { EVIDENCE_DIRECTORY, serveStorybook, storyEntries } from './serve.ts'

const WIDTHS = [1024, 1440, 1920]
const HEIGHT = 900

const { origin, close } = await serveStorybook()
const stories = await storyEntries()

function idOf(title: string, name: string): string {
  const entry = stories.find((candidate) => candidate.title === title && candidate.name === name)
  if (!entry) throw new Error(`no story named ${title}/${name}`)
  return entry.id
}

async function open(page: Page, id: string, theme = 'dark'): Promise<void> {
  await page.goto(`${origin}/iframe.html?id=${id}&globals=theme:${theme}&viewMode=story`)
  await page.waitForSelector('#storybook-root > *')
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: HEIGHT } })

const measured: Record<string, unknown> = {}

const buttonHeights: Record<string, number> = {}
for (const [size, name] of [
  ['sm', 'Size Small'],
  ['md', 'Size Medium'],
  ['lg', 'Size Large'],
] as const) {
  await open(page, idOf('Controls/Button', name))
  buttonHeights[size] = await page
    .locator('.lm-button')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
}
measured.buttonHeights = buttonHeights

await open(page, idOf('Controls/Slider', 'Volume'))
measured.sliderThumbHit = await page.locator('[role="slider"]').evaluate((node) => {
  const before = getComputedStyle(node, '::before')
  return { width: before.width, height: before.height }
})

await open(page, idOf('Controls/Transport', 'Playing'))
measured.transport = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.lm-button')]
  return buttons.map((node) => {
    const box = node.getBoundingClientRect()
    return {
      name: node.textContent || node.getAttribute('aria-label'),
      width: box.width,
      height: box.height,
    }
  })
})

await open(page, idOf('Controls/Button', 'Primary'))
measured.focusRing = await page.evaluate(() => {
  const button = document.querySelector('.lm-button') as HTMLElement
  button.focus()
  const computed = getComputedStyle(button)
  return {
    outlineWidth: computed.outlineWidth,
    outlineStyle: computed.outlineStyle,
    outlineColor: computed.outlineColor,
    outlineOffset: computed.outlineOffset,
    transitionDuration: computed.transitionDuration,
  }
})

await open(page, idOf('Controls/Select', 'Many Items'))
measured.selectPanel = await page.evaluate(async () => {
  const trigger = document.querySelector('.lm-select-trigger') as HTMLElement
  trigger.click()
  await new Promise((done) => setTimeout(done, 200))
  const panel = document.querySelector('.lm-select-content') as HTMLElement
  const box = panel.getBoundingClientRect()
  return {
    height: box.height,
    maxHeight: getComputedStyle(panel).maxHeight,
    withinViewport: box.bottom <= window.innerHeight && box.top >= 0,
  }
})

const readoutSteps: unknown[] = []
for (const name of ['Playing Short Values', 'Playing', 'Playing Long Values']) {
  await open(page, idOf('Controls/Readout', name))
  readoutSteps.push(
    await page.evaluate(() => {
      const group = document.querySelector('.lm-readout') as HTMLElement
      const fields = [...document.querySelectorAll('.lm-readout-field')]
      return {
        reads: (group.textContent ?? '').replace(/\s+/g, ' ').trim(),
        groupHeight: group.getBoundingClientRect().height,
        fields: fields.map((node) => {
          const box = node.getBoundingClientRect()
          return {
            field: node.getAttribute('data-field'),
            left: box.left,
            width: box.width,
            height: box.height,
          }
        }),
      }
    }),
  )
}
measured.readoutDigitGrowth = readoutSteps

await open(page, idOf('Controls/Transport', 'Reduced Motion'))
measured.motion = await page.evaluate(() => {
  const shape = document.querySelector('.lm-transport-shape') as HTMLElement
  const button = document.querySelector('.lm-button') as HTMLElement
  return {
    beatAnimation: getComputedStyle(shape).animationName,
    transitionDuration: getComputedStyle(button).transitionDuration,
  }
})

await page.emulateMedia({ reducedMotion: 'reduce' })
await open(page, idOf('Controls/Transport', 'Reduced Motion'))
measured.motionReduced = await page.evaluate(() => {
  const shape = document.querySelector('.lm-transport-shape') as HTMLElement
  const button = document.querySelector('.lm-button') as HTMLElement
  return {
    beatAnimation: getComputedStyle(shape).animationName,
    transitionDuration: getComputedStyle(button).transitionDuration,
  }
})
await page.emulateMedia({ reducedMotion: 'no-preference' })

const smallestText: Record<number, number> = {}
for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: HEIGHT })
  const sizes: number[] = []
  for (const entry of stories.filter((one) => one.tags.includes('evidence'))) {
    await open(page, entry.id)
    sizes.push(
      await page.evaluate(() =>
        Math.min(
          ...[...document.querySelectorAll('#storybook-root *')]
            .filter((node) => (node.textContent ?? '').trim().length > 0)
            .map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
        ),
      ),
    )
  }
  smallestText[width] = Math.min(...sizes)
}
measured.smallestTextPx = smallestText

await browser.close()
close()

mkdirSync(EVIDENCE_DIRECTORY, { recursive: true })
const report = `${JSON.stringify(measured, null, 2)}\n`
await writeFile(join(EVIDENCE_DIRECTORY, 'storybook.json'), report)
process.stdout.write(report)
