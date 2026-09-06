import { createEngine, type Engine } from '@liminal/engine'
import type { Score } from '@liminal/score'
import type { Bridge } from '../../preload/bridge.ts'
import { listOutputs, stillThere } from './devices.ts'
import {
  CHANNEL_REFUSED,
  DEVICE_LOST,
  LOAD_GAVE_UP,
  noticeForCode,
  SINK_UNAVAILABLE,
} from './notices.ts'
import { attach, type ShellState, STILL_LOADING_MS, SYSTEM_DEFAULT, useShell } from './store.ts'

type Shell = () => ShellState

export type Live = { stop: () => void }

export function codeOf(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code)
  }
  return 'unknown'
}

export function connect(
  bridge: Bridge,
  media: MediaDevices,
  shell: Shell = useShell.getState,
): Live {
  const undo: (() => void)[] = []
  let engine: Engine | undefined
  let building = false
  let frame = 0

  const raise = (notice: Parameters<ShellState['raise']>[0]) => shell().raise(notice)

  async function refreshDevices(): Promise<void> {
    shell().setDevicesPending(true)
    try {
      const devices = await listOutputs(media)
      shell().setDevices(devices)
      const chosen = shell().deviceId
      if (devices.length > 0 && !stillThere(devices, chosen)) {
        shell().setDeviceId(SYSTEM_DEFAULT.id)
        await engine?.setSinkId(SYSTEM_DEFAULT.id)
        raise(DEVICE_LOST)
      }
    } finally {
      shell().setDevicesPending(false)
    }
  }

  async function build(score: Score): Promise<Engine> {
    const built = await createEngine({ context: new AudioContext(), score })
    built.setOutputGain(shell().gainDb)
    built.setMuted(shell().muted)
    const chosen = shell().deviceId
    if (chosen !== SYSTEM_DEFAULT.id) {
      await built.setSinkId(chosen).catch(() => raise(SINK_UNAVAILABLE))
    }
    undo.push(built.on('bar', () => void bridge.reportPosition(built.position())))
    undo.push(
      built.on('ended', () => {
        shell().setTransport('ended')
        shell().setPosition(built.position())
      }),
    )
    undo.push(built.on('stopped', () => shell().setTransport('stopped')))
    return built
  }

  function follow(): void {
    const tick = () => {
      if (engine) shell().setPosition(engine.position())
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  undo.push(
    bridge.onOutput((output) => {
      shell().setGainDb(output.gainDb)
      shell().setMuted(output.muted)
      shell().setDeviceId(output.deviceId)
      engine?.setOutputGain(output.gainDb)
      engine?.setMuted(output.muted)
    }),
  )

  undo.push(
    bridge.onScore((score) => {
      shell().setScore(score)
    }),
  )

  const waited = setTimeout(() => {
    if (!shell().score) {
      shell().giveUpLoading()
      raise(LOAD_GAVE_UP)
    }
  }, STILL_LOADING_MS)

  const onDeviceChange = () => void refreshDevices()
  media.addEventListener('devicechange', onDeviceChange)
  undo.push(() => media.removeEventListener('devicechange', onDeviceChange))
  void refreshDevices()
  follow()

  const detach = attach({
    play: () => {
      if (building) return
      const score = shell().score
      if (!score) return
      building = true
      void (async () => {
        try {
          engine ??= await build(score)
          engine.play()
          shell().setTransport('playing')
          void bridge.play({})
        } catch (error) {
          shell().setTransport('stopped')
          raise(noticeForCode(codeOf(error)))
          void bridge.reportError({ code: codeOf(error), message: String(error) })
        } finally {
          building = false
        }
      })()
    },
    stop: () => {
      engine?.stop()
      shell().setTransport('stopped')
      void bridge.stop({})
    },
    commitGainDb: (gainDb) => {
      engine?.setOutputGain(gainDb)
      void bridge.setVolume({ gainDb }).catch(() => raise(CHANNEL_REFUSED))
    },
    setMuted: (muted) => {
      engine?.setMuted(muted)
      void bridge.setMuted({ muted }).catch(() => raise(CHANNEL_REFUSED))
    },
    chooseDevice: (deviceId) => {
      const previous = shell().deviceId
      shell().setDevicesPending(true)
      void (async () => {
        try {
          await engine?.setSinkId(deviceId)
          shell().setDeviceId(deviceId)
          void bridge.chooseDevice({ id: deviceId })
        } catch (error) {
          shell().setDeviceId(previous)
          raise(noticeForCode(codeOf(error)))
        } finally {
          shell().setDevicesPending(false)
        }
      })()
    },
  })

  return {
    stop: () => {
      cancelAnimationFrame(frame)
      clearTimeout(waited)
      detach()
      for (const off of undo.reverse()) off()
      engine?.dispose()
      engine = undefined
    },
  }
}
