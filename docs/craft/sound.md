# Sound — how the layers share the spectrum

## Frequency roles

| Band | Owner | Rule | Status |
|---|---|---|---|
| **sub** 30–60 Hz | one voice: the sub or the kick's tail — never both fighting | one `sub`-role track sounding at a time; the kick is short below 60 Hz when a sub plays | enforced (double-bass check) |
| **bass** 60–120 Hz | the kick's body and the bass's fundamental | the bass ducks under the kick (sidechain or a rest on the kick's beat) | enforced (bass patterns rest or duck on the kick) |
| **low-mid** 120–500 Hz | warmth — and mud | chords and pads high-passed at 120–200 Hz unless they are the bass | advised |
| **mid** 500–2k | the body of chords, the lead's fundamentals | leave a hole for the lead: the pad thins where the lead lives | advised |
| **high-mid** 2–6k | presence: hats, clap, the lead's edge | one bright element at a time | advised |
| **presence / air** 6–20k | hats, air, reverb tails | the hats are the only steady element here; everything else is a tail | advised |

## Kick and bass — the contract

- The kick owns the 1 (and the 3); the bass either **rests** on the kick or **ducks** under it.
  The generators never write a sustained sub note across the kick. `enforced`.
- **Mono below 120 Hz.** Stereo width in the low end cancels on a club system. The engine's
  `sub` and `bass` presets are mono; the mix stage keeps them centred. `enforced` (engine presets).
- **One sub.** See the double-bass rule in `mixing.md`. `enforced`.

## Loudness and headroom

- **Headroom before the limiter:** peaks at −6 dBFS pre-limiter; the limiter is for safety, not
  for loudness. `enforced` (mix stage: master gain −6 dB default; limiter on).
- **Targets:** club sets run hot (−8 to −6 LUFS integrated) but a streaming export sits at −14
  LUFS; the production export offers both. `advised` (R07 refines).
- **Crest factor tells the truth:** a drop with a crest factor below 6 dB is crushed; a break
  above 14 dB is dynamic. The soundcheck measures it; the brain reads it. `advised`.

## Layer count and space

- **Fewer layers, more space.** A techno drop can be four layers. Adding a fifth to "fill" makes
  it smaller. `advised` (the novelty controller counts layers).
- **Every layer has a job**: pulse (kick), time (hats), foundation (sub/bass), colour (chords/pad),
  hook (lead/arp), air (fx). Two layers with the same job compete. `advised`.
- **Reverb and delay are layers too** — they take space in the mids and highs; a break can afford
  them, a drop rarely. `advised`.
