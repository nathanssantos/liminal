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
| standing prompt | at the next brain call | the target card and the arc |
| live prompt | at the next phrase boundary | the `proposed` segments onward; if there are none, the brain is called now, with the prompt, for the next segment |
| "more of this" / "less of this" | same | the accumulated preference vector, which enters the brain's context and the `distance` weights |

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

---

## Set log

`set.log.jsonl` in the session directory. One event per line, with `bar` and `wallMs`:

`plan.requested` · `plan.received` (latency) · `plan.discarded` (reason) · `segment.<state>` ·
`extend` · `soundcheck.measured` (distance) · `soundcheck.skipped` · `prompt.received` ·
`prompt.applied` · `feedback.received` · `engine.bar` · `engine.underrun`.

The numbers for plan requirements 1, 2, 3 and 5 come from this log. No log, no proof.
