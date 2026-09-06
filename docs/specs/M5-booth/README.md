# M5 · Booth

> The rich UI: everything in [controls.md](../../product/controls.md) that lands in M1–M5, on
> screen, designed before built ([design/principles.md](../../design/principles.md)), without a
> terminal.

**Milestone gate:** every row of `controls.md` marked M1–M5 is on screen and proven by a
screenshot with measurements; the usability walk from open to music is ≤ 3 actions; no blocking
usability finding; WCAG 2.2 AA measured.

⚠️ **Vision and card list only.** The cards are written in M5's spec iteration; each UI card
gets a design brief from the `ui-designer` first.

## Planned cards, in order

| Id | Title |
|---|---|
| M5-01 | Timeline: sections, energy curve, handovers, now cursor, committed vs planned |
| M5-02 | Reference card and the queue UI: drag, remove, dwell time, countdown, recent references |
| M5-03 | Prompt box with history and undo; standing prompt; feedback pair; energy dial; next / hold; "why?" |
| M5-04 | Layer strip with trims; loop this phrase; key lock |
| M5-04b | **Layer map**: instrument and preset, pattern grid, register, effects, section role, a prompt per layer, regenerate and lock — with collision warnings and versions (`controls.md › The layer map`) |
| M5-05 | Soundcheck card and status: brain, worker, analysis, rendering |
| M5-06 | Cue: pre-listen the next segment on the cue device |
| M5-07 | Record the set, keep the last N minutes, save the set |
| M5-08 | Production UI: brief + reference → track; section list; regenerate and lock; versions; export |
| M5-09 | Settings panel: devices, safe volume, dwell default, brain, cache, theme, motion, shortcuts |
| M5-10 | Set log viewer and the error strip for every failure mode |
| M5-11 | Packaging and signing; first-run experience with the example set |

## Decisions of this milestone

- No control lives only in a menu: what shapes the sound is one gesture away while playing.
- Production and Set share the transport, the output stage and the reference card; they differ in
  what the timeline shows (a track's sections vs the set's arc).
