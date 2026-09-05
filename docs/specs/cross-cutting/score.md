# The score (`@liminal/score`)

> Everything that plays is a `Score`. This is the specification of the schema, the invariants
> and the basic operations. Implemented in M1-01; changes by docs PR, with an ADR when it closes
> a door.

---

## Principles

1. **Time in integer ticks.** `PPQ = 960` per quarter note. No floats in positions or durations.
2. **Deterministic.** `seed` in the document; own PRNG. Same document → same audio (per
   implementation, see ADR-0002).
3. **Diffable.** Serialization with sorted keys; stable ids; arrays in musical order.
4. **Closed under transformation.** Every transform is `(Score) → Score` and the result passes
   `validate`.
5. **What is not music stays out.** Set state, queues, motifs, transitions between tracks — that
   belongs to the conductor (M4). The document is one track, or a stretch of it.

---

## Schema (v1)

Types in TypeScript notation. The real source is Zod; the types are inferred from it.

```ts
const PPQ = 960

type Tick = number            // integer ≥ 0
type Bar  = number            // integer ≥ 0

type Score = {
  version: 1
  id: string                  // ulid
  seed: number                // uint32
  tempo: { bpm: number }      // 40..220
  meter: { beatsPerBar: number; beatUnit: 4 }   // beatsPerBar 2..12
  key: { tonic: Tonic; mode: Mode }
  sections: Section[]         // contiguous, ordered, starting at bar 0
  tracks: Track[]
  clips: Clip[]
  automation: Automation[]
  mix: Mix
  lineage?: { parentId?: string; styleCardId?: string; label?: string }
}

type Tonic = 'C'|'C#'|'D'|'D#'|'E'|'F'|'F#'|'G'|'G#'|'A'|'A#'|'B'
type Mode  = 'major'|'minor'|'dorian'|'phrygian'|'lydian'|'mixolydian'

type Section = {
  id: string
  role: 'intro'|'build'|'drop'|'break'|'bridge'|'outro'
  startBar: Bar
  bars: number                // ≥ 1
  energy: number              // 0..1 — the target, not the measurement
}

type Track = {
  id: string
  role: 'kick'|'snare'|'clap'|'hat'|'perc'|'sub'|'bass'|'chords'|'pad'|'lead'|'arp'|'fx'
  instrument: InstrumentRef
  gainDb: number              // -60..6
  pan: number                 // -1..1
  muted: boolean
  fx: FxRef[]                 // in order, source to output
}

type InstrumentRef =
  | { kind: 'synth'; preset: SynthPreset; params?: Record<string, number> }
  | { kind: 'sampler'; bank: string; params?: Record<string, number> }   // reserved; no implementation until after M5

type SynthPreset =
  'kick'|'hat'|'clap'|'bass-mono'|'sub-sine'|'poly-saw'|'pad-fm'|'lead-am'|'noise'

type FxRef = {
  kind: 'filter'|'eq3'|'compressor'|'distortion'|'delay'|'reverb'
  params: Record<string, number>
}

type Clip = {
  id: string
  trackId: string
  start: Tick                 // absolute in the score
  length: Tick                // ≥ 1
  notes: Note[]               // relative to the clip start
}

type Note = {
  at: Tick                    // 0 ≤ at < clip length
  duration: Tick              // ≥ 1; at + duration ≤ clip length
  pitch: number               // MIDI 0..127
  velocity: number            // 0..1
}

type Automation = {
  id: string
  target:
    | { trackId: string; param: 'gainDb'|'pan'|'filter.cutoff'|'filter.q'|'send.reverb'|'send.delay' }
    | { master: 'gainDb' }
  points: { at: Tick; value: number; curve: 'step'|'linear'|'exp' }[]   // at ascending
}

type Mix = { master: { gainDb: number; limiter: boolean } }
```

### Why like this

- **`Clip` with relative notes**: moving a clip is changing one number; the generator produces
  clips, not loose notes.
- **No `loop` on the clip**: the generator expands repetitions. A clip is literally what plays —
  the engine does not interpret.
- **`energy` on the section is a target**: the measurement comes from the soundcheck and lives
  outside the document.
- **`sampler` reserved in the discriminant**: when it arrives, no old document breaks.
- **`lineage` optional**: which document and which card this came from. Metadata only.

---

## Invariants (`validate(score) → { errors, warnings }`)

**Errors** (invalid document, the engine refuses):

| # | Rule |
|---|---|
| E1 | every `Tick`/`Bar` is an integer ≥ 0; `length` and `duration` ≥ 1 |
| E2 | sections contiguous from bar 0, no gap, no overlap, ordered by `startBar` |
| E3 | unique ids within `sections`, `tracks`, `clips`, `automation` |
| E4 | every `clip.trackId` and every `automation.target.trackId` exists in `tracks` |
| E5 | `clip.start + clip.length ≤ scoreLengthTicks(score)` |
| E6 | every note fits its clip: `0 ≤ at`, `at + duration ≤ clip.length` |
| E7 | clips on the same track do not overlap |
| E8 | `automation.points` with strictly ascending `at` |
| E9 | `bpm` 40..220; `pitch` 0..127; `velocity` 0..1; `gainDb` -60..6; `pan` -1..1; `energy` 0..1 |

**Warnings** (valid, but probably wrong):

| # | Rule |
|---|---|
| W1 | note outside the range of the track's role (table below) |
| W2 | track without a clip |
| W3 | section with no note sounding inside it |
| W4 | `automation` whose `param` the instrument does not expose |

Ranges per role (MIDI): `sub` 24–48 · `bass` 28–60 · `chords` 48–84 · `pad` 48–84 · `lead` 60–96 ·
`arp` 55–96 · percussion any (pitch selects a variation, not a height).

---

## Basic operations

| Function | Does |
|---|---|
| `validate(score)` | the invariants above |
| `barToTick(bar, meter)` / `tickToPosition(tick, meter) → { bar, beat, tick }` | exact, integer conversion |
| `scoreLengthBars(score)` / `scoreLengthTicks(score)` | sum of the sections |
| `sectionAt(score, tick)` | the section containing the tick |
| `createRng(seed)` | xorshift32: `next() → [0,1)`, `int(max)`, `pick(array)`; **never** `Math.random` |
| `stringify(score)` / `parse(json)` | JSON with sorted keys; `parse` validates |
| `newId(rng)` | deterministic ulid from the PRNG, for reproducible ids |

Seconds do **not** appear here. `ticksToSeconds` lives in the engine.

---

## Fixture: `sixteenBars`

Used by the engine, the app shell and the determinism tests.

- 128 BPM, 4/4, A minor, fixed `seed`
- one `drop` section, 16 bars, `energy 0.8`
- tracks: `kick` (four-on-the-floor), `hat` (eighths, accent on the off-beat), `bass`
  (`bass-mono`, octave 2, eighths on A–G–F–E per bar), `chords` (`poly-saw`, Am–G–F–E, one whole
  note per bar)
- a filter on the `chords` track with `cutoff` automation rising from bar 8 to 16

Passes `validate` with no warnings. It is the document M1 plays, renders and compares.

---

## Out of v1, and where it enters

| Thing | Where |
|---|---|
| tempo map (BPM changing within a track) | v2, when a transition needs it |
| `sampler` with banks | after M5 |
| pattern notation (Strudel, MIDI) | compiler into `Score`, M3 spike |
| structured diff and patch | when the editing UI needs it; until then the diff is git's |
