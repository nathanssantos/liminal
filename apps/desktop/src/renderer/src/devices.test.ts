import { describe, expect, it } from 'vitest'
import { outputsFrom, stillThere } from './devices.ts'
import { SYSTEM_DEFAULT } from './store.ts'

function device(id: string, label: string, kind: MediaDeviceKind): MediaDeviceInfo {
  return { deviceId: id, label, kind, groupId: '' } as MediaDeviceInfo
}

describe('the output devices a screen can offer', () => {
  it('keeps only the outputs, dropping microphones and cameras', () => {
    expect(
      outputsFrom([
        device('mic', 'Built-in microphone', 'audioinput'),
        device('cam', 'FaceTime HD', 'videoinput'),
        device('speakers', 'Built-in speakers', 'audiooutput'),
      ]),
    ).toEqual([{ id: 'speakers', label: 'Built-in speakers' }])
  })

  it('puts the system default first when the runtime offers one', () => {
    const listed = outputsFrom([
      device('hdmi', 'LG ULTRAWIDE', 'audiooutput'),
      device(SYSTEM_DEFAULT.id, 'Default - Built-in', 'audiooutput'),
    ])
    expect(listed[0]).toEqual(SYSTEM_DEFAULT)
    expect(listed).toHaveLength(2)
  })

  it('offers nothing when the runtime has no output at all', () => {
    expect(outputsFrom([device('mic', 'Built-in microphone', 'audioinput')])).toEqual([])
  })

  it('falls back to the id when the runtime gives no label', () => {
    expect(outputsFrom([device('raw-id', '', 'audiooutput')])).toEqual([
      { id: 'raw-id', label: 'raw-id' },
    ])
  })

  it('knows when the device in use has gone', () => {
    const listed = [SYSTEM_DEFAULT, { id: 'hdmi', label: 'LG ULTRAWIDE' }]
    expect(stillThere(listed, 'hdmi')).toBe(true)
    expect(stillThere(listed, 'scarlett')).toBe(false)
  })
})
