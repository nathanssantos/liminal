# Two clocks (`@liminal/conductor` × `@liminal/engine`)

> The guarantee behind "endless": the LLM is never in the audio path. Here are the numbers, the
> queue model, the fallback, and what proves each thing. Implemented in M4; the M1 engine is
> born with the hooks.

---

## The three times

| Time | Kept by | Unit |
|---|---|---|
| **audio time** | the renderer's `AudioContext` | ticks, via `Transport` |
| **wall time** | the system clock | ms |
| **brain time** | the latency of each decision | seconds, variable |

Only the first is trustworthy. Everything the conductor decides is expressed in **bars**, and the
engine converts to audio time at scheduling.

---

## Constants (v1 — to be measured in M4)

| Name | Initial value | What it is |
|---|---|---|
| `PHRASE_BARS` | 4 | the boundary where any change lands: plan, live prompt, feedback |
| `MIN_HORIZON_BARS` | 8 | below this, the fallback extends **before** the next boundary |
| `COMMIT_HORIZON_BARS` | 16 | what the conductor tries to keep committed ahead |
| `BRAIN_DEADLINE` | wall time until `committedEnd − MIN_HORIZON` | deadline of each brain call |
| `SOUNDCHECK_BUDGET` | ⅓ of the deadline | render + measurement of one segment |
| `MAX_REGENERATIONS` | 2 | attempts before accepting the best that came out |
| `DEFAULT_DWELL_MINUTES` | 10 | how long the set stays on a reference before travelling to the next queued one; per-entry override, editable while playing |
| `HANDOVER_MIN_PHRASES` | 4 | the shortest handover between two reference cards |
| `HANDOVER_BARS` | derived: `max(HANDOVER_MIN_PHRASES × PHRASE_BARS, tracksNeeded × trackBars)` where `tracksNeeded = ceil(|bpmB − bpmA| / 4)` | how long the set takes to reach the next card; plan requirement 6 measures against it |

At 128 BPM, 16 bars = 30 s; 8 bars = 15 s. The latency measured on another project (2 s with a
persistent session) fits comfortably. **If M4's measurement says otherwise, the numbers change
here, with a date.**

---

## Queue model

The set is a sequence of **segments**. Segment = one `Score` (one section, typically 8–32 bars)
+ absolute position in the set + entry transition.

```
proposed ──► rendering ──► measured ──► accepted ──► committed ──► playing ──► done
                                 └────► rejected ──► (regenerate, up to MAX_REGENERATIONS)
```

| State | Means | Changed by |
|---|---|---|
| `proposed` | the brain (or the rules) returned a plan and the generator produced the `Score` | conductor |
| `rendering` | the hidden window is rendering | conductor → hidden window |
| `measured` | the worker returned the `Measurement` | analyzer |
| `accepted` / `rejected` | `distance` within/outside tolerance | conductor |
| `committed` | handed to the engine; **immutable** from here | conductor → engine |
| `playing` / `done` | the engine passed its start / its end | engine → conductor |

🔴 **Committed is immutable.** Live prompt, feedback, new plan — everything acts from `proposed`
onward. If only committed segments remain until the next boundary, the change lands at the
following boundary. That is why "lands in ≤ 8 bars" is the requirement, not "immediately".

---

## The invariant and the fallback

**Invariant:** at every bar boundary, `committedEnd − now ≥ MIN_HORIZON_BARS`.

The engine emits `bar` every bar. The conductor, in the handler, checks the invariant. If it fails:

```
extend(currentSegment, PHRASE_BARS) → Segment   // synchronous, pure, no I/O, no brain
```

`extend` produces a new segment from the current one with **one** deterministic rule-based
variation: a fill in the last bar, a layer muted or back, filter movement, bass octave. Seed
derived from the segment and the index, for reproducibility.

The extended segment enters `committed` directly — no soundcheck, because there is no time. It is
the only exception, and it is flagged in the log.

🔴 **The brain is never awaited.** A brain call is a `Promise` with a deadline; the `bar` handler
never `await`s. A result arriving after the deadline is discarded with a log line.

---

## Soundcheck

While segment N plays, N+1 (or N+2) goes through an offline render in the hidden window and
`measure` in the worker. Comparison with the target (`distance`). Outside tolerance: regenerate
with a new seed, up to `MAX_REGENERATIONS`; then accept the lowest distance.

