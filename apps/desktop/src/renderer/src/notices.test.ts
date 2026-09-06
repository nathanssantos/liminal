import { describe, expect, it } from 'vitest'
import { noticeForCode, SINK_UNAVAILABLE } from './notices.ts'

describe('what a person is told when the engine refuses', () => {
  it('says the set could not be played, and that nothing changed', () => {
    const notice = noticeForCode('unknown-preset')
    expect(notice.title).toBe('This set could not be played.')
    expect(notice.detail).toBe('Nothing was changed.')
    expect(notice.tone).toBe('error')
  })

  it('separates a set that cannot play from an engine that cannot start', () => {
    expect(noticeForCode('invalid-audio').title).toBe('The audio engine could not start.')
    expect(noticeForCode('invalid-score').title).not.toBe('The audio engine could not start.')
  })

  it('treats a device it cannot use as a warning, not an error', () => {
    expect(noticeForCode('sink-unavailable')).toEqual(SINK_UNAVAILABLE)
    expect(SINK_UNAVAILABLE.tone).toBe('warn')
    expect(SINK_UNAVAILABLE.action).toBeUndefined()
  })

  it('still says something a person can read when the code is one it does not know', () => {
    const notice = noticeForCode('a-code-from-a-later-milestone')
    expect(notice.title).toMatch(/^[A-Z].*\.$/)
    expect(notice.title).not.toMatch(/a-code-from-a-later-milestone/)
  })

  it('never shows a raw code or a stack to the person', () => {
    for (const code of ['invalid-score', 'invalid-audio', 'sink-unavailable', 'nonsense']) {
      const notice = noticeForCode(code)
      expect(`${notice.title} ${notice.detail ?? ''}`).not.toMatch(/[a-z]+-[a-z]+-[a-z]+|Error|at /)
    }
  })
})
