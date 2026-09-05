import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { _electron as electron } from '@playwright/test'

const WIDTHS = [1024, 1440, 1920]
const HEIGHT = 900

type Measurements = {
  state: string
  width: number
  height: number
  title: string
  documentWidth: number
  documentHeight: number
}

function parseArguments(argv: readonly string[]): { state: string; id: string } {
  const state = argv[0]
  if (!state || state.startsWith('--')) {
    throw new Error('usage: shot <state> [--id <card id>]')
  }
  const flag = argv.indexOf('--id')
  const id = flag === -1 ? currentBranchSlug() : argv[flag + 1]
  if (!id) throw new Error('--id needs a card id')
  return { state, id }
}

function currentBranchSlug(): string {
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
  const card = /([A-Z]\d+-\d+)/.exec(branch)
  return card?.[1] ?? branch.replace(/[^a-zA-Z0-9-]/g, '-')
}

const { state, id } = parseArguments(process.argv.slice(2))
const directory = resolve(process.cwd(), '..', '..', 'evidence', id)
mkdirSync(directory, { recursive: true })

const app = await electron.launch({ args: ['.'] })
const window = await app.firstWindow()
await window.waitForLoadState('domcontentloaded')

const measurements: Measurements[] = []
for (const width of WIDTHS) {
  await window.setViewportSize({ width, height: HEIGHT })
  const page = await window.evaluate(() => ({
    documentWidth: document.documentElement.clientWidth,
    documentHeight: document.documentElement.clientHeight,
  }))
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
