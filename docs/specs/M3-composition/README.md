# M3 · Composition

> Generators and transforms from the style card, each with a measurable claim — and the first
> Production door: a complete track from a card, edited by a prompt, exported as wav. The craft
> that makes it sound like a producer did it is [`docs/craft/`](../../craft/README.md): the
> `enforced` entries become the generators' templates and the transforms' rules, with tests.

**Milestone gate:** "more bass" is a diff and energy below 120 Hz rises in the measurement; a
generated section lands within ±10% of the reference's bands; a complete track (≥ 4 sections) is
generated from a card, edited by one prompt, and exported as a wav `ffprobe` reads; every
`enforced` craft entry that belongs to composition has its test.

⚠️ **Vision and card list only.** The cards are written in M3's spec iteration, after M2 has
measured what M3 consumes and the R02/R08/R14/R25 briefs have refined the craft book.

## Planned cards, in order

| Id | Title | Craft it implements |
|---|---|---|
| M3-01 | Theory helpers over `tonal`: scales per mode, chord building, Camelot, `sharedTones`, `nextKey` | harmony.md › keys and modes; mixing.md › harmonic mixing |
| M3-02 | Section templates: intro/build/drop/break/bridge/outro — lengths, which layers may sound, downbeat events | arrangement.md › sections; how a break and a build are built |
| M3-03 | Drum generators: kick, hats, clap/snare, perc — from the card's rhythm fields; the kick/bass contract | sound.md › kick and bass; mixing.md › phrase structure |
| M3-04 | Bass and sub generators: root-following, ducking on the kick, one sub | sound.md › frequency roles |
| M3-05 | Chords and pad generators: 2–4-chord progressions per mode, voicing rules, high-passed | harmony.md › few chords; sound.md › low-mid |
| M3-06 | Lead, arp and motif generators; motif bank; contour-preserving transforms | harmony.md › notes that do not fit; arrangement.md › motif bridge |
| M3-07 | Transforms with claims: `darken`, `addSub`, `thin`, `swing`, `tension`, `pedal`, `transpose` — each renders, measures, asserts | craft entries marked `enforced` with a transform |
| M3-08 | Build and break events: riser, roll, filter open, the gap | arrangement.md › how a break is built |
| M3-09 | A complete track from a card: arc → sections → generators → `Score`; export wav; the headless door | arrangement.md › energy arcs |
| M3-10 | Spike: `@strudel/core` as notation for the brain's patterns (ADR-0003) | — |

## Decisions of this milestone

- Every `enforced` craft entry cites its test; an entry without a test stays `advised`.
- Generators are pure functions of (card, section role, energy, seed).
- The craft book changes in the same PR as the code that implements or contradicts it (§16).
