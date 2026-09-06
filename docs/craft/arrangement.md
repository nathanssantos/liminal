# Arrangement — how a track and a set are built

## Sections and what they are for

| Section | Job | Typical length (bars) | What plays |
|---|---|---|---|
| **intro** | give the DJ (or the previous segment) something to mix into: drums and one idea, no bass yet or a simple one | 16–32 | kick, hats, a pad or a motif; bass enters at the end |
| **build** | raise tension without giving the release: add layers, tighten, rise | 16 | riser, snare roll or hat acceleration, filter opening, no sub |
| **drop** | the release: everything that matters, at full energy | 32 (16 in faster genres) | kick, sub, bass, lead, chords; the hook |
| **break** | take the floor away: remove the kick (and usually the sub), let the harmony breathe, then rebuild | 16–32 | pad, chords, lead, atmosphere; a build at the end |
| **bridge** | go somewhere else: a new idea, a key move, a tempo move — under cover | 8–16 | drums only, or a pedal, or a motif transformed |
| **outro** | leave room for the next thing: layers leave in reverse order of entry | 16–32 | drums last, then nothing or a tail |

`enforced` (the generators' section templates: roles, lengths in phrases, which layers may
sound; the score's `Section.role`). `advised`: which order and how many of each — the brain
plans the arc, the templates make each section sound like what it is called.

## Energy arcs

- **A set breathes.** Peaks need valleys: a drop after a drop is louder, not more exciting. The
  novelty and energy controllers keep consecutive sections within a band and force a break after
  two drops. `enforced` (energy controller).
- **The classic set arc:** warm-up (low, long, spacious) → build over 20–40 min → first peak →
  a breakdown → second, higher peak → cool-down. In liminal the brain writes the arc as energy
  targets per 5 min; the plan says where the next peak is. `advised`.
- **Contrast is made by what you take away**, not by what you add. The break is the most
  powerful tool in the set. `advised`.

## How a break is built

1. **Cut the kick on the 1** of a phrase (and the sub with it). The floor disappears; the room
   changes. `enforced` (break template: no `kick`/`sub` in the first half).
2. **Let the harmony carry**: pad or chords up in level, a lead or motif variation, reverb and
   delay open. `advised` (the brain chooses which layers; the template allows them).
3. **Rebuild**: 8–16 bars before the drop, bring the build elements — a riser (a filtered noise
   or a rising pitch), a snare roll or hat acceleration (every 2 → 1 → ½ bar), the filter opening
   on the chords. `enforced` (build template events: `riser`, `roll`, `filterOpen`).
4. **The gap.** One beat — sometimes a whole bar — of near-silence right before the drop. It is
   the most effective bar in electronic music. `enforced` as an option in the drop template
   (`gapBeats: 0|1|4`); `advised` when to use it (not every time).
5. **Drop on the 1**, with the kick and the sub back together, the hook at full energy.
   `enforced`.

## How a build is built

- Add one thing every 4 bars; never everything at once. `advised`.
- Rising elements: pitch rises, filter opens, roll accelerates, reverb grows. `enforced`
  (build events available to the generator).
- The build promises; the drop pays. A build without a drop (a fake-out) works once per set at
  most. `advised`.

## Bridges between two tracks

A bridge is where the set changes key, tempo, or mood without the listener feeling a cut:

- **Drum bridge**: tonal layers leave; drums carry 8–16 bars; the new key enters on a phrase.
  Works for any key distance. `enforced` (transition `drumBridge`).
- **Pedal bridge**: a note both keys share is held (pad or bass) under the drums; the new key
  resolves onto it. `harmony.md` lists the shared tones. `advised`.
- **Motif bridge**: the motif of the outgoing track is transformed (transposed, augmented) into
  the new key over 8 bars — the listener follows the idea across the change. The motif bank makes
  this possible. `advised`.
- **Half-time bridge**: see `mixing.md › Tempo`. `advised`.

## Templates per subgenre (starting points; research R02 refines them)

| Subgenre | Tempo | Phrase | Arc of a track | Notes |
|---|---|---|---|---|
| techno | 128–140 | 16/32 | intro 32 · build 16 · drop 32 · break 16 · build 8 · drop 32 · outro 32 | hypnotic: fewer, longer sections; the break is often just the kick leaving |
| house | 120–128 | 16/32 | intro 32 · build 16 · drop 32 · break 32 · drop 32 · outro 32 | the break carries the harmony; vocals or chords lead |
| trance | 132–142 | 32 | intro 32 · build 32 · drop 32 · break 32 (the big one) · build 16 · drop 32 · outro 32 | the break is the emotional centre; long risers |
| drum and bass | 170–176 | 16/32 | intro 32 · build 16 · drop 64 · break 32 · drop 64 · outro 16 | half-time breaks; the second drop switches the bass |
| ambient / downtempo | 60–100 | free | sections by texture, not by drop | breaks and drops are gentle; energy moves in decades of seconds |

All `assumed` until R02 cites; the generators start from them.
