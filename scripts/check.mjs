import { spawn } from 'node:child_process'
import process from 'node:process'

const TOOLS = [
  { name: 'biome', command: 'pnpm', args: ['exec', 'biome', 'check', '--error-on-warnings', '.'] },
  { name: 'tsc', command: 'pnpm', args: ['exec', 'tsc', '--noEmit', '-p', 'tsconfig.json'] },
  { name: 'tsc:packages', command: 'pnpm', args: ['exec', 'turbo', 'run', 'typecheck'] },
  { name: 'vitest', command: 'pnpm', args: ['exec', 'vitest', 'run'] },
  { name: 'ruff', command: 'uv', args: ['run', '--directory', 'tools', 'ruff', 'check', '.'] },
  { name: 'mypy', command: 'uv', args: ['run', '--directory', 'tools', 'mypy'] },
  { name: 'pytest', command: 'uv', args: ['run', '--directory', 'tools', 'pytest'] },
]

function run({ name, command, args }) {
  return new Promise((resolve) => {
    process.stdout.write(`\n── ${name} ── ${command} ${args.join(' ')}\n`)
    const child = spawn(command, args, { stdio: 'inherit', shell: false })
    child.on('error', (error) => {
      process.stdout.write(`${error.message}\n`)
      resolve({ name, code: 127 })
    })
    child.on('close', (code) => resolve({ name, code: code ?? 1 }))
  })
}

const results = []
for (const tool of TOOLS) {
  results.push(await run(tool))
}

process.stdout.write('\n── check summary ──\n')
for (const { name, code } of results) {
  process.stdout.write(
    `${code === 0 ? 'pass' : 'FAIL'}  ${name}${code === 0 ? '' : ` (exit ${code})`}\n`,
  )
}

const failed = results.filter((result) => result.code !== 0)
process.stdout.write(`${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length === 0 ? 0 : 1)
