# Design principles — the visual and interaction language

> What "beautiful and good to use" means for liminal. Every design brief in this folder and every
> token in `packages/ui/src/tokens.css` derives from here. Changes by PR, with a reason.

## The feel

**A booth at night, not a spreadsheet.** Dark by default, quiet surfaces, one warm accent for what
is alive (the beat, the current section, the thing you can act on). Light theme available and
equally cared for. Nothing decorative: every element either informs or can be acted on.

**Dark always, until the person chooses otherwise.** The app opens dark whatever the machine
prefers, and switches only when someone asks for light. The system preference does not decide:
this is a booth, and a listener who has never opened the settings should not get a white screen
because their laptop is in day mode. The choice is carried by `data-theme` on the root and
remembered per machine once a theme setting exists (M5); until then the root is dark and there is
nothing to choose. (decided 2026-09-06, applied from M1-04)

**Calm in motion.** The set never stops; the UI breathes with it — a bar tick, a handover progress,
an energy curve advancing — but never jitters. Motion follows the music's clock, not the mouse.

**Honest.** The soundcheck numbers, the current target, the queue and its dwell times, the next
handover — visible, not hidden behind a "details" panel. Trust comes from seeing what the system is
doing.

## Hierarchy

1. The transport, the output (volume, mute, device) and what is playing now (section, key, tempo, bar).
2. The prompt box and the two feedback controls.
3. The queue of references with dwell times and the handover progress.
4. The timeline and the energy curve.
5. Everything else, on demand.

The first screen (F1) shows 1 and 2 with an example set ready to play. Nothing else until asked.

## Tokens — roles, not values

Colour by role: `surface`, `surface-2`, `ink`, `muted`, `line`, `accent` (the beat, the actionable),
`accent-ink`, `signal-ok`, `signal-warn`, `signal-error`. Both themes define every role, and the
dark one is what an app with no recorded choice shows. Contrast
≥ 4.5:1 for text, ≥ 3:1 for large text and UI edges — measured.

Six more roles came with the first components (M1-07), each because no role above does its job:

| Role | What it is for |
|---|---|
| `surface-3` | the fill a control takes under the pointer or while pressed, on a panel that is already `surface-2` |
| `line-strong` | the edge of a control, which needs 3:1; `line` is a separator and is not allowed as a control edge |
| `accent-hover`, `accent-active` | the accent's own two interaction steps, for a control filled with the accent |
| `signal-error-ink` | text on an error fill, where `accent-ink` fails |
| `focus` | the focus ring; today an alias of `accent`, so the ring can change without moving the accent |

The values, both themes, with every contrast pair computed, are in
[`M1-07.md › Tokens`](M1-07.md); the pairs are a unit test in `@liminal/ui`.

Space on a 4 px base: `space-1` … `space-8` (4, 8, 12, 16, 24, 32, 48, 64). Radius: `radius-1` 4,
`radius-2` 8, `radius-3` 12; pills only for chips and toggles.

Type: a display face with character for numbers that matter (bar, tempo, key) and headings; a
neutral body face; a monospace for values that align (tempo, time, measurements). Scale on a fixed
ratio; `tabular-nums` wherever digits change under your eyes.

Motion: `duration-1` 120 ms (hover, focus), `duration-2` 240 ms (state change), `duration-beat` =
one beat at the current tempo (anything synchronized to music). Easing `ease-out` for entering,
`ease-in-out` for moving. `prefers-reduced-motion` turns everything off except the bar tick, which
becomes a static indicator.

## Components

Everything reusable lives in the `@liminal/ui` package (under `packages/`): **Radix Primitives for behaviour and
accessibility, our tokens for looks, the audio controls ours** — with a story per state and a test
per behaviour rule. The catalogue and the rules are in [components.md](components.md). A screen
composes; it never restyles a component locally.

## Controls we will keep needing (design once, reuse)

| Control | Job | Rules |
|---|---|---|
| **Transport** | play / pause / stop, always one click or one key away | large target, state visible without colour alone; stop is deliberate, pause is the quick one |
| **Volume** | master output gain, mute, the device in use | a slider with the value in dB, a mute toggle, the device name; starts at the safe level; keyboard `↑`/`↓`/`M` |
| **Filter sweep** | one knob, low-pass ← flat → high-pass | centre detent; returns to flat on double-tap; immediate |
| **Layer strip** | kick · hats · perc · bass · chords · pad · lead on/off, and later a trim each | seven equal toggles with the layer name and a level meter; number keys |
| **Layer map** | every layer that plays, expanded: instrument and preset, pattern grid, register, effects, section role, a prompt box scoped to it, regenerate and lock | one row per layer, collapsed to the strip by default and expanded on demand; the row a person is editing is the only one open; changes say when they land; a collision is shown before it lands |
| **Energy dial** | the target energy for the next phrases | 0–1, shows the current measured energy under the target; lands at the next phrase and says so |
| **Next / Hold** | move on now, or stay one more phrase | two buttons beside the readout, with the bars until they act |
| **Readout** | tempo, key, bar:beat, section | monospace, `tabular-nums`, no layout shift as digits change |
| **Prompt box** | type a live prompt | shows when it will land ("next phrase, in N bars"); enter to send; history recall |
| **Feedback pair** | more of this / less of this | two adjacent buttons, keyboard shortcuts, momentary confirmation |
| **Queue entry** | a reference with its dwell time | title, state (analyzing / ready / failed), dwell time as a single-gesture control (drag or ±), remove, drag handle; the current target highlighted; the next with the handover countdown |
| **Timeline** | where we are and where we are going, the way a DJ reads a deck | two views: an **overview** (sections, energy curve, handover gradients, playhead) and a **detail** with the **waveform and the beat/bar grid** of what plays and what is already rendered ahead, coloured by band, phrase markers, section lines, cue and loop marks; the unrendered future as an outline. The playhead is fixed and the waveform moves, on the beat. No scrubbing into the past; the future can be inspected. Designed only after the R26 brief on DJ app timelines (Rekordbox, Serato, Traktor, djay, Mixxx) says what people read at a glance and what we adapt because our future is a plan, not a file |
| **Soundcheck card** | target vs measured | small bars per band; within tolerance in `signal-ok`, outside in `signal-warn` |
| **Error strip** | what went wrong and what to do | the user's words, one action, dismissible |
| **Cue** | pre-listen to the next segment on the cue device | a headphone toggle; disabled with a reason when no cue device is set |
| **Record / Keep** | record the set; keep the last N minutes; save the set | a record toggle with elapsed and size; "keep that" always one click while playing |
| **Settings** | devices, safe volume, dwell default, brain, cache, theme, motion, shortcuts | one panel, grouped as in `docs/product/controls.md › Settings`; nothing hidden elsewhere |

The complete inventory, with the milestone each control lands in, is
[`docs/product/controls.md`](../product/controls.md).

## What we do not do

- No skeuomorphic knobs or wood panels. No neon for its own sake.
- No modal that blocks the transport. Stop is always reachable.
- No information only by colour. No text under 13 px.
- No animation that is not tied to a state or to the music.
