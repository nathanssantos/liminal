---
topic: R08
question: what synthesis parameters produce a defensible kick, hat, bass and chord voice in techno and house, expressible in Web Audio primitives with no samples
sources:
  - https://www.soundonsound.com/techniques/designing-kicks-logic-pro-x
  - https://www.soundonsound.com/techniques/responses-resonance
  - https://ccrma.stanford.edu/software/clm/compmus/clm-tutorials/fm2.html
  - https://docs.cycling74.com/learn/articles/06_synthesischapter05/
  - https://tonejs.github.io/docs/15.1.22/classes/MembraneSynth.html
  - https://tonejs.github.io/docs/r13/MetalSynth
  - https://tonejs.github.io/docs/r13/NoiseSynth
  - https://noiseengineering.us/blogs/loquelic-literitas-the-blog/creating-fm-hats/
  - https://noiseengineering.us/blogs/loquelic-literitas-the-blog/tips-and-tricks-ducking/
  - https://www.attackmagazine.com/technique/beat-dissected/deep-house-stripped-workout-beat-dissected/
confidence: medium
refresh_by: 2027-03
---

## What we asked

`@liminal/engine` plays a score through nine synth presets. Their envelopes and parameters were
chosen without a reference, and a human is about to judge them by ear. We asked what techno and
house actually need from a kick, a hat, a bass and a chord voice — in numbers, expressible in Web
Audio primitives, with no samples, because none exist before M5.

## What the sources say

**The kick is a pitch envelope over a body.** A Sound on Sound walkthrough (December 2016) builds an
808-style kick from one oscillator tuned to C0, a pitch-envelope decay of **7.6 ms** and an
amp-envelope decay of **720 ms**, and states the trade-off plainly: a fast pitch decay gives a
clicky transient, a slower one gives mid-range thump. Tone's `MembraneSynth` is the same mechanism
with different parameters — the frequency starts at `note * octaves` and ramps to `note` over
`pitchDecay` — so the article's numbers translate directly.

The fundamental itself is folklore. Secondary production guides converge on **40–60 Hz** for a
TR-808 kick, with named zones around 30, 50 and 80 Hz, but none of them measures anything. The one
primary paper found on TR-808 harmonic constraints could not be read in this pass.

**The hat's default is wrong, and the source says why.** Tone's `MetalSynth` ships
`envelope.decay: 1.4` seconds — a cymbal decay. `NoiseSynth` ships `decay: 0.1`, already close to a
closed hat. Technique sources describe the metallic recipe as two detuned inharmonic oscillators
through a resonant highpass with a short envelope, and treat noise as an alternative timbre rather
than a downgrade: metallic reads as cymbal, noise reads as hiss.

House and techno place **closed hats on the eighths and an open hat on the off-beat**, and on a
drum machine the two share one voice, so a closed hit chokes the open tail. That is a structural
difference, not a velocity one.

**The bass ducks itself.** The canonical Sound on Sound article on resonance (October 1999) explains
what a resonant lowpass does but gives no bass numbers; technique sources converge on a fast attack,
short decay and low sustain on the filter envelope, so the note brightens on its transient and
settles darker. For the kick clash, the sources point away from a compressor: shaping the note so it
is quietest when the kick lands produces the same audible pump. For a synthesised part that reduces
to note length and envelope decay — which the document already controls.

**FM tells lead from bell, and the rule is old and firm.** Chowning-derived FM theory, restated in
the Max documentation, says an **integer** carrier-to-modulator ratio gives a harmonic spectrum that
reads as a pitched instrument, and a **non-integer** ratio gives an inharmonic one that reads as a
bell or a drum. A modulation index of 2 or more is bright and complex; below 1 is closer to
vibrato. The classic bell is a falling modulation index over a long exponential decay — the opposite
of a pad.

AM has no equivalent ratio switch, and the literature on what makes an AM voice read as a lead is
thin. That one stays open.

**Levels have no citable standard.** Every source found on relative track gain was SEO-tier. They
converge loosely on the kick loudest, the bass a few decibels under it and pads further back, with
headroom before a limiter — a convention, not a measurement.

## What it means for liminal

- **The hat preset is the one to change.** `MetalSynth`'s 1.4 s default decay is a cymbal; a closed
  hat wants roughly **80–200 ms** and an open one **300–600 ms**, with `resonance` nearer 5–8 kHz
  than the 4 kHz default. The engine already cuts the decay to 60 ms, which is inside the closed
  range. If the listening gate rejects the timbre, the documented swap is `NoiseSynth`, whose own
  default shape is already a closed hat — so it is the lower-risk default, not merely the fallback.
- **The kick's pitch decay is in the right place.** The engine uses `pitchDecay: 0.03` and
  `octaves: 6`; the article's 7.6 ms sits inside the 5–15 ms band that gives a clicky transient.
  The amp decay of 320 ms is shorter than the article's 720 ms, which is right for 128 BPM: the
  article's kick is for slower material and would smear into the next hit here.
- **The fixture's bass sustains through the kick.** Its notes last 420 ticks of a 480-tick eighth,
  so the bass is loudest exactly when the kick lands. The sources say the fix is the note, not a
  compressor: shorter notes, or a faster amp decay. That is free inside the document model and
  inside M1-02's scope, which puts compressors out.
- **`pad-fm` and `lead-am` risk sounding like the same bell.** Pinning `pad-fm` to an integer
  harmonicity with a slow attack and a modulation index at or below 2 makes it read as a held pad;
  `lead-am` needs a faster, brighter envelope, because AM has no ratio to lean on.
- **The fixture's levels are defensible, and only that.** Kick 0 dB, hat −6, bass −3, chords −9 and
  a master at −1 with a limiter sit inside what the weak sources describe. They are a starting
  point to tune by ear, and R07 is the topic that should carry loudness with rigour.

## Ideas

- A kick that layers a short noise burst through a highpass over the membrane body would sound
  clubbier without a sampler or a new instrument kind.
- Hat presets that carry a closed-or-open variant would let a generator place the off-beat open hat
  that the genre expects, instead of faking it with velocity.
- Treating bass note length as the ducking mechanism keeps techno grooves punchy with no new engine
  code and no compressor.
- Documenting the fixture's gains as taste rather than fact would stop a future reader citing them
  as settled when R07 lands.

## What we did not find

- Any primary measurement of a TR-808 kick's fundamental. The one paper found could not be read.
- Any citable authority giving hat decay times in milliseconds for closed against open.
- Any published cent value for supersaw detune. Sources agree it is non-uniform and stop there.
- Any primary source for relative track gain in techno and house. That belongs to R07.
- Anything on what makes an AM voice read as a lead rather than a bell. The literature is FM's.