Budget: `SOUNDCHECK_BUDGET`. Exceeded: accept what has been measured, or the first proposed
without measurement — and log `soundcheck-skipped` with the reason.

---

## Prompts and feedback

| Input | When it lands | Acts on |
|---|---|---|
| **immediate controls** — volume, mute, device, master filter, layer on/off, cue | now, in the renderer's engine output stage | nothing in the document, the plan or the soundcheck; they never pass through the conductor (`docs/product/controls.md`) |
| **planned controls** — energy dial, next, hold, loop this phrase, tempo target, key lock | the next phrase boundary | the `proposed` segments onward, exactly like a live prompt; each logs `control.received` and `control.applied` with bars |
| standing prompt | at the next brain call | the target card and the arc |
| live prompt | at the next phrase boundary | the `proposed` segments onward; if there are none, the brain is called now, with the prompt, for the next segment |
| "more of this" / "less of this" | same | the accumulated preference vector, which enters the brain's context and the `distance` weights |
| **new reference** (queued) | analysis runs in the background; the handover starts at the first phrase boundary after the card is ready | a **handover plan**: one intermediate target per phrase from card A to card B — BPM inside the per-track budget, key by Camelot neighbours (shortest path), bands and density interpolated, motifs cross-faded. The soundcheck compares against the intermediate target. Analysis failure → `reference.failed`, target unchanged, error surfaced |
| **queue reordered, a reference removed, or a dwell time changed** | next phrase boundary | the schedule (dwell → handover → dwell …) is recomputed and the handover plan, if one is running, is rebuilt from the current intermediate target; nothing `committed` changes. Shortening a dwell below what already played starts the handover now |

Every event carries the bar it was received at and the bar it **acted** at. The difference is
requirement 3's metric.

---

## What proves each thing

| Proof | How | Runs where |
|---|---|---|
| **P1** zero uncovered bars with a slow brain | fake engine (advances ticks in a loop), brain with 10 s injected latency, 30 simulated minutes in seconds; asserts `uncoveredBars === 0` and counts `extend` | Vitest |
| **P2** invalid plan → fallback | brain returns JSON outside the schema; asserts `extend` called, no exception escapes | Vitest |
| **P3** brain throws → fallback | same with `throw` | Vitest |
| **P4** deadline respected | brain answers after the deadline; asserts result discarded and logged | Vitest |
| **P5** live prompt in ≤ 8 bars | inject a prompt at bar k; assert `appliedAtBar − k ≤ 2 × PHRASE_BARS` | Vitest |
| **P6** in Chromium, no gap | real app, 10 min, `rules` brain with 10 s injected delay; log without `uncovered`, `AudioContext` without reported `underrun`; and a human listens for 2 min | Playwright + ears |
| **P7** handover within budget | two fixture cards (e.g. 124 BPM / 8A → 132 BPM / 10A); queue B at bar k; assert `handover.completed.bars ≤ HANDOVER_BARS`, every `handover.step` BPM delta ≤ 4 per track, every key step a Camelot neighbour, final `distance` to B within tolerance | Vitest (fake engine) |
| **P8** analysis failure keeps the target | worker returns an error for B; assert `reference.failed` logged, target still A, no `handover.*` events, the UI shows the error | Vitest + Playwright |
| **P9** queue edits act from `proposed` onward | reorder the queue mid-handover; assert no `committed` segment changes and the plan is rebuilt from the current intermediate target | Vitest |
| **P10** dwell time is honoured and editable | queue B with dwell 6 min after A; assert `handover.planned` at the first phrase boundary after 6 min of A; change the dwell to 2 min at minute 1 and assert the handover starts at the next boundary after minute 2 | Vitest (fake clock) |

---

## Set log

`set.log.jsonl` in the session directory. One event per line, with `bar` and `wallMs`:

`plan.requested` · `plan.received` (latency) · `plan.discarded` (reason) · `segment.<state>` ·
`extend` · `soundcheck.measured` (distance) · `soundcheck.skipped` · `prompt.received` ·
`prompt.applied` · `feedback.received` · `control.received` · `control.applied` ·
`reference.queued` · `reference.analyzed` · `reference.failed` · `handover.planned` ·
`handover.step` · `handover.completed` · `engine.bar` · `engine.underrun`.

The numbers for plan requirements 1, 2, 3 and 5 come from this log. No log, no proof.
