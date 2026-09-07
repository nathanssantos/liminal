import { ErrorStrip, Readout, Select, Slider, Toggle, Transport } from '@liminal/ui'
import { useEffect, useRef } from 'react'
import { actionFor, clampGain } from './shortcuts.ts'
import {
  beatOf,
  decibels,
  hintFor,
  MUTE_STATE_LABEL,
  OUTPUT_GAIN_MAX_DB,
  OUTPUT_GAIN_MIN_DB,
  playGuard,
  readoutOf,
  titleFor,
  useShell,
} from './store.ts'

export function App() {
  const shell = useShell()
  const play = useRef<HTMLButtonElement>(null)
  const device = useRef<HTMLButtonElement>(null)
  const playing = shell.transport === 'playing'
  const guard = playing ? undefined : playGuard(shell)
  const numbers = readoutOf(shell)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const action = actionFor(event.key, document.activeElement)
      if (!action) return
      const state = useShell.getState()
      if (action.kind === 'toggle-transport') {
        if (state.transport === 'playing') state.requestStop()
        else if (playGuard(state) === undefined) state.requestPlay()
      }
      if (action.kind === 'toggle-mute') state.toggleMuted(!state.muted)
      if (action.kind === 'nudge-volume') {
        const next = clampGain(state.gainDb + action.by)
        state.setGainDb(next)
        state.commitGainDb(next)
      }
      if (action.kind === 'set-volume') {
        state.setGainDb(action.gainDb)
        state.commitGainDb(action.gainDb)
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="shell">
      <section className="shell-deck" aria-label="Transport and the numbers">
        <div className="shell-column">
          <Transport
            size="lg"
            playRef={play}
            state={shell.transport === 'ended' ? 'stopped' : shell.transport}
            canPlay={guard === undefined}
            stopOnly
            {...(guard === undefined ? {} : { disabledReason: guard })}
            beatPulseKey={beatOf(shell)}
            onPlay={shell.requestPlay}
            onStop={shell.requestStop}
          />
          <Readout
            size="lg"
            tempo={numbers.tempo}
            musicalKey={numbers.musicalKey}
            bar={numbers.bar}
            beat={numbers.beat}
            elapsedMs={numbers.elapsedMs}
            playing={shell.transport === 'playing'}
          />
        </div>
      </section>

      <main className="shell-stage">
        <div className="shell-column">
          {shell.notice ? (
            <ErrorStrip
              title={shell.notice.title}
              {...(shell.notice.detail === undefined ? {} : { detail: shell.notice.detail })}
              tone={shell.notice.tone}
              {...(shell.notice.action === 'choose-device'
                ? { action: { label: 'Choose a device', onAction: () => device.current?.focus() } }
                : {})}
              dismissal={{ onDismiss: shell.dismiss, focusOnDismiss: play }}
            />
          ) : null}
          <div className="shell-centre">
            <h1 className="shell-title" {...(shell.score ? {} : { 'data-waiting': '' })}>
              {titleFor(shell)}
            </h1>
            <p className="shell-hint">{hintFor(shell)}</p>
          </div>
        </div>
      </main>

      <section className="shell-output" aria-label="Output">
        <div className="shell-column">
          <div className="shell-output-left">
            <div className="shell-volume">
              <Slider
                label="Volume"
                min={OUTPUT_GAIN_MIN_DB}
                max={OUTPUT_GAIN_MAX_DB}
                step={1}
                largeStep={6}
                ticks={[-12]}
                showValue="always"
                format={decibels}
                value={shell.gainDb}
                onValueChange={shell.setGainDb}
                onValueCommit={shell.commitGainDb}
              />
            </div>
            <Toggle
              label="Mute"
              tone="warn"
              stateLabel={MUTE_STATE_LABEL}
              pressed={shell.muted}
              onPressedChange={shell.toggleMuted}
            />
          </div>
          <div className="shell-device">
            <Select
              ref={device}
              label="Output"
              emptyLabel="No output device"
              loading={shell.devicesPending}
              value={shell.deviceId}
              items={shell.devices.map((one) => ({ value: one.id, label: one.label }))}
              onValueChange={shell.chooseDevice}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
