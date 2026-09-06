# liminal — plan

> An endless, AI-generated set that makes sense. Steered by prompts and by a reference track.
> Plays on your machine, in a desktop app.

---

## In one sentence

**liminal is a platform for automated music production and live steering.** Two products on the
same primitives: **Production** — from a brief and a reference to a complete track as an editable
document, iterated with words, exported — and **Set** — the endless, steerable live set. The set
ships first because it exercises every primitive; production follows as soon as the generators exist.

You paste a YouTube link, type "melancholic techno, no vocals", press play — and the set plays
until you tell it to stop. With an arc, with keys that move, with ideas that come back. And it
answers what you ask mid-set: "bring it down", "bass back in", "more of this". Paste another link
while it plays and the set **travels** there — no cut, no jump — like a DJ working through a crate.

## Why this project, when others exist

The dominant pattern today is **MCP + Strudel**: the LLM writes patterns, the browser plays them.
Good for a jam. Not for this. Three gaps — and they are this product's requirements:

| Gap | Consequence |
|---|---|
| Music is not a **document** | there is no bar 37, no "drop the hi-hat in the second chorus", no history, no A/B |
| The LLM is **deaf** | it writes and never knows what came out; nobody measures the audio back |
| They **fight latency** instead of designing around it | the set depends on the LLM answering fast, and a set cannot depend on that |

liminal's thesis closes all three: **music is a versioned document, edits are pure functions,
and audio comes back as numbers.**

## A platform, not one track

The score document, the transforms, the generators, the style cards, the brains, the soundcheck and
the engine are **platform primitives**. Two products compose them:

| Product | What it does | Where it lands |
|---|---|---|
| **Production** (automated music production) | brief + reference → a complete track as a document → iterate with prompts ("more bass in the drop", "a jazzier lead") → render → export (wav now; MIDI and stems later). Works without the live engine: main process + hidden window, and a headless door for batch production | generators and export in M3; production UI in M5 |
| **Set** (live steering) | the endless set: reference queue with dwell times, handovers, live prompts, feedback, two clocks | M4 conductor, M5 booth |

The set ships first because it exercises every primitive and is what people will try first. Others
compose the same primitives later: a track editor with the document as file format, a plugin that
receives a score and plays it inside a DAW, new sources (local files, live input), new brains, new
engines (samples, SuperCollider). Every spec and every doc describes the whole in these terms —
nothing is written as if the set, or a single track, were the only thing.

---

## The requirements that define the product today

They are the accepted bets of [`docs/product/bets.md`](product/bets.md), written as gates. They
change when a bet is revised — by a decision of the owner, proposed by the loop with evidence
(process §18).

| # | Requirement | How we know it is done |
|---|---|---|
| 1 | **Endless set** | plays 60 min with no audio gap and no intervention; stopping is the only end. The engine reports zero bars without content |
| 2 | **Makes sense** | planned energy arc, followed; neighbouring keys between tracks (Camelot ±1 or relative); BPM moves at most 4 per track; a motif returns at least once every 20 min. All of it read from the set log |
| 3 | **Steered by prompt** | a standing prompt changes the target card; a live prompt lands at the next phrase boundary, within 8 bars — measured by timestamp |
| 4 | **Reference** | a YouTube link becomes a style card with BPM (±2) and key (exact or relative) right on 9 of 10 test tracks; the generated set stays within ±10% of the reference's band balance |
| 5 | **More of this / less of this** | feedback changes the next section: the named measure moves in the asked direction |
| 7 | **Automated production** | from a reference and a prompt, the platform produces a **complete track** as a document (intro, build, drop, break, outro — at least four sections), within ±10% of the reference's bands; a prompt edit ("more bass in the drop") changes the named measure in the named section and nothing else; the track exports as wav that `ffprobe` reads with the right duration (MIDI and stems later); the document round-trips through `stringify`/`parse` |
| 6 | **Reference queue and handover** | while playing, a new reference (YouTube now, a file later) joins a visible, reorderable queue, each entry with an **adjustable dwell time** (how long the set stays in that style before travelling on; default 10 min, editable inline); the set moves from the current style to the next within `HANDOVER_BARS`, with BPM inside the per-track budget, keys by neighbours only, and band balance reaching ±10% of the next card; analysis failure keeps the current target and says so. All read from the set log |

🔴 **The gate that applies to all: nothing requires a terminal.** The terminal is for developing.
The UI controls everything a person needs — the inventory is
[`docs/product/controls.md`](product/controls.md), and a milestone's UI is done when every control
that lands in it is on screen.

---

## 🔴 Principle 1 — the LLM is never in the audio path

