---
name: review
description: Reviews my own change BEFORE delivering — what always comes back from someone else's review — with the project's per-area reviewers and the machine's, edge cases, coverage per layer, reading the diff, and what only the screen proves. TRIGGER when the feature is ready, before /deliver, or AFTER a round of review fixes. Also activates on /review.
---

# /review — the review I would do if the code were someone else's

🔴 **The question that organises everything: what would a reviewer point out?** Gates run
commands; they do not read code. Every finding becomes a **commit before publishing**, never a
thread answer afterwards.

⚠️ **Commit before starting.** Half the checks touch git. `reset --hard` takes what is not
committed, with no reflog.

## 0 · What a machine can read

```bash
uv run --directory tools python -m board.check --area packages/engine
```

`newComments` (outside the house exceptions) · `deadMocks` (an injected mock no case reaches) ·
`deadBranches` (a `case`/`if` nobody dispatches) · `outOfArea` (a file that is not the card's — a
question, not a verdict) · `testsWithoutCriterion` (a new test whose name cites no "done when") ·
`dirtyTree` (invalidates the read; commit).

## 0b · Independent reviewers — the part I cannot do alone

🔴 **Re-reading my own code is exactly what already failed.** Another head reading the diff
without my context is what changes the result.

🔴 **WHILE THE REVIEWERS RUN, DO NOT TOUCH GIT.** They read the shared tree.

Launch in parallel, in the background, per the process §5 table: always `spec-reviewer`,
`code-quality-reviewer`, `security-auditor`, `test-engineer`; the area's by touched path; the UI
ones (including `usability-reviewer`) when the renderer changed. **List `.claude/agents/` before
choosing** — the repo's agent finds the convention defect; the machine's, the category defect.

⭐ **The prompt decides the quality of the finding:**

1. say the delivery already went through review (if it did) and what was pointed out — and order
   it **not to trust** it is fixed;
2. give the diff command: `git diff origin/main...HEAD`, and the paths;
3. give the card's spec and the area's memory as criterion;
4. give the environment: how to start the app, how to reach the state, and ⚠️ no full-screen
   screenshots;
5. **forbid changing code**;
6. **require it to say where it found NOTHING.**

⚠️ **Their verdict is input.** A serious finding is checked by measuring before it becomes a fix;
what I cannot confirm, I say I did not confirm.

## 1 · Was the card fulfilled WHOLE?

Re-read the spec item by item. What was not done is **declared**, not omitted. Scope both ways:
did something the card does not ask for get in? Was something it asks left out? Exclusion is read
in "Out of scope", not inferred.

## 2 · Edge cases — "what happens AFTERWARDS?"

1. **What if it fails?** What stays on screen; can it be retried?
2. **What if it happens twice?** Three forms: two clicks in the same tick; A→B→A; do → undo → do.
   🔴 A re-entrancy guard is a synchronous `ref`, never state.
3. **What if it arrives out of order, or never?** Stale response; a late callback from another session.
4. **What if it comes big, empty, null?** A score without clips; a card without swing; a wav of silence.
5. **And by keyboard?**
6. **Does the new state have a scope?** Read the neighbours in the same store.
7. **What am I sending along?** Payload, log, telemetry — never someone else's data.

**Two more for this project:** **what if the brain is late?** (nothing `await`ed in the audio
path) and **what if it runs twice?** (same input, same document, same bytes).

## 3 · Coverage per LAYER

One rule, one test — in the layer where it lives (document × engine × conductor × IPC × screen).
🔴 **Run every new test WITHOUT the fix and watch it fail.** Worth testing what breaks silently:
invariant, guard, branch, contract, concurrency, determinism. Not worth it: what type-check
guarantees, `className`, third-party libraries, typos.

## 4 · Read my own diff as someone else's

- 🔴 a name that stopped describing the value; an opaque abbreviation;
- 🔴 a comment — outside the exceptions, it leaves; the information goes to the name, the test, the PR, the memory;
- dead branch; a repeated literal asking for a `const`; `Math.random`, `Date.now` in pure code;
- an import outside the boundaries table (the test catches it, but read first);
- what the change **creates** that nobody asked for: global state, an extra request, an audio node that stays.

## 5 · What only the screen proves

🔴 **Touched the renderer → open the app.** Compare with the design brief in `docs/design/<card>.md`:
layout, states, tokens, motion, keyboard — deviations are findings, not taste. Playwright over CDP to use and measure; `shot <state>`
per state and width (process §3.4). Lint, types and tests pass with the screen broken. A screenshot
without measurements proves appearance, not alignment. Never someone else's data in a screenshot.

## 6 · Close

Every finding: its own commit, or a `question`, or discarded with the reason written in the chat.
Then `/deliver`.
