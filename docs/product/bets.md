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
