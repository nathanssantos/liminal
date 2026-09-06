# The style card (`@liminal/analysis`)

> What is extracted from a reference track, how, with what confidence, and how it is compared
> with what the engine generated. The card is the set's **numeric target**. Implemented in M2.

---

## Principles

1. **Measurement, not impression.** Every field states the method and carries confidence.
2. **One schema source.** Zod in `@liminal/analysis`; the exported JSON Schema validates the
   Python output in tests.
3. **Comparable.** The reference's card and a render's measurement share the same fields where
   it makes sense, so comparison is field by field.
4. **None of the original audio leaves.** The card holds numbers; the downloaded file stays in a
   local cache and never enters the document or the set.

---

## Schema (v1)

```ts
type StyleCard = {
  version: 1
  id: string
  source:
    | { kind: 'youtube'; url: string; videoId: string; title?: string; durationSec: number }
    | { kind: 'file'; path: string; durationSec: number }      // M6
  analyzedAt: string                                            // ISO
  analyzer: { version: string; librosa: string }

  tempo: {
    bpm: number
    confidence: number            // 0..1
    stability: number             // 0..1 — 1 = constant beat interval
    halfDoubleAmbiguous: boolean  // true when bpm/2 or bpm×2 scores nearly the same
  }
  key: {
    tonic: Tonic; mode: 'major'|'minor'
    confidence: number
    camelot: string               // e.g. '8A'
    alternatives: { tonic: Tonic; mode: 'major'|'minor'; score: number }[]   // top 3
  }
  energy: {
    curve: number[]               // normalized RMS 0..1, one sample every `windowBars`
    windowBars: 4
  }
  sections: {
    startSec: number; endSec: number
    startBar: number; bars: number
    level: 'low'|'mid'|'high'     // energy tercile
  }[]
  spectrum: {
    bands: Record<Band, number>   // energy relative to total, in dB
  }
  loudness: {
    integratedLufs: number
    range: number                 // LRA
    crestFactorDb: number
    peakDbfs: number
  }
  rhythm: {
    onsetsPerBar: number
    swing: number                 // 0.5 = straight · 0.67 = triplet; ratio between eighths
    kickPeriodicity: number       // 0..1 — how four-on-the-floor
  }
  timbre: {
    centroidHz: number
    rolloffHz: number
    flatness: number
    mfccMean: number[]            // 13
  }
}

type Band = 'sub'|'bass'|'lowMid'|'mid'|'highMid'|'presence'|'air'
// sub 20–60 · bass 60–120 · lowMid 120–500 · mid 500–2k · highMid 2k–6k · presence 6k–12k · air 12k–20k

type Measurement = Pick<StyleCard, 'spectrum'|'loudness'|'rhythm'|'timbre'> & {
  energy: number                  // normalized RMS of the whole stretch
  durationSec: number
}
```

---

## How each field is measured

| Field | Method (librosa unless noted) | Confidence from | Known limit |
|---|---|---|---|
| `tempo.bpm` | `beat.beat_track` over the onset envelope, with `tempo` pre-estimated by `feature.tempo` | peak height in the tempogram vs second peak | half/double: report `halfDoubleAmbiguous` and let the conductor choose by genre |
| `tempo.stability` | 1 − coefficient of variation of inter-beat intervals | — | rubato scores low; that is information, not error |
| `key` | mean CQT chroma × Krumhansl–Schmuckler profiles, 24 correlations | gap between 1st and 2nd correlation | modal (dorian etc.) collapses into major/minor; chords are out of v1 |
| `energy.curve` | RMS per 4-bar window, aligned to the beat grid, normalized by the max | — | needs the right BPM; with half/double the window is wrong |
| `sections` | self-similarity matrix (`segment.recurrence_matrix`) + `segment.agglomerative`, minimum 8 bars | — | boundary ±1 bar; the label is only an energy tercile |
| `spectrum.bands` | STFT → energy per band / total, in dB | — | — |
| `loudness` | `ffmpeg ebur128` (LUFS, LRA); crest and peak via numpy | — | — |
| `rhythm.onsetsPerBar` | `onset.onset_detect` / bars | — | — |
| `rhythm.swing` | mean deviation of onsets on weak-eighth positions, as a fraction of the quarter, converted to a ratio | onset density on those positions | a stretch without weak eighths → `swing = 0.5` and low confidence |
| `rhythm.kickPeriodicity` | autocorrelation of the onset envelope in the `sub+bass` band, at the quarter-note period | — | — |
| `timbre` | `spectral_centroid`, `spectral_rolloff`, `spectral_flatness`, `mfcc` (13) — means | — | — |

