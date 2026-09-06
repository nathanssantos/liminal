import { Readout, Transport } from '@liminal/ui'

const NOTHING_TO_PLAY = 'There is nothing to play yet.'

export function App() {
  return (
    <main className="shell">
      <header className="shell-deck">
        <Transport
          state="stopped"
          canPlay={false}
          disabledReason={NOTHING_TO_PLAY}
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
        <Readout size="md" />
      </header>
      <div className="shell-stage" />
    </main>
  )
}
