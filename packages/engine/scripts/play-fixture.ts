import 'node-web-audio-api/polyfill.js'
import { sixteenBars } from '@liminal/score/fixtures'
import { createEngine } from '../src/index.ts'
import { scoreSeconds } from '../src/time.ts'

const context = new AudioContext({ sampleRate: 48000 })
const engine = await createEngine({ context, score: sixteenBars })

engine.on('bar', (event) => {
  process.stdout.write(`\rbar ${String((event?.bar ?? 0) + 1).padStart(2, ' ')} of 16`)
})

engine.on('ended', async () => {
  process.stdout.write('\ndone\n')
  engine.dispose()
  await context.close()
})

process.stdout.write(
  `playing the sixteenBars fixture: ${sixteenBars.tempo.bpm} BPM, ${scoreSeconds(sixteenBars).toFixed(1)} s\n`,
)
engine.play()
