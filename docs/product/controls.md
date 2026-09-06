# The control surface

> Everything a person can **do** and **see** in liminal, in one place. The UI controls
> everything; nothing requires a terminal (plan, "the gate that applies to all"). Each control
> says what it does, which flow it serves, where it acts, where it lands, and how it is remembered.
> A UI card cites the rows it delivers; the `usability-reviewer` checks the flows against this
> table; the `ui-designer` designs the controls the milestone brings.

## Two kinds of control

| Kind | Acts where | When it takes effect | Touches the document? |
|---|---|---|---|
| **Immediate** | the live engine's output stage, in the renderer | now, within one audio buffer | never — the document, the soundcheck and the export do not see it |
| **Planned** | the conductor, in main | at the next phrase boundary (≤ `PHRASE_BARS`), like a prompt | yes — it changes what gets proposed from here on |

A listener turning the volume down must not change what the soundcheck measures or what an
export contains. That is why immediate controls live **after** the point where audio is measured.

## Output — immediate

| Control | Does | Flow | Default and memory | Keyboard | Lands |
|---|---|---|---|---|---|
| **Master volume** | output gain after the master limiter | F1 | starts at a **safe level** (−12 dB) the first time; remembers the last value per machine; never starts louder than last time | `↑`/`↓`, `0`–`9` | M1-04 |
| **Mute** | silences the output without stopping the set | F1 | off | `M` | M1-04 |
| **Output device** | which audio device plays (speakers, interface, headphones); shows the current one | F0 | system default; remembered | — | M1-04 |
| **Master filter** | one knob: low-pass to the left, high-pass to the right, flat in the middle — the DJ sweep | F1½ | flat; not remembered | `[`/`]` | M4 |
| **Layer on/off** | kick · hats · percussion · bass · chords · pad · lead — each toggled, DJ-style | F1½ | all on; per set | `1`–`7` | M4 |
| **Layer level** | trim per layer, −∞..+6 dB (also in the layer map) | F1½ | 0 dB; per set | — | M5 |
| **Cue** | plays the **next** segment (already rendered by the soundcheck) on the cue device, so you hear where the set is going before it goes | F4 | off; cue device chosen in settings | `C` | M5 |

## Transport — immediate

| Control | Does | Flow | Keyboard | Lands |
|---|---|---|---|---|
| **Play / Stop** | starts the set; stop ends it (the set can be kept, see Keep) | F1 | `Space` | M1-04 |
| **Pause / Resume** | freezes in place, keeps the plan and the queue | F1 | `Space` while playing (Stop is a separate, deliberate control) | M4 |
| **Readout** | section · key · tempo · `bar:beat` · elapsed · next transition in N bars | F4 | — | M1-04 (readout), M4 (next transition) |

## Steering — planned (next phrase boundary)

| Control | Does | Flow | Lands |
|---|---|---|---|
| **Live prompt** | free text; shows "lands at the next phrase, in N bars"; history recall; **undo last prompt** reverts the plan it produced | F2 | M4 |
| **Standing prompt** | the brief that shapes everything; editable anytime | F2 | M4 |
| **More of this / less of this** | two buttons; feed the preference vector | F3 | M4 |
| **Energy** | a dial 0–1 that sets the target for the next phrases directly — the macro behind "bring it down" | F2 | M4 |
| **Next** | move to the next section now (at the boundary) | F2 | M4 |
| **Hold** | stay in this section for another phrase (repeatable) | F2 | M4 |
| **Loop this phrase** | repeat the current phrase N times, then continue | F2 | M5 |
| **Tempo target** | nudge the tempo (±, inside the per-track budget) | F2 | M4 |
| **Key lock** | stay in the current key until released | F2 | M5 |
| **Why?** | shows the brain's justification for the last plan and what the soundcheck measured | F4 | M4 (log), M5 (on screen) |

## The layer map — see everything that plays, change any of it

The layer map is the document's tracks on screen, live. One row per layer (kick · hats · perc ·
bass · chords · pad · lead · arp · fx, and whatever a rework adds), each showing what it is and
letting it be changed. Immediate aspects act now in the output stage; document aspects land at
the next phrase, like a prompt, and are written into the document (so the soundcheck, the export
and the versions see them).

| Aspect of a layer | Shows | Change | Kind | Lands |
|---|---|---|---|---|
| **On / off, level, meter** | playing or not; dB; the signal | toggle, trim | immediate | M4 (on/off), M5 (level) |
| **Instrument and preset** | `bass-mono`, `poly-saw`, … with its main parameters (cutoff, envelope) | pick another preset; nudge a parameter | planned (document) | M5 |
| **Pattern** | the rhythm as a step grid for the phrase; density; swing | denser / sparser; a step on or off; swing | planned | M5 |
| **Register and range** | octave; the notes actually used | up / down an octave; narrow / widen | planned | M5 |
| **Effects** | the chain: filter, EQ, delay, reverb | add / remove; a knob each | planned (document), filter sweep immediate | M5 |
| **Role in the arrangement** | which sections the layer plays in | mute in a section; enter later; leave earlier | planned | M5 |
| **Prompt to this layer** | — | free text scoped to the layer: "the lead becomes a pluck", "hats more shuffled", "bass follows the chords" | planned | M5 |
| **Regenerate / lock** | the seed | another variation of this layer only; lock it while others change | planned | M5 |
| **Solo** | hear this layer alone | toggle | immediate | M5 |

