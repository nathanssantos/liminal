# The craft book — what the brain knows as a DJ and a producer

> The set is only as good as the taste behind it. This folder is that taste, written down: how
> to mix, how to build a break, how to bridge two tracks in distant keys, how to arrange, how a
> mix should sit — the things a DJ and a producer know by hand. It has two readers: the **brain**
> (the whole book is compiled into the `claude` brain's system prompt and stays cached in the
> persistent session, ADR-0004) and the **code** (every rule marked `enforced` lives in a generator,
> a transform or a controller, with a test). The research iterations feed it; the `music-reviewer`
> audits it; the set log proves it.

| File | What it holds |
|---|---|
| [mixing.md](mixing.md) | phrase structure, harmonic mixing paths, tempo, EQ and bass swaps, the transition catalogue and when each applies |
| [arrangement.md](arrangement.md) | sections and their lengths, energy arcs, how a break, a build, a drop and a bridge are constructed, templates per subgenre |
| [harmony.md](harmony.md) | keys and modes in electronic music, modulation paths, pivot chords, pedals, tension and release, bridging distant keys |
| [sound.md](sound.md) | frequency roles per layer, one sub at a time, kick and bass, stereo below 120 Hz, headroom and loudness |
| [mistakes.md](mistakes.md) | what makes a set sound wrong — the checklist the brain runs on its own plan before returning it |

## How an entry is written

Every technique carries: **what** it is · **when** it applies · **how** in liminal's terms (which
controller, generator, transform or plan field) · **sources** (research briefs, `docs/research/`)
· **status**: `enforced` (a rule in code with a test — cite it), `advised` (the brain applies it
by judgment; the set log shows whether it did), `assumed` (written from common practice; a brief
still has to cite it). An `assumed` entry becomes `advised` when a brief backs it and `enforced`
when the rule is worth a test.

## How it is used

- **Brain prompt.** `packages/brain` compiles `docs/craft/*.md` into the system prompt of the
  `claude` brain (a build step, so the prompt and the book cannot drift). The plan schema forces
  the craft into the answer: every transition names its technique and its bars; every key change
  names its path; every break names its construction.
- **Rules brain and controllers.** The `enforced` entries are the `rules` brain and the
  conductor's controllers. The `rules` brain is the floor: a set with no LLM still obeys the book.
- **Proof.** The set log carries the craft metrics (`mixing.md › Metrics`): phrase-aligned
  transitions, valid key paths, no double bass, tempo inside budget, breaks that resolve. They are
  part of the M4 gate, next to the human ear.
- **Growth.** A research brief on a craft topic (R02, R05, R06, R07, R14, R25, R27, R28) ends in
  entries here, or in a change of status. A card that turns an entry into code updates its status
  in the same PR (process §16).

## Reading order for the brain

1. `mistakes.md` — what never to do.
2. `mixing.md` — the transition catalogue and the harmonic paths.
3. `arrangement.md` — how sections are built and how energy moves.
4. `harmony.md` — how keys move and how tension is made and released.
5. `sound.md` — how the layers share the spectrum.
