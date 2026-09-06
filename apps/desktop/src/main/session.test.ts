import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import { describe, expect, it, vi } from 'vitest'
import { readPreferences } from './preferences.ts'
import type { SessionEvent } from './session.ts'
import { createSession, UnknownChannelError } from './session.ts'

const aSession = (devices?: { id: string; label: string }[]) => {
  const directory = mkdtempSync(join(tmpdir(), 'liminal-session-'))
  const seen: SessionEvent[] = []
  const session = createSession({
    directory,
    record: (event) => seen.push(event),
    ...(devices === undefined ? {} : { devices: () => devices }),
  })
  return { session, seen, directory }
}

describe('the main process answers the channels the renderer calls', () => {
  it('records the transport the renderer reports', async () => {
    const { session, seen } = aSession()

    await session.handle('transport:play', {})
    await session.handle('transport:stop', {})

    expect(seen).toEqual([
      { kind: 'transport', state: 'playing' },
      { kind: 'transport', state: 'stopped' },
    ])
  })

  it('records a position, and refuses one that is not whole', async () => {
    const { session, seen } = aSession()

    await session.handle('transport:position', { bar: 4, beat: 2, tick: 0 })

    expect(seen).toEqual([{ kind: 'position', bar: 4, beat: 2, tick: 0 }])
    await expect(
      session.handle('transport:position', { bar: 4.5, beat: 0, tick: 0 }),
    ).rejects.toThrow()
  })

  it('keeps the level on disk, so the next run finds it', async () => {
    const { session, directory } = aSession()

    await session.handle('output:volume', { gainDb: -30 })

    expect(session.preferences().gainDb).toBe(-30)
    expect(readPreferences(directory).gainDb).toBe(-30)
  })

  it('refuses a level outside the range rather than storing it', async () => {
    const { session, directory } = aSession()

    await expect(session.handle('output:volume', { gainDb: 12 })).rejects.toThrow()

    expect(readPreferences(directory).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
  })

  it('answers the device channel with the list and what is chosen', async () => {
    const { session } = aSession([
      { id: 'default', label: 'System' },
      { id: 'phones', label: 'Headphones' },
    ])

    const answer = await session.handle('output:device', { id: 'phones' })

    expect(answer).toEqual({
      devices: [
        { id: 'default', label: 'System' },
        { id: 'phones', label: 'Headphones' },
      ],
      selected: 'phones',
    })
  })

  it('keeps the device it had when the one asked for is gone', async () => {
    const { session } = aSession([{ id: 'default', label: 'System' }])

    const answer = await session.handle('output:device', { id: 'vanished' })

    expect(answer).toEqual({ devices: [{ id: 'default', label: 'System' }], selected: 'default' })
    expect(session.preferences().deviceId).toBe('default')
  })

  it('refuses a channel it does not know, rather than answering nothing', async () => {
    const { session } = aSession()

    await expect(session.handle('score:load', {})).rejects.toBeInstanceOf(UnknownChannelError)
  })

  it('records an engine error with its code', async () => {
    const record = vi.fn()
    const session = createSession({
      directory: mkdtempSync(join(tmpdir(), 'liminal-session-')),
      record,
    })

    await session.handle('engine:error', { code: 'invalid-score', message: 'the bpm is zero' })

    expect(record).toHaveBeenCalledWith({
      kind: 'engineError',
      code: 'invalid-score',
      message: 'the bpm is zero',
    })
  })
})
