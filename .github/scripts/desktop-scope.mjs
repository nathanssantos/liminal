import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import process from 'node:process'

const WATCHED = ['apps/desktop/', 'packages/engine/', 'packages/protocol/', '.github/workflows/']

function changedFiles() {
  const base = process.env.GITHUB_BASE_REF
  const range = base
    ? `origin/${base}...HEAD`
    : `${process.env.GITHUB_EVENT_BEFORE || 'HEAD^'}..HEAD`
  try {
    return execFileSync('git', ['diff', '--name-only', range], { encoding: 'utf8' }).split('\n')
  } catch {
    return ['apps/desktop/']
  }
}

const touched = changedFiles().some((file) => WATCHED.some((prefix) => file.startsWith(prefix)))
appendFileSync(process.env.GITHUB_OUTPUT, `touched=${touched}\n`)
process.stdout.write(`desktop scope touched: ${touched}\n`)