Rules: a change never breaks the guards — the theory rules keep the key, the soundcheck keeps the
balance, and a change that would collide (a lead moved into the bass register) says so before
landing. Every document change is a version (Keep › Versions). In the set, layer changes apply to
the current target's layers and persist across segments until changed again; in production,
they edit the track.

## Reference and queue — planned

| Control | Does | Flow | Lands |
|---|---|---|---|
| **Paste a link** | YouTube now, a file later; shows analysis progress; explicit error with **retry** | F1, F2b | M2 (analysis), M5 (UI) |
| **Queue** | the list; drag to reorder; remove; **dwell time** per entry, one gesture; the current target highlighted; the next with the handover countdown | F2b | M4 (behaviour), M5 (UI) |
| **Go to next reference now** | starts the handover at the next boundary | F2b | M4 |
| **Reference card** | BPM, key, bands, swing, sections of the current target; the intermediate target during a handover | F4 | M5 |
| **Recent references** | what was used before, one click to queue again | F2b | M5 |

## Seeing — display only

| Display | Shows | Flow | Lands |
|---|---|---|---|
| **Timeline** | like a DJ deck, in two views. **Overview**: the whole set so far and the committed future — sections as blocks, energy as a curve, handovers as gradients between the references' colours, the playhead. **Detail**: the **waveform with the beat and bar grid** — the rendered audio of what is playing and of what is already committed (the soundcheck renders it before it plays, so the waveform of the future exists), coloured by frequency band (low · mid · high), phrase markers every `PHRASE_BARS`, section boundaries, the next transition, cue points and loops when they exist; the planned-but-not-rendered area drawn as an outline. No scrubbing into the past (it is done) — but the future can be inspected. Designed against research R26 (DJ app timelines) | F4 | M5 |
| **Soundcheck card** | target vs measured per band; ok/warn per field | F4 | M5 |
| **Status** | playing · planning · analyzing · rendering · error; brain: idle / thinking / late / fallback; worker: up / restarting | F4, F5 | M4 (events), M5 (UI) |
| **Error strip** | what went wrong and the one action that fixes it | F5 | M1-04 |
| **Set log** | the raw events, for the curious | F4 | M5 |

## Keep — production and recording

| Control | Does | Flow | Lands |
|---|---|---|---|
| **Record the set** | writes what plays to a wav from the moment you press it; shows elapsed and size | F6 | M5 |
| **Keep that** | saves the last N minutes (what you just heard) as audio and as documents | F6 | M5 |
| **Save the set** | the set log plus its documents — replayable, since everything is deterministic | F6 | M5 |
| **Produce a track** | brief + reference → a complete track document | F7 | M3 (headless), M5 (UI) |
| **Section list** | reorder, change lengths and roles | F7 | M5 |
| **Regenerate / another variation** | new seed for a section; **lock** a section you like while others change | F7 | M5 |
| **Versions** | every prompt edit is a version; compare in words (the diff); revert | F7 | M5 |
| **Export** | wav now; MIDI and stems later; render progress | F6, F7 | M3 (wav, headless), M5 (UI), after M5 (MIDI, stems) |
| **Open / save project** | the document as a file | F7 | M5 |

## Settings

| Setting | Values | Default | Lands |
|---|---|---|---|
| Output device · cue device | the system's devices | system default · none | M1-04 · M5 |
| Safe start volume | −24..0 dB | −12 dB | M1-04 |
| Default dwell time | 1–60 min | 10 | M4 |
| Brain | `rules` · `claude` (+ model) | `claude` when signed in, else `rules` | M4 |
| Analysis cache | location · size · clear | app cache dir | M2 |
| Theme | light · dark · system | system | M1-04 |
| Reduced motion | follows the system; override | system | M1-04 |
| Keyboard shortcuts | the map, editable later | fixed | M5 |
| Telemetry | off (a course decision to turn on, process §15) | off | — |

## Rules that apply to every control

- **Visible state** within 100 ms; a change the set will honour later says **when** ("next phrase, in 6 bars").
- **Keyboard for everything**; focus visible; the map in Settings.
- **Immediate controls never alter the document**; planned controls never touch what is `committed`.
- **Local preferences** (volume, device, theme, dwell default) are remembered per machine; **set state** (queue, layers, energy) belongs to the set and is saved with it.
- **A control that cannot act says why** (no brain, no worker, nothing queued) instead of doing nothing.
- Every row here appears in a card's "done when" before it is called shipped; the M5 gate is this table with no row missing for M1–M5.
