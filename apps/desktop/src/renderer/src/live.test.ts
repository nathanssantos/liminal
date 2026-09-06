import { createEngine } from '@liminal/engine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bridge } from '../../preload/bridge.ts'
import { codeOf, connect } from './live.ts'
import { CHANNEL_REFUSED, DEVICE_LOST, LOAD_GAVE_UP, SINK_UNAVAILABLE } from './notices.ts'
import { STILL_LOADING_MS, SYSTEM_DEFAULT, useShell } from './store.ts'

vi.mock('@liminal/engine', () => ({ createEngine: vi.fn() }))

type FakeEngine = {
  play: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  dispose: ReturnType<typeof vi.fn>
  setSinkId: ReturnType<typeof vi.fn>
  setOutputGain: ReturnType<typeof vi.fn>
  setMuted: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  position: ReturnType<typeof vi.fn>
}

function fakeEngine(): FakeEngine {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    setSinkId: vi.fn(async () => undefined),
    setOutputGain: vi.fn(),
    setMuted: vi.fn(),
    on: vi.fn(() => () => {}),
    position: vi.fn(() => ({ bar: 1, beat: 1, tick: 0 })),
  }
}

const built = vi.mocked(createEngine) as unknown as ReturnType<typeof vi.fn>

const aScore = { bpm: 128, key: { tonic: 'A', mode: 'minor' }, bars: 16, tracks: [] }

function fakeBridge(): Bridge {
  return {
    onOutput: vi.fn(() => () => {}),
    onScore: vi.fn(() => () => {}),
    play: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    reportPosition: vi.fn(async () => undefined),
    reportError: vi.fn(async () => undefined),
    setVolume: vi.fn(async () => undefined),
    setMuted: vi.fn(async () => undefined),
    chooseDevice: vi.fn(async () => undefined),
  } as unknown as Bridge
}

function fakeMedia(devices: MediaDeviceInfo[]): MediaDevices {
  return {
    enumerateDevices: vi.fn(async () => devices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaDevices
}

function output(id: string, label: string): MediaDeviceInfo {
  return { deviceId: id, label, kind: 'audiooutput', groupId: '' } as MediaDeviceInfo
}

const NO_ANIMATION = () => 0

beforeEach(() => {
  useShell.setState({
    devices: [SYSTEM_DEFAULT],
    deviceId: SYSTEM_DEFAULT.id,
    devicesPending: false,
    notice: undefined,
    muted: false,
    score: undefined,
    loadTimedOut: false,
    transport: 'stopped',
  })
  vi.stubGlobal('requestAnimationFrame', NO_ANIMATION)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal(
    'AudioContext',
    class {
      close = () => Promise.resolve()
    },
  )
  built.mockReset()
  built.mockResolvedValue(fakeEngine())
})

describe('the live connection', () => {
  it('offers the devices the runtime reports, with no permission asked', async () => {
    const media = fakeMedia([output('default', 'System default'), output('hdmi', 'LG ULTRAWIDE')])
    const live = connect(fakeBridge(), media)
    await vi.waitFor(() => expect(useShell.getState().devices).toHaveLength(2))
    expect(useShell.getState().devices[1]).toEqual({ id: 'hdmi', label: 'LG ULTRAWIDE' })
    expect(useShell.getState().devicesPending).toBe(false)
    live.stop()
  })

  it('falls back to the system default and says so when the chosen device goes', async () => {
    useShell.setState({ deviceId: 'hdmi' })
    const media = fakeMedia([output('default', 'System default')])
    const live = connect(fakeBridge(), media)
    await vi.waitFor(() => expect(useShell.getState().notice).toBeDefined())
    expect(useShell.getState().deviceId).toBe(SYSTEM_DEFAULT.id)
    expect(useShell.getState().notice).toEqual(DEVICE_LOST)
    live.stop()
  })

  it('never asks the runtime for permission before listing outputs', async () => {
    const getUserMedia = vi.fn()
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const media = fakeMedia([output('default', 'System default')])
    const live = connect(fakeBridge(), media)
    await vi.waitFor(() => expect(useShell.getState().devices).toHaveLength(1))
    expect(getUserMedia).not.toHaveBeenCalled()
    live.stop()
  })

  it('tells main the volume only when the gesture ends', () => {
    const bridge = fakeBridge()
    const live = connect(bridge, fakeMedia([output('default', 'System default')]))
    useShell.getState().setGainDb(-20)
    expect(bridge.setVolume).not.toHaveBeenCalled()
    useShell.getState().commitGainDb(-20)
    expect(bridge.setVolume).toHaveBeenCalledWith({ gainDb: -20 })
    live.stop()
  })

  it('shows starting the moment play is pressed, before any sound', () => {
    const live = connect(fakeBridge(), fakeMedia([output('default', 'System default')]))
    useShell.getState().requestPlay()
    expect(useShell.getState().transport).toBe('starting')
    live.stop()
  })

  it('stops listening to the runtime when it is torn down', () => {
    const media = fakeMedia([output('default', 'System default')])
    const live = connect(fakeBridge(), media)
    live.stop()
    expect(media.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function))
  })
})

describe('reading a code off whatever was thrown', () => {
  it('takes the code when the error carries one', () => {
    expect(codeOf(Object.assign(new Error('no'), { code: 'sink-unavailable' }))).toBe(
      'sink-unavailable',
    )
  })

  it('says unknown for a plain error, a string and nothing at all', () => {
    expect(codeOf(new Error('no'))).toBe('unknown')
    expect(codeOf('no')).toBe('unknown')
    expect(codeOf(undefined)).toBe('unknown')
  })
})

describe('what the app remembers between runs', () => {
  it('takes the stored volume, mute and device the moment main sends them', async () => {
    const bridge = fakeBridge()
    let deliver: ((output: unknown) => void) | undefined
    Object.assign(bridge, {
      onOutput: vi.fn((listener: (output: unknown) => void) => {
        deliver = listener
        return () => {}
      }),
    })
    const live = connect(bridge, fakeMedia([output('default', 'System default')]))
    deliver?.({ gainDb: -30, muted: true, deviceId: 'hdmi' })
    expect(useShell.getState().gainDb).toBe(-30)
    expect(useShell.getState().muted).toBe(true)
    expect(useShell.getState().deviceId).toBe('hdmi')
    live.stop()
  })
})

describe('pressing play', () => {
  it('builds one engine when the key and the button arrive in the same instant', async () => {
    let release: ((engine: FakeEngine) => void) | undefined
    built.mockReturnValue(
      new Promise<FakeEngine>((resolve) => {
        release = resolve
      }),
    )
    const live = connect(fakeBridge(), fakeMedia([output('default', 'System default')]))
    useShell.setState({ score: aScore as never })

    useShell.getState().requestPlay()
    useShell.getState().requestPlay()
    release?.(fakeEngine())
    await vi.waitFor(() => expect(useShell.getState().transport).toBe('playing'))

    expect(built).toHaveBeenCalledTimes(1)
    live.stop()
  })

  it('never tells main the set is playing when the engine refuses to start', async () => {
    built.mockRejectedValue(Object.assign(new Error('no sink'), { code: 'sink-unavailable' }))
    const bridge = fakeBridge()
    const live = connect(bridge, fakeMedia([output('default', 'System default')]))
    useShell.setState({ score: aScore as never })

    useShell.getState().requestPlay()
    await vi.waitFor(() => expect(useShell.getState().transport).toBe('stopped'))

    expect(bridge.play).not.toHaveBeenCalled()
    expect(useShell.getState().notice).toEqual(SINK_UNAVAILABLE)
    expect(bridge.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'sink-unavailable' }),
    )
    live.stop()
  })
})

