import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const HOOKS = join(process.cwd(), '.git', 'hooks')
const SHIM = '#!/bin/sh\nexec "$(git rev-parse --show-toplevel)/tools/commit-msg.sh" "$@"\n'

try {
  mkdirSync(HOOKS, { recursive: true })
  const hook = join(HOOKS, 'commit-msg')
  writeFileSync(hook, SHIM)
  chmodSync(hook, 0o755)
} catch (error) {
  process.stdout.write(`could not install the commit-msg hook: ${error.message}\n`)
}
