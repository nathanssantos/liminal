import 'node-web-audio-api/polyfill.js'
import { sixteenBars } from '@liminal/score/fixtures'
import { createEngine, scoreReleaseTailSeconds } from '../src/index.ts'
import { scoreSeconds } from '../src/time.ts'

const context = new AudioContext({ sampleRate: 48000 })
const engine = await createEngine({ context, score: sixteenBars })

engine.on('bar', (event) => {
  process.stdout.write(`\rbar ${String(event.bar + 1).padStart(2, ' ')} of 16`)
})

const finished = new Promise<void>((resolve) => {
  engine.on('ended', () => {
    resolve()
  })
})

process.stdout.write(
  `playing the sixteenBars fixture: ${sixteenBars.tempo.bpm} BPM, ${scoreSeconds(sixteenBars).toFixed(1)} s\n`,
)
engine.play()
await finished
await new Promise((resolve) => setTimeout(resolve, scoreReleaseTailSeconds(sixteenBars) * 1000))
process.stdout.write('\ndone\n')
engine.dispose()
await context.close()