The audio engine is deterministic, holds the beat with sample accuracy, and **asks nobody for
permission**. The LLM plans **one phrase ahead**. At 128 BPM, 16 bars are 30 seconds — plenty
for a model call.

If planning is late, the engine extends the current section with rule-based variation. If the
network drops, the set goes on — more predictable, but continuous.

**Silence is failure. Repetition is not.**

Conducting in three layers, each with its own clock:

| Layer | Time | Who decides |
|---|---|---|
| Engine | milliseconds | deterministic code |
| Local rules | seconds | code: variation, fills, builds, fallback |
| Brain (LLM) | tens of seconds | set arc, energy, when to turn, what comes next |

Full detail in [two-clocks.md](specs/cross-cutting/two-clocks.md).

## 🔴 Principle 2 — what the LLM cannot hear, it measures

The reference track is not "inspiration". It is a **numeric target**: BPM, key, energy curve,
spectral balance, rhythmic density, swing. We call it the style card.

Before a section plays, the engine renders it offline in a hidden window, measures it, and
compares it with the target. If it misses, discard and regenerate. **The mistake dies before it
reaches the speakers.** That is the soundcheck.

Detail in [style-card.md](specs/cross-cutting/style-card.md).

## 🔴 Principle 3 — music is a document

Sections, bars, tracks, notes, automation, mix — all in a schema'd, versioned document. "More
bass in the drop" is a diff. Every transformation is a pure function, and pure functions have
tests: `darken(score)` renders, measures the spectral centroid, and asserts it went down.

Detail in [score.md](specs/cross-cutting/score.md).

---

## Milestones

Every milestone has an observable gate. No milestone starts before the previous one passes.

| Milestone | Delivers | How we know it is done |
|---|---|---|
| **M0 · Foundation** | repo, monorepo, CI, board, project skills, agent instructions | CI green with one real test per package; `/queue` lists the board's cards; `/start #n` opens a card |
| **M1 · Sound** | score document + engine + app shell | the app opens, plays 16 bars of a fixed score, stops. The same score rendered offline twice yields identical bytes |
| **M2 · Ear** | analyzer: YouTube → style card; measure a wav | BPM and key right on 9 of 10 tracks; a score rendered by our own engine has its BPM and key recovered by the analyzer |
| **M3 · Composition** | generators and transforms from the card; the first **Production** door | "more bass" is a diff, and energy below 120 Hz rises in the measurement. A generated section lands within ±10% of the reference's bands. A **complete track** (≥ 4 sections) is generated from a card, edited by one prompt, and exported as a wav `ffprobe` reads |
| **M4 · Conducting** | conductor + brains: endless set, reference queue and handover, the listener's steering and shaping controls (energy, next, hold, tempo, filter, layers) | 60 min with no gap on the rules brain; then on the LLM. 10 s of injected brain latency produces no gap. A live prompt lands in ≤ 8 bars. A second reference queued mid-set is reached within `HANDOVER_BARS` with no budget broken |
| **M5 · Booth** | the rich UI | every row of `controls.md` that lands in M1–M5 is on screen: timeline, energy curve, references and queue, prompts and feedback, cue, record and keep, settings — all without a terminal |

Then, in this likely order: samples and soundfonts (genre reach), stems via Demucs, local mp3,
set recording and export, remote control from a phone.

---

## Declared risks

| Risk | What we do |
|---|---|
| **yt-dlp breaks** with YouTube's changes (PO token) | `bgutil-ytdlp-pot-provider` plugin, local cache of downloaded audio, and the source is abstracted from day one — a local mp3 is the same interface |
| **Key and chords are approximate** | every measure carries confidence; the user confirms on screen; test fixtures are scores rendered by our own engine, with known BPM and key |
| **Chromium and `node-web-audio-api` are not bit-identical** | determinism is per implementation. The soundcheck uses the same Chromium as playback; headless Node tests prove logic, not bytes |
| **Synthesis alone does not reach every genre** | sax, piano and strings need samples. After M5, and the style card is born with that in mind |
| **LLM cost and latency** | persistent session (measured on another project: 10 s → 2 s per decision); rules brain as baseline and fallback; planning horizon |
| **Native module in Electron** | avoided: audio plays in the renderer. `node-web-audio-api` only in tests, in plain Node |
| **Packaging and signing the app** | M5 only. Until then, `electron-vite dev` |

## Out of scope, and why

- **Reproducing the reference's audio.** Only measurements come in; none of the original audio
  goes into the set.
- **VST, MIDI out, hardware.** Later. The architecture keeps the door open, but none of it is
  on the path of the five requirements.
- **Multi-user, cloud, accounts.** It is a local app.
