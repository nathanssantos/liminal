# Research agenda

> The topics the loop investigates, in priority order. `open` = not covered; `covered` = a brief
> exists (link); `refresh` = covered but ageing (`refresh_by` passed). The `/research` skill picks
> the first `open` topic the current or next milestone cites, then the oldest `refresh`, then a
> `research` issue from the owner. Electronic music first; other genres after M5.

| Id | Topic | Question the product needs answered | Milestone | Status |
|---|---|---|---|---|
| R01 | LLM + live-coding landscape | what exists, what they do well, what they lack | M0–M1 | covered — [2026-09-05-llm-live-coding-landscape.md](2026-09-05-llm-live-coding-landscape.md), refresh by 2026-12 |
| R02 | Techno and house arrangement conventions | typical section lengths, energy arcs, intro/break/drop patterns, phrase lengths | M3–M4 | open |
| R03 | Subgenre tempo and key conventions | BPM ranges and common keys/modes per subgenre, half/double ambiguity cases | M2–M3 | open |
| R04 | Swing, groove and micro-timing in electronic drums | measured swing ratios, hat/clap placement, what "groove" means numerically | M2–M3 | open |
| R05 | Harmonic mixing in DJ practice | Camelot wheel usage, energy-boost mixes, when key clashes are accepted | M4 | open |
| R06 | Transitions in DJ sets | filter sweeps, EQ swaps, loop rolls, drum bridges — lengths in bars, when each is used | M4 | open |
| R07 | Loudness and mastering targets for club and streaming | LUFS, crest factor, sub management | M3 | open |
| R08 | Synthesis recipes for staple sounds | kick, sub, hat, pluck, pad, acid — parameters reproducible in Tone.js | M1–M3 | covered — [2026-09-06-synthesis-recipes.md](2026-09-06-synthesis-recipes.md), refresh by 2027-03 |
| R09 | How AI is used in electronic music production today | tools, workflows, what producers adopt and reject, legal constraints (training data, licensing) | M4–M5 | open |
| R10 | Generative and endless-music products | who ships "infinite music", how users react, what they pay for, what fails | M5 | open |
| R11 | Beat tracking and key detection: state of the art and known failure modes | which algorithms, accuracy on electronic music, half/double handling | M2 | open |
| R12 | Sample and soundfont sources with clear licences | what we can ship, attribution, quality | after M5 | open |
| R13 | Stem separation (Demucs and successors) for reference analysis | accuracy, cost, what it enables | after M5 | open |
| R14 | Music theory for tension and release | tritone, diminished, pedal tones, modal interchange — as rules a generator can apply | M3 | open |
| R15 | UI patterns of DJ and music apps | timelines, energy displays, transport, what first-time users understand | M5 | open |
| R16 | Other genres: what synthesis alone cannot do | jazz, orchestral, hip-hop — where samples are mandatory | after M5 | open |
| R22 | Melody transcription from real recordings | which models and tools work today on a full mix, on stems, on an isolated line; note accuracy; runtime on a laptop; licences | B05 spike | open |
| R23 | Chord recognition and structure from audio | accuracy per bar on electronic and non-electronic music; which tools; what confidence they expose | B05 spike | open |
| R24 | Rights for reworks, remixes and covers | what a private rework may do, what sharing needs (mechanical, sync), what public-domain and own-material doors exist, how products handle it | B05 decision | open |
| R25 | How electronic producers rework a song — the craft of the edit and the remix | how the melody is kept recognisable while the rhythm, register and harmony change; typical arrangement maps from song sections to intro/build/drop/break | B05 arrangement | open |
| R20 | Who else needs endless, coherent, licence-free music — streams, venues, shops, games | what they use today, what it costs, what breaks (repetition, licensing, mood), and whether steerability matters to them | exploration | open |
| R21 | How music tools found their first users | which products in this space got traction, through whom, and what the first version did and did not do | exploration | open |
| R19 | What DJs and listeners actually touch during a set | which controls get used and how often (volume, filter, EQ kills, loops, cue), what first-timers reach for, what is never used | M4–M5 | open |
| R18 | AI song and track generators (prompt → audio) | what producers use them for, what they export, what they miss (editability, stems, MIDI), licensing and training-data constraints | M3–M5 | open |
| R17 | How DJs travel between subgenres and tempos in one set | tempo ramps vs. half-time tricks, key paths, how many tracks a 124→140 journey takes, what listeners accept | M4 | open |

Adding a topic: a row here, by PR, with the question phrased so a brief can answer it. Owner
requests come as `research` issues and get a row when picked.