describe('a set that never arrives', () => {
  it('gives up and says so once the wait is over', () => {
    vi.useFakeTimers()
    const live = connect(fakeBridge(), fakeMedia([output('default', 'System default')]))
    vi.advanceTimersByTime(STILL_LOADING_MS)
    expect(useShell.getState().loadTimedOut).toBe(true)
    expect(useShell.getState().notice).toEqual(LOAD_GAVE_UP)
    live.stop()
    vi.useRealTimers()
  })

  it('says nothing when the set arrived before the wait was over', () => {
    vi.useFakeTimers()
    const live = connect(fakeBridge(), fakeMedia([output('default', 'System default')]))
    useShell.setState({ score: aScore as never })
    vi.advanceTimersByTime(STILL_LOADING_MS)
    expect(useShell.getState().loadTimedOut).toBe(false)
    expect(useShell.getState().notice).toBeUndefined()
    live.stop()
    vi.useRealTimers()
  })
})

describe('choosing an output', () => {
  it('keeps the output that still works when the new one refuses', async () => {
    const engine = fakeEngine()
    engine.setSinkId.mockRejectedValue(
      Object.assign(new Error('gone'), { code: 'sink-unavailable' }),
    )
    built.mockResolvedValue(engine)
    const bridge = fakeBridge()
    const live = connect(bridge, fakeMedia([output('default', 'System default')]))
    useShell.setState({ score: aScore as never })
    useShell.getState().requestPlay()
    await vi.waitFor(() => expect(useShell.getState().transport).toBe('playing'))

    useShell.getState().chooseDevice('hdmi')
    await vi.waitFor(() => expect(useShell.getState().devicesPending).toBe(false))

    expect(useShell.getState().deviceId).toBe(SYSTEM_DEFAULT.id)
    expect(useShell.getState().notice).toEqual(SINK_UNAVAILABLE)
    expect(bridge.chooseDevice).not.toHaveBeenCalled()
    live.stop()
  })

  it('says so when main refuses to remember the volume', async () => {
    const bridge = fakeBridge()
    Object.assign(bridge, { setVolume: vi.fn(async () => Promise.reject(new Error('refused'))) })
    const live = connect(bridge, fakeMedia([output('default', 'System default')]))
    useShell.getState().commitGainDb(-20)
    await vi.waitFor(() => expect(useShell.getState().notice).toEqual(CHANNEL_REFUSED))
    live.stop()
  })
})
