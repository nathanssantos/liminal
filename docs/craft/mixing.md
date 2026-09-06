# Mixing — how one thing becomes the next

## Phrase structure

- **Electronic music moves in phrases of 8, 16 and 32 bars.** Sections start on a phrase; a
  transition that starts mid-phrase sounds like a mistake even when the keys match. In liminal a
  phrase is `PHRASE_BARS` (4 by default for control latency), but **structural changes land on
  8- or 16-bar boundaries** and transitions on 16 or 32. `enforced` (conductor: section starts
  snap to 8 bars; handovers start on 16) — test in M4-04.
- **Count from the 1.** The first beat of the first bar of a phrase is where the kick returns, the
  drop lands, the new track enters. `enforced` (generators place downbeat events at bar 0 of a
  section).

## Harmonic mixing — which key can follow which

The Camelot wheel names keys `1A`–`12A` (minor) and `1B`–`12B` (major); neighbours share most
notes.

| Move | Effect | Status |
|---|---|---|
| **same key** | seamless; risks monotony over many tracks | enforced |
| **±1 on the wheel** (e.g. 8A → 9A or 7A) | the classic smooth mix; the fifth up brightens, the fourth down darkens | enforced (`nextKey`) |
| **relative** (8A ↔ 8B) | minor ↔ major with the same notes; a mood change with no clash | enforced |
| **+2 on the wheel** (8A → 10A) | the "energy boost": a lift that still shares notes; use at builds, not breaks | advised |
| **+7 (a semitone up, e.g. 8A → 3A)** | dramatic key lift, as in a final chorus; rare, once per set at most, only through a break with no tonal content | advised |
| **anything else** | a clash unless bridged (see `harmony.md › Bridging distant keys`) | enforced (refused by `nextKey` unless a bridge is planned) |

**Paths, not jumps.** To get from 8A to 2A (six steps), the set travels: 8A → 9A → 10A … one
step per track or a relative hop, **or** takes a bridge with no tonal content (drums only,
noise, a pedal note common to both) and re-enters in the new key. `enforced` (handover plan =
shortest path on the wheel; a bridge when the path is longer than the dwell allows).

## Tempo

- **Move tempo slowly.** ≤ 4 BPM per track (plan requirement 2); a big journey takes several
  tracks or a break. `enforced` (BPM budget).
- **Half-time and double-time are the shortcut.** 140 and 70 share a grid; a drum-and-bass break
  at half-time reads as 87 and can become a 90 BPM house track without anyone hearing a jump.
  `advised` — the conductor may plan a half-time bridge when the tempo gap is > 12 BPM. Research
  R17 says how DJs do it.
- **Tempo changes happen in breaks**, where there is no kick to expose the drift. `advised`.

## EQ and the bass swap

- **Never two basses.** Two tracks' low ends together turn to mud and pump the limiter. When the
  incoming track's bass enters, the outgoing one leaves — on the same beat, on the phrase. In
  liminal the incoming segment's `bass`/`sub` layers are muted until the swap bar; the outgoing
  ones are cut there. `enforced` (transition object `eqSwap` / `bassSwap`) — test: at no bar do
  two `sub`-role tracks sound together.
- **Highs first, lows last.** Bring the new track in from the top (hats, pads, lead) over 8–16
  bars; swap the bass last. Going out, reverse it. `advised`.
- **The filter sweep is the DJ's fade.** A low-pass on the outgoing track over 8 bars removes
  presence before the swap; a high-pass on the incoming keeps it airy until the swap. `enforced`
  (transition `filterSweep`, with bars and direction).

## The transition catalogue

| Transition | What it is | When | Bars | Status |
|---|---|---|---|---|
| **bass swap** | outgoing bass out, incoming bass in, on the phrase | any two tracks in compatible keys | 1 (the swap) inside a 16-bar overlap | enforced |
| **filter sweep** | low-pass out / high-pass in over the overlap | when the keys are close and the energy should stay | 8–16 | enforced |
| **drum bridge** | tonal layers out; drums carry 8–16 bars; new key enters clean | distant keys, or a mood reset | 8–16 | enforced |
| **break-to-drop** | the outgoing track breaks; the incoming track's drop is the resolution | a big lift; the classic peak-time move | break 16, drop on the 1 | advised |
| **loop roll** | the last phrase of the outgoing track loops and halves (8, 4, 2, 1 bars) into the new downbeat | high energy, playful; not twice in a row | 8 → 1 | advised |
| **echo out** | the outgoing track cuts to a delay tail; silence or a pad; the new one enters | a mood change, a tempo change, a rework's start | 2–4 | advised |
| **pedal bridge** | a held note common to both keys under a drum bridge; the new key resolves onto it | distant keys with a shared tone | 8 | advised (`harmony.md`) |
| **half-time bridge** | the outgoing track drops to half-time feel; the incoming one enters at the matching grid | tempo gap > 12 BPM | 16 | advised |

**Choosing.** The brain names the transition in the plan (`transition.kind`, `bars`, `reason`);
the conductor refuses a kind whose preconditions fail (a bass swap between clashing keys). Not
the same transition twice in a row unless it is the bass swap. `enforced` (plan schema +
precondition check) — test in M4-04.

## Metrics the set log proves

| Metric | Rule | Where it comes from |
|---|---|---|
| phrase alignment | 100% of section starts on an 8-bar boundary; 100% of handovers on 16 | `segment.committed` bars |
| key path | every consecutive pair of segments is same / ±1 / relative / bridged | `handover.step` keys |
| tempo budget | no step > 4 BPM without a bridge | `handover.step` bpm |
| no double bass | no bar with two sounding `sub`-role tracks | soundcheck of the overlap |
| transition variety | no non-bass-swap transition repeated back to back | `transition.kind` |
| break resolves | every `break` is followed by a section with more energy within 32 bars | `segment.*` energy |
