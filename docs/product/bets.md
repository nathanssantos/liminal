# Product bets

> The product is a set of **hypotheses**, not a fixed proposal. Each bet says who it serves,
> what we believe, what would prove or kill it, and where it stands. The loop explores new bets
> (process §18), runs cheap spikes, and brings proposals to the owner; the owner decides
> direction. A bet that is proven becomes a requirement in `plan.md`; a bet that is killed stays
> here with what we learned. Nothing here is sacred, including the first three.

## Status vocabulary

`idea` → `explored` (a brief or a spike exists) → `proposed` (a `decision` issue is open) →
`accepted` / `declined` → `validated` / `killed` (by evidence, after shipping).

## Current bets

| Id | Bet | For whom | We believe | Proof that it works | Kill signal | Status |
|---|---|---|---|---|---|---|
| B01 | **Endless coherent set** steered by words and references | listeners who want a set for right now | people will run it for an hour and nudge it, instead of choosing tracks | sessions > 20 min; prompts per session > 0; `heard: ok` on the M4 gate | nobody runs it past 5 min; prompts ignored | accepted (plan req. 1–3, 5) |
| B02 | **Reference as numeric target** | the same, plus producers | "like this track" is the most natural brief there is | band match ±10% and the owner's ear agreeing on 9/10 | analysis wrong too often; people prefer words alone | accepted (req. 4, 6) |
| B03 | **Automated production** of a track as an editable document | producers and the curious | an editable, exportable document beats a rendered file | tracks exported and re-opened; prompt edits used | nobody edits; they only export | accepted (req. 7) |
| B04 | **Platform primitives** others build on (document, transforms, cards, brains, engines) | developers | the document as a file format attracts plugins and integrations | a second product built by someone else; forks that add an engine or a source | no external use after two releases | accepted (plan frame) |
| B05 | **Rework: any music into electronic** — give it one or more tracks of any genre; it plays them back as electronic music, one at a time or as a set that flows | listeners who love songs, not genres; DJs who want a crate of edits | "*this* song, as techno" is a stronger brief than "something like this song" — recognisable melody and harmony inside a new arrangement, with transitions that make sense | a listener recognises the song in 8 of 10 reworks (a blind test); the set of reworks passes the M4 gate on coherence; people queue songs they know rather than styles | transcription too unreliable on real recordings; the reworks sound like the melody pasted over a loop; licensing blocks sharing | **proposed by the owner (2026-09-06) → explore first** (see below) |

## B05 in detail — what it takes

The style card measures **how a track sounds**; a rework needs **what a track says**: melody,
harmony, structure. That is a new analysis door and a new composition step; the set machinery is
the same.

| Piece | What it does | Where it lands (proposal) | The hard part |
|---|---|---|---|
| **Content card** (`analysis`) | melody transcription (notes with timing), chord progression per bar, structure (sections), tempo and key — from audio; from MIDI or a score when the person has one | analysis, after the style card (an M2 spike first) | transcription from a full mix is the crux: vocals and leads are separable, but polyphony and effects hurt; confidence per note is mandatory |
| **Idiom arrangement** (`composition`) | rearrange the content as electronic music: the melody as lead, arp or vocal-like line; the harmony as chords and a bass that follows the roots; a rhythm section in the target subgenre; sections mapped to intro/build/drop/break; the tempo moved to the target with the melody re-timed | composition, after the generators exist | keeping the melody recognisable while changing its rhythm and register; when to simplify a chord for the idiom |
| **Rework in the set** (`conductor`) | each rework is a segment like any other: key path, tempo budget, handover, soundcheck | already designed (two-clocks) | bridges between two reworked songs whose keys and tempos are far apart |
| **Rework as production** | one song → one reworked track document → iterate ("more bass", "make the chorus the drop") → export | the production door (M3+) | — |

**Sources, in order of difficulty:** a MIDI file or a score (exact content, no transcription) →
an isolated melody line (a hum, a whistle, a single instrument) → a full recording (stems via
Demucs first, then transcription per stem). The first spike starts at the easy end.

**The honest constraint.** A rework of someone else's song is a derivative work. Listening at
home is one thing; sharing, publishing or selling reworks needs the rights (mechanical and
sometimes sync licences). The product must say so where a person exports or shares, and the
first users of B05 are people reworking **their own** or public-domain material, or listening
privately. This is a course decision when sharing arrives (process §15).

