# Harmony — keys, tension, and bridging what does not match

## Keys and modes in electronic music

- **Minor keys dominate** (techno, trance, drum and bass); house and disco lean major. A set
  that stays minor for an hour is normal; a lift to the relative major is a colour change, not a
  key change. `advised`.
- **Modes as colour:** dorian (minor with a raised sixth) is the house and techno workhorse —
  warm without being sad; phrygian (flat second) is dark and tense; mixolydian (major with a
  flat seventh) is the funk and disco major. The score's `Mode` carries them; the generators
  build chords from the mode's scale. `enforced` (theory helpers over `tonal`).
- **Few chords, long time.** Two or four chords over 8 bars is the norm; a 12-chord progression is
  a song, not a track. `advised` (the generators' progression templates default to 2–4 chords).

## Tension and release

| Device | Effect | How in liminal | Status |
|---|---|---|---|
| **pedal point** | a held note (usually the tonic or the fifth) under moving chords: tension that wants to resolve | a `sub`/`pad` note held across a section while `chords` move | enforced (transform `pedal`) |
| **suspension** (sus2/sus4 → resolution) | a chord that leans and then settles | chord quality in the progression template | advised |
| **tritone / diminished passing chord** | the darkest step; one bar before a resolution | `transform: tension` inserts it before a section change | advised |
| **dominant preparation** | the V (or its substitute) before the I of the new section | the last bar of a build | advised |
| **chromatic mediant** (e.g. Am → C♯m) | a cinematic lift, distant but shiny | only through a break; the brain must name it | advised |
| **withholding the tonic** | a progression that never lands on the I until the drop | the build's progression avoids the tonic chord | advised |

## Modulation — moving key inside one track or between two

| Path | What it is | Distance it covers | Status |
|---|---|---|---|
| **relative** (Am ↔ C) | same notes, new centre | 0 steps | enforced |
| **fifth up or down** (Am → Em / Dm) | one shared-notes step; the classic | 1 step | enforced |
| **pivot chord** | a chord that belongs to both keys; play it, then continue in the new key (Am → C via F, which is IV of C and VI of Am) | 1–2 steps | advised |
| **common tone** | hold one note both keys share while everything else changes (A is in Am and in F♯m) | any distance with a shared tone | advised (pedal bridge) |
| **stepwise bass walk** | the bass walks by step from the old root to the new over 2–4 bars | 1–3 steps | advised |
| **direct modulation through silence or drums** | remove all tonal content, re-enter in the new key | any | enforced (drum bridge) |
| **semitone lift** | everything up a semitone at a drop | the classic final-chorus trick | advised, once per set |

## Bridging distant keys — the recipes

When two tracks are far apart on the wheel (three steps or more), do not mix them directly.
Choose, in this order:

1. **Route through the queue.** If there is time (dwell), travel one step per track. `enforced`
   (handover plan = shortest path).
2. **Pedal bridge on a shared tone.** Find a note in both keys (the wheel's neighbours share
   six of seven; three steps away still share three or four). Hold it in the pad or the sub under
   a drum bridge; the new key resolves onto it. `advised` — the theory helper `sharedTones(a, b)`
   lists them.
3. **Drum bridge.** No tonal content for 8–16 bars; re-enter clean. Always works; costs the
   harmony for a phrase. `enforced`.
4. **Motif bridge.** Transpose the current motif into the new key over 8 bars, stepwise. The
   idea survives; the key moves under it. `advised`.
5. **Break-to-drop in the new key**, with the build's last bars already using the new key's
   dominant. The drop makes the change feel intended. `advised`.

What never works: a bass swap between clashing keys; a lead over a chord from another key; two
tonal layers in different keys at once. `enforced` (transition preconditions; `validate` warns on
notes outside the section's key unless marked chromatic).

## Notes that "do not fit"

- **Blue notes and chromatic approach notes** belong to the lead, one at a time, resolving by
  step. `advised` (the melody generator's `approachNote`).
- **A rework's melody** carries its own notes; when it lands in a section whose key differs, the
  arrangement step transposes the melody (never the other way round) and simplifies chords that
  fight it (bet B05). `advised`.
