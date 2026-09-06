# Completeness heuristics

> What a person expects from a surface of a given kind, whether or not anyone asked. The loop
> checks these in every discovery iteration (process §17) and every UI review; a gap the owner
> has to point out is a process failure, and its **class** is added here so it is never missed
> again. Each row: the kind of surface, what must exist, and the first gap that taught us.

| Surface kind | A person expects | Taught by |
|---|---|---|
| **Anything that makes sound** | volume, mute, which device, a safe start level, keyboard for all three | 2026-09-06: the plan had no volume control until the owner asked |
| **Anything that plays over time** | play, pause, stop, where we are, what comes next and when, elapsed | — |
| **Anything that takes a while** (analysis, render, download, LLM call) | progress, an estimate, cancel, and an explicit error with retry | — |
| **Any list** (queue, references, versions) | reorder, remove, an empty state that explains, a way to add | — |
| **Any value the system chooses for you** (energy, key, tempo, dwell) | see it, override it, and see when the override lands | — |
| **Any decision the system makes** (a plan, a transition, a rejection) | a "why?" in the user's words | — |
| **Any text input** (prompt, brief) | history, undo, what will happen and when | — |
| **Any state that persists** (volume, device, theme, queue) | it is remembered, and the first run has a sane default | — |
| **Any error** | what happened, what to do, in the user's words, never silent | — |
| **Any screen** | keyboard path, visible focus, no information by colour alone, a first state that shows the product | — |
| **Any output you would want to keep** (a set, a section, a track) | record, keep, save, export, open again | — |
| **Any comparison the product makes** (target vs measured) | shown as numbers a person can read, with ok/warn | — |
| **Settings** | one place, grouped, nothing hidden elsewhere, defaults stated | — |

## How a row is used

- The `usability-reviewer` walks a screen against every row whose kind matches, and its report
  has a mandatory section **Expected but missing** — even when the screen is polished.
- The `ui-designer` designs against the rows before drawing; a brief that omits a row says why.
- A discovery iteration (process §17) walks the whole app against the table and the scenarios in
  [`scenarios.md`](scenarios.md), and turns gaps into `idea` issues.
- A gap the owner points out → a new row or a sharpened one, in the same PR that fixes the gap.
