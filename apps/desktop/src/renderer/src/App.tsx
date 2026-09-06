import { Readout, Transport } from '@liminal/ui'

export function App() {
  return (
    <main className="shell">
      <header className="shell-deck">
        <Transport state="stopped" onPlay={() => {}} onPause={() => {}} onStop={() => {}} />
        <Readout size="md" />
      </header>
      <div className="shell-stage" />
    </main>
  )
}
