import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const version = process.argv[2]
if (!version) throw new Error('usage: changelog-section <version>')

const changelog = readFileSync('CHANGELOG.md', 'utf8')
const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*$`, 'm')
const start = changelog.search(heading)
if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version}`)

const rest = changelog.slice(start)
const nextHeading = rest.slice(1).search(/^## \[/m)
const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading + 1)

writeFileSync('notes.md', `${section.trim()}\n`)
process.stdout.write(`${section.trim()}\n`)
