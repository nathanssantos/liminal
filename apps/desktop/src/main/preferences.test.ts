import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { OUTPUT_GAIN_DB, SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import { describe, expect, it } from 'vitest'
import {
  FIRST_RUN,
  PREFERENCES_FILE,
  readPreferences,
  restore,
  writePreferences,
} from './preferences.ts'

const aDirectory = () => mkdtempSync(join(tmpdir(), 'liminal-prefs-'))

describe('the output preferences', () => {
  it('starts the first run at the safe level', () => {
    expect(readPreferences(aDirectory()).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
    expect(FIRST_RUN.gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
    expect(FIRST_RUN.muted).toBe(false)
  })

  it('restores the level the last run left', () => {
    const directory = aDirectory()
    writePreferences(directory, { gainDb: -30, muted: false, deviceId: 'default' })

    expect(readPreferences(directory).gainDb).toBe(-30)
  })

  it('falls back to the safe level rather than to full when the file is unreadable', () => {
    const directory = aDirectory()
    writeFileSync(join(directory, PREFERENCES_FILE), 'not json', 'utf8')

    expect(readPreferences(directory).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
  })

  it('falls back to the safe level when a field is missing or of the wrong type', () => {
    expect(restore({ gainDb: -30 }).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
    expect(restore({ gainDb: '-30', muted: false, deviceId: 'default' }).gainDb).toBe(
      SAFE_OUTPUT_GAIN_DB,
    )
    expect(restore(null).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
  })

  it('never restores a level louder than the range allows', () => {
    expect(restore({ gainDb: 12, muted: false, deviceId: 'default' }).gainDb).toBe(
      SAFE_OUTPUT_GAIN_DB,
    )
    expect(restore({ gainDb: OUTPUT_GAIN_DB.max, muted: false, deviceId: 'default' }).gainDb).toBe(
      OUTPUT_GAIN_DB.max,
    )
  })

  it('keeps the mute and the device across runs', () => {
    const directory = aDirectory()
    writePreferences(directory, { gainDb: -24, muted: true, deviceId: 'headphones' })

    const seen = readPreferences(directory)

    expect(seen.muted).toBe(true)
    expect(seen.deviceId).toBe('headphones')
  })

  it('refuses to write a level it would not restore', () => {
    const directory = aDirectory()

    const written = writePreferences(directory, {
      gainDb: 99 as number,
      muted: false,
      deviceId: 'default',
    })

    expect(written.gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
    expect(readPreferences(directory).gainDb).toBe(SAFE_OUTPUT_GAIN_DB)
  })
})