**First cheap steps (exploration):**
1. Research R22 (melody transcription: what works on real recordings today), R23 (chord
   recognition), R24 (remix and cover rights) — three briefs.
2. Spike: take a MIDI melody + chords, generate an electronic arrangement with the M3 generators,
   render, and let the owner say whether it is recognisable and whether it sounds good.
3. Spike: transcribe one isolated melody (a whistle) with an off-the-shelf model on the analyzer
   worker; measure note accuracy against a known score.
4. Then propose the milestone (`M6 · Rework`?) with the gate: recognisable in 8 of 10, coherent
   in a set, sounds good to the owner's ear.

## Candidate uses to explore

Each is a question the loop investigates with a research brief, a spike, or both, and then
proposes or drops. Order is a suggestion; evidence reorders.

| Id | Candidate | The question | First cheap step |
|---|---|---|---|
| C01 | **Background music for streams, venues, shops** — endless, licence-free, steerable | is "no licence, never repeats, follows the mood" a reason to switch from playlists? | brief: what streamers and venues pay for music today and what breaks (DMCA, repetition) |
| C02 | **DJ practice and set planning** — a partner that follows you, or a set you rehearse against | do DJs want an infinite crate in key and tempo to mix with? | brief + spike: MIDI clock / Ableton Link out from the set |
| C03 | **Soundtracks for games and apps** — the document as an adaptive music format | can a game drive `energy` and section changes in real time? | spike: a demo where a key press changes energy and the engine follows within a phrase |
| C04 | **Sound design and theory assistant** — "make me an acid bass", "explain this progression" | is the production door more valuable as a teacher than as a generator? | brief: how producers learn today; spike: explain a transform in words |
| C05 | **Radio-like stations** — a named, shareable set config ("my Sunday station") | does sharing a recipe (references + prompts + dwell) beat sharing audio? | spike: export/import a set recipe file |
| C06 | **Live performance instrument** — the loop as a bandmate on stage, with hardware controls | do performers want planned controls on a MIDI controller? | brief: what live coders and controllerists actually use |
| C07 | **Local files and DAW integration** — reference from a project, export stems back | is the DAW the real home of the production product? | brief: VST/AU host expectations; spike: stems export |
| C08 | **Other genres** — jazz, ambient, hip-hop, orchestral | where does synthesis stop and samples become mandatory? | research R16 + spike with a sampler |
| C09 | **Web or mobile companion** — control the set from a phone; a web demo | is a desktop-only app the right first surface? | brief: where the first audience listens |
| C10 | **Accessibility as a use** — music for people who cannot use a DAW | are planned controls and words a better instrument for some? | brief; interviews when there are users |
| C11 | **Rework of your own material** — a producer's demo, a hummed idea, a band's song, into electronic versions | is "rework mine" the licence-free door into B05, and a producer's daily tool? | spike 2 above with the owner's own melody |

## Assumptions of the first proposal, open to revision

| Assumption | Why it was made | What would change it |
|---|---|---|
| YouTube links as the first reference source | the fastest way to say "like this" | legal or technical fragility (yt-dlp); a file-first or catalogue-first flow may be better |
| Electron desktop first | Chromium Web Audio, local audio device, packaging | C09 evidence that people listen elsewhere |
| Electronic music first | synthesis carries it | C08 evidence that the first audience wants something else |
| Listener-first UI | the smallest path to music | producers turning out to be the real first audience (B03 traction) |
| The LLM plans; rules play | latency and cost | a model fast enough to plan every phrase, or rules good enough to need no LLM |

## How a bet moves

1. **Explore** (skill `/explore`): a brief from the `research-scout` on the use, a spike branch
   (≤ 2 days of loop work, `spike` label, never merged to `main` as product) when a question is
   technical, a design canvas when it is about a screen.
2. **Propose**: a `decision` issue with the bet, the evidence, the cost, what changes in `plan.md`
   and which current bets it competes with; the loop's recommendation; → `Decision needed`.
3. **Decide**: the owner. Accepted → a milestone or a requirement change by PR; declined → the
   row stays with the reason.
4. **Validate**: after shipping, the proof column is measured at each release; killed bets are
   kept with what we learned.
