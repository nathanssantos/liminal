# Product strategy

> liminal is open source and run like a company: it decides what to build from what people will
> try, keep and talk about — and measures it. This file is the compass the planning iteration and
> the `product-strategist` read. It changes by PR, with a reason.

## The platform frame

liminal is a platform; the endless set is product one. Strategy weighs every proposal on two
axes: **does it make the set better for the first audience now**, and **does it strengthen a
primitive others will build on** (document, transforms, generators, style cards, brains, engine).
A proposal that does neither waits. Course decisions — a new product on the platform, a new
audience, a new dependency with cost or licence — are the owner's (process §15).

## Who it is for, first

| Audience | What they want | What wins them | What loses them |
|---|---|---|---|
| **The listener who wants a set for right now** — working, driving, a party at home | press play, hear something good that does not stop, nudge it with words | one paste + one prompt + play; a set that surprises without derailing | silence, a glitch, a set that ignores the prompt |
| **The producer or DJ curious about generative tools** | control, inspection, the ability to say "why did it do that" | the document (diffable music), the soundcheck numbers, the set log, transforms with claims | a black box, no export, no MIDI |
| **The developer who wants to hack on it** (open source) | a clean codebase, a clear process, a way in | specs, ADRs, the loop, English everywhere, small packages | a bot-only repo with no human-friendly path |

The first audience decides the first screen. The second decides the architecture we already
chose. The third decides the repo's hygiene.

## Positioning

**What it is:** an endless, coherent set, steered by words and a reference, that plays on your
machine.

**Against what exists:**

| They | We |
|---|---|
| LLM writes Strudel patterns for a jam (MCP servers, live-coding chat apps) | music is a **document**: bar 37 exists, edits are diffs, a set is a sequence of documents |
| generative music apps (mood → stream) | the **reference** as numeric target and the **soundcheck**: what the LLM cannot hear, it measures |
| DJ software (mix existing tracks) | nothing to mix: every transition is generated in key and in tempo, by construction |

**Where we lose today, and say so:** timbre and genre reach (synthesis only until samples arrive
after M5); no export or MIDI yet; no packaging until M5.

## Domain focus

Electronic music first — techno, house, trance, ambient, drum and bass, dubstep and their
subgenres — because synthesis carries it, the reference analysis is reliable on it, and it is
where generative sets are already welcome. Other genres after M5, when samples and soundfonts
arrive. The research agenda (`docs/research/topics.md`) follows this order.

## Value hypotheses (to be proven, each with a signal)

| If we build | users can | we will see |
|---|---|---|
| paste a link → style card → set in that style (M2–M4) | get "something like this, forever" in under a minute | time from open to music ≤ 60 s in the usability walk; band match ±10% in the set log |
| live prompts landing at the next phrase (M4) | steer without breaking the flow | `prompt.applied − prompt.received ≤ 8 bars` in ≥ 95% of prompts |
| "more of this / less of this" (M4) | teach their taste in a session | the preference vector moves the measured feature in the asked direction |
| the set timeline and the card on screen (M5) | understand and trust what is happening | zero "why did it do that" without an answer on screen, in the usability walk |
| export a set or a section (after M5) | keep and share what they heard | exports per set; shares |

## How we measure (in order of availability)

1. **Requirement metrics** from the set log (plan requirements 1–5). Available from M4.
2. **Usability findings**: action count from open to music; blocking findings per release.
3. **Repo signals**: stars, forks, issues opened by others, discussions — dated, reported by the
   `open-source-steward` at each release. Read as trends, never inflated.
4. **Later**: downloads per release, retention proxies (sets longer than 20 min), opt-in telemetry
   only if the owner decides it, with an ADR.

## What we do not do

- Chase every trend the research finds. A trend enters as an `idea`; the planning iteration weighs
  it against the five requirements.
- Invent requirements. They come from the owner (chat, `idea`) or from users through issues.
- Ship without listening. `listening` criteria stay human.
