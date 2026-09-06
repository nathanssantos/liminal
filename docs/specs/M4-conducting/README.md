# M4 · Conducting

> The conductor and the brains: the endless set, the two clocks, the reference queue and its
> handovers, prompts, feedback — and the listener's own controls for steering and shaping.
> The spec is in [two-clocks.md](../cross-cutting/two-clocks.md); the controls in
> [controls.md](../../product/controls.md).

**Milestone gate:** 60 min with no gap on the `rules` brain, then on `claude`; 10 s of injected
brain latency produces no gap; a live prompt lands in ≤ 8 bars; a queued reference is reached
within `HANDOVER_BARS` with no budget broken; every planned control lands at the next phrase
boundary and every immediate one acts within a buffer.

⚠️ **Vision and card list only.** The cards are written in M4's spec iteration, after M3 has
measured what M4 consumes.

## Planned cards, in order

| Id | Title | Listening |
|---|---|---|
| M4-01 | Segment queue, horizon invariant and synchronous `extend` (P1) | no |
| M4-02 | `rules` brain and the plan schema (P2, P3) | no |
| M4-03 | Soundcheck loop: render in the hidden window, measure, accept/reject | no |
| M4-04 | Coherence controllers: key, BPM, motif, energy, novelty, transition | **yes** |
| M4-05 | Live and standing prompts, feedback vector (P5) | no |
| M4-06 | Reference queue, dwell time and handover plans (P7–P10) | **yes** |
| M4-07 | `claude` brain: persistent session, deadlines, cost log (P4) | no |
| M4-08 | Planned controls: energy dial, next, hold, tempo target — the conductor side and the IPC | no |
| M4-09 | Immediate controls in the engine output stage: master filter, layer on/off | **yes** |
| M4-10 | Pause / resume, status events, the set log complete | no |
| M4-11 | 60-minute proof on Chromium with injected latency (P6) | **yes** |

## Decisions of this milestone

- The brain is never awaited in the audio path; the fallback is synchronous (ADR-0004).
- Immediate controls never enter the conductor; planned controls are inputs like prompts.
- Every requirement number comes out of the set log — no log event, no proof.
