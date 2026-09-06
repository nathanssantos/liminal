import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const STATIC_ROOT = resolve(import.meta.dirname, '..', 'storybook-static')

export const EVIDENCE_DIRECTORY = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'evidence',
  'M1-07',
)

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

export type StoryEntry = {
  id: string
  title: string
  name: string
  type: string
  tags: string[]
}

export async function serveStorybook(): Promise<{ origin: string; close: () => void }> {
  const server = createServer(async (request, response) => {
    const path = (request.url ?? '/').split('?')[0] ?? '/'
    const file = join(STATIC_ROOT, path === '/' ? 'index.html' : path)
    try {
      const body = await readFile(file)
      response.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('the server has no port')
  return { origin: `http://127.0.0.1:${address.port}`, close: () => server.close() }
}

export async function storyEntries(): Promise<StoryEntry[]> {
  const index = JSON.parse(await readFile(join(STATIC_ROOT, 'index.json'), 'utf8')) as {
    entries: Record<string, StoryEntry>
  }
  return Object.values(index.entries).filter((entry) => entry.type === 'story')
}