Every row of this table becomes a test with a known-truth fixture (below).

---

## Known truth: our own engine is the fixture

The best ground truth is a document **we** render: BPM, key and swing are known by construction.
M2 generates, through the M1 engine, a set of documents, and the analyzer must recover:

| Fixture | Tests | Tolerance |
|---|---|---|
| `sixteenBars` at 128 BPM, A minor | BPM, key, high `kickPeriodicity` | BPM ±1; key exact |
| the same at 90 and 174 BPM | half/double | BPM ±2 **or** `halfDoubleAmbiguous = true` with the right one in `alternatives` |
| C major, F# minor, E♭ major | key | exact or relative, and the right one in the top 3 |
| swing 0.5 / 0.58 / 0.67 on the hi-hat | `swing` | ±0.04 |
| pad only, no percussion | low `stability` and confidence, no exception | does not throw |
| silence | explicit `silent-input` error | — |

With real tracks, the gate is the plan's: 9 of 10 with BPM ±2 and key exact or relative. The
track list and expected values live in `tools/analyzer/tests/fixtures/real.json`, without audio.

---

## The content card — a sketch, for bet B05

The style card says how a track **sounds**; a rework (bet B05) needs what it **says**. A second
card, produced by the same worker, is sketched here so the schema can grow without breaking:

```ts
type ContentCard = {
  version: 1
  id: string
  source: StyleCard['source'] | { kind: 'midi'; path: string } | { kind: 'score'; scoreId: string }
  tempo: StyleCard['tempo']; key: StyleCard['key']
  structure: { startBar: number; bars: number; role?: 'verse'|'chorus'|'bridge'|'intro'|'outro'; label: string }[]
  melody: { at: Tick; duration: Tick; pitch: number; confidence: number; voice: 'lead'|'vocal'|'other' }[]
  harmony: { bar: number; chord: string; root: number; quality: 'maj'|'min'|'dom7'|'min7'|'dim'|'sus'|'other'; confidence: number }[]
  transcription: { method: string; stemSeparated: boolean; noteAccuracy?: number }
}
```

Everything here is **assumed** until the B05 spikes measure it: which transcription works on real
recordings, how confident chord recognition is per bar, whether stems are mandatory. From MIDI or a
score the card is exact; from audio it carries confidence per note, and the arrangement step uses
it (a low-confidence note is a candidate to drop or simplify).

## The current target and the queue

The set holds a **current target card** and an ordered **queue** of upcoming references (plan
requirement 6), each entry `{ source, card | pending | failed, dwellMinutes }`. A queued reference is analyzed in the background; its card enters the queue when
ready, or a `reference.failed` event replaces it with an error the UI shows. During a handover the
target the soundcheck compares against is an **intermediate card**: every comparable field
interpolated between A and B by phrase index (BPM stepped inside the budget, key moved along the
Camelot path, bands and density linear). Cards are immutable; intermediate cards are derived and
never stored as sources.

## Comparing card × measurement

`distance(target: StyleCard, measured: Measurement, weights) → { total, byField }`.

Comparable fields: `spectrum.bands` (dB to dB), `loudness.crestFactorDb`, `rhythm.onsetsPerBar`,
`rhythm.swing`, `timbre.centroidHz` (in octaves), `energy` (against the section's target, not the
whole curve). Weights belong to the conductor and change by genre; v1 uses equal weights.

Default "matched" tolerance: bands within ±3 dB, centroid within ±0.5 octave, onsets within ±25%.
These numbers **are assumptions** until M3 measures.

---

## Source: YouTube

- `yt-dlp` with `bgutil-ytdlp-pot-provider`, audio-only format, converted to 44.1 kHz mono wav by
  `ffmpeg` for analysis; the original stays in the cache (`~/Library/Caches/liminal/sources/`).
- Cache key is the `videoId`; a second analysis of the same video does not download again.
- A download failure is an explicit error with `yt-dlp`'s reason, never an empty card.
- The source is an interface (`Source`); `file` (M6) implements the same one.
