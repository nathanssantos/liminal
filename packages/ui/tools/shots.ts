import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { EVIDENCE_DIRECTORY, serveStorybook, storyEntries } from './serve.ts'

const WIDTH = 1440
const HEIGHT = 900
const THEMES = ['dark', 'light']

const { origin, close } = await serveStorybook()
const stories = await storyEntries()

const chosen = new Map<string, string>()
for (const title of new Set(stories.map((entry) => entry.title))) {
  const forTitle = stories.filter((entry) => entry.title === title)
  const entry = forTitle.find((one) => one.tags.includes('evidence')) ?? forTitle[0]
  if (!entry) throw new Error(`${title} has no story`)
  chosen.set(title, entry.id)
}

mkdirSync(EVIDENCE_DIRECTORY, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } })

const taken: string[] = []
for (const [title, id] of chosen) {
  const component = title.split('/').at(-1) ?? title
  for (const theme of THEMES) {
    await page.goto(`${origin}/iframe.html?id=${id}&globals=theme:${theme}&viewMode=story`)
    await page.waitForSelector('#storybook-root > *')
    const name = `storybook-${component}-${theme}-${WIDTH}.png`
    await page.screenshot({ path: join(EVIDENCE_DIRECTORY, name) })
    taken.push(name)
  }
}

await browser.close()
close()
process.stdout.write(`${taken.join('\n')}\n`)
