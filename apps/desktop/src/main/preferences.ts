import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUTPUT_GAIN_DB, SAFE_OUTPUT_GAIN_DB } from '@liminal/protocol'
import { z } from 'zod'

export const PREFERENCES_FILE = 'output.json'

const preferencesSchema = z.strictObject({
  gainDb: z.number().min(OUTPUT_GAIN_DB.min).max(OUTPUT_GAIN_DB.max),
  muted: z.boolean(),
  deviceId: z.string().max(256),
})

export type OutputPreferences = z.infer<typeof preferencesSchema>

export const FIRST_RUN: OutputPreferences = {
  gainDb: SAFE_OUTPUT_GAIN_DB,
  muted: false,
  deviceId: 'default',
}

export function restore(stored: unknown): OutputPreferences {
  const seen = preferencesSchema.safeParse(stored)
  if (!seen.success) {
    return FIRST_RUN
  }
  return { ...seen.data, gainDb: Math.min(seen.data.gainDb, OUTPUT_GAIN_DB.max) }
}

export function readPreferences(directory: string): OutputPreferences {
  try {
    return restore(JSON.parse(readFileSync(join(directory, PREFERENCES_FILE), 'utf8')))
  } catch {
    return FIRST_RUN
  }
}

export function writePreferences(directory: string, given: OutputPreferences): OutputPreferences {
  const kept = restore(given)
  writeFileSync(join(directory, PREFERENCES_FILE), `${JSON.stringify(kept, null, 2)}\n`, 'utf8')
  return kept
}
