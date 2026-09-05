---
name: research
description: Runs a research iteration — investigates a topic from docs/research/topics.md on the web (musical styles, production, theory, trends, how AI is used in music, tooling), writes a dated brief with sources, and turns implications into idea issues. TRIGGER when the user asks to research something, when nothing on the board is workable, at every milestone close, or as step R of /liminal. Also activates on /research.
---

# /research — learn something the product can use, and leave it written

The loop must never idle and must keep an eye on what brings value. Research is how. It **never
touches code**; it produces a brief and ideas.

## 0 · Rate limit and choice of topic

- At most **one research iteration per hour** when nothing else is workable; otherwise the wake-up
  ends in one line. Every 10 card iterations, one research iteration regardless.
- The topic comes from `docs/research/topics.md`: first an `open` topic the current or next
  milestone cites; then the `refresh` topic with the oldest date; then a `research` issue from the
  owner. Electronic music first; other genres after M5, unless the owner asks.

## 1 · Investigate

Use the `research-scout` agent (it has web search and fetch) with the topic, the question the
product needs answered, and the constraints: cite sources with dates; separate **what the source
says** from **what we infer**; prefer primary sources (papers, docs, repos, interviews) over
listicles; note the recency of everything.

## 2 · Write the brief

`docs/research/YYYY-MM-DD-<slug>.md`:

```yaml
---
topic: <topics.md id>
question: <what the product needed to know>
sources: [<url>, …]
confidence: high | medium | low
refresh_by: <date>
---
```

Sections: **What we asked** · **What the sources say** (with citations) · **What it means for
liminal** (concrete: a parameter, a preset, a generator rule, a UI pattern, a risk) · **Ideas**
(one line each) · **What we did not find**.

Rules: never name a person as source of a decision; no copied text beyond short quotes with
attribution; English; measured × assumed marked.

## 3 · Turn implications into work

- Each idea worth pursuing → an issue labelled `idea` + `research`, linking the brief, one line of
  value hypothesis. It enters the next spec or planning iteration.
- A finding that changes a decision → not a change, a `question` for the owner citing the ADR.
- A number worth keeping (e.g. typical BPM ranges per subgenre, swing values) → `docs/memory/measurements.md`
  with the source as method.

## 4 · Close

Update `docs/research/topics.md` (status, date, `refresh_by`), `docs/research/README.md` index, one
line in `docs/journal.md`. PR `docs/research-<slug>`, merges by itself (docs only). One line in the
chat: what was learned, what became an idea.
