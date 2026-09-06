import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { _electron as electron } from '@playwright/test'

const WIDTHS = [1024, 1440, 1920]
const HEIGHT = 900

type Rect = { left: number; top: number; width: number; height: number }

type Measured = { selector: string; rect: Rect; styles: Record<string, string> }

type Measurements = {
  state: string
  width: number
  height: number
  title: string
  documentWidth: number
  documentHeight: number
  measured: Measured[]
}

const REPORTED_STYLES = [
  'background-color',
  'color',
  'font-family',
  'font-size',
  'min-height',
  'padding-left',
  'padding-right',
  'border-bottom-width',
  'border-bottom-color',
  'max-width',
  'transition-duration',
]

type Step = { click: string } | { wait: number }

function parseArguments(argv: readonly string[]): {
  state: string
  id: string
  selectors: string[]
  steps: Step[]
} {
  const state = argv[0]
  if (!state || state.startsWith('--')) {
    throw new Error(
      'usage: shot <state> [--id <card id>] [--measure <selector>]… [--click <selector>]… [--wait <ms>]…',
    )
  }
  const flag = argv.indexOf('--id')
  const id = flag === -1 ? currentBranchSlug() : argv[flag + 1]
  if (!id) throw new Error('--id needs a card id')
  const selectors: string[] = []
  const steps: Step[] = []
  argv.forEach((argument, index) => {
    const value = argv[index + 1]
    if (argument === '--measure') {
      if (!value) throw new Error('--measure needs a selector')
      selectors.push(value)
    }
    if (argument === '--click') {
      if (!value) throw new Error('--click needs a selector')
      steps.push({ click: value })
    }
    if (argument === '--wait') {
      if (!value) throw new Error('--wait needs a number of milliseconds')
      steps.push({ wait: Number(value) })
    }
  })
  return { state, id, selectors, steps }
}

function currentBranchSlug(): string {
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
  const card = /([A-Z]\d+-\d+)/.exec(branch)
  return card?.[1] ?? branch.replace(/[^a-zA-Z0-9-]/g, '-')
}

const { state, id, selectors, steps } = parseArguments(process.argv.slice(2))
const directory = resolve(process.cwd(), '..', '..', 'evidence', id)
mkdirSync(directory, { recursive: true })

const app = await electron.launch({ args: ['.'] })
const window = await app.firstWindow()
await window.waitForLoadState('domcontentloaded')

for (const step of steps) {
  if ('click' in step) await window.click(step.click)
  else await window.waitForTimeout(step.wait)
}

const measurements: Measurements[] = []
for (const width of WIDTHS) {
  await window.setViewportSize({ width, height: HEIGHT })
  const page = await window.evaluate(
    ({ wanted, reported }) => ({
      documentWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.clientHeight,
      measured: wanted.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element) => {
          const box = element.getBoundingClientRect()
          const computed = getComputedStyle(element)
          const styles: Record<string, string> = {}
          for (const property of reported) styles[property] = computed.getPropertyValue(property)
          return {
            selector,
            rect: { left: box.left, top: box.top, width: box.width, height: box.height },
            styles,
          }
        }),
      ),
    }),
    { wanted: selectors, reported: REPORTED_STYLES },
  )
  measurements.push({
    state,
    width,
    height: HEIGHT,
    title: await window.title(),
    ...page,
  })
  await window.screenshot({ path: join(directory, `${state}-${width}.png`) })
}

writeFileSync(join(directory, `${state}.json`), `${JSON.stringify(measurements, null, 2)}\n`)
await app.close()

process.stdout.write(`${directory}\n`)
