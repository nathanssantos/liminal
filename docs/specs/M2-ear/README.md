# M2 · Ear

> The analyzer: a YouTube link becomes a style card; a rendered wav becomes a measurement. The
> whole spec is in [style-card.md](../cross-cutting/style-card.md).

**Milestone gate:** BPM (±2) and key (exact or relative) right on 9 of 10 real tracks; a
document rendered by our engine has BPM and key recovered by the analyzer; the UI shows the card
for a pasted link.

⚠️ **This milestone has only the vision and the card list.** Each card's `.md` is written in the
M2 **spec iteration** (process §9), after M1 has measured what M2 will consume — render time,
wav format, Chromium × Node difference. Writing them now would be guessing.

## What already exists

Nothing. M0-03 leaves the worker answering `ping`. M1-03 leaves the wav.

## Planned cards, in order

| Id | Title | Depends on | Listening |
|---|---|---|---|
| M2-01 | YouTube source: download with cache and explicit errors | M0-03 | no |
| M2-02 | Card schema in Zod and exported JSON Schema | M1-01 | no |
| M2-03 | Tempo, key and energy | M2-01, M2-02 | no |
| M2-04 | Spectrum, loudness, rhythm and timbre | M2-03 | no |
| M2-05 | Sections by self-similarity | M2-03 | no |
| M2-06 | `measure` in the long-lived worker, with a measured budget | M1-03, M2-04 | no |
| M2-07 | Known-truth fixtures rendered by the engine | M1-05, M2-04 | no |
| M2-08 | Real tracks: the list of 10 and the gate of 9 | M2-05 | **yes** (the human confirms the key by ear when confidence is low) |
| M2-09 | UI: paste a link, see the card | M1-04, M2-05 | no |
| M2-10 | Worker supervision in `main`: restart and visible error | M2-06 | no |

## Decisions of this milestone

- Field order follows expected confidence: tempo and key first, because everything depends on
  the beat grid.
- Real tracks do not enter the repo; `videoId`s and expected values do.
- Every tolerance the spec marks as an assumption becomes a measured number here.
