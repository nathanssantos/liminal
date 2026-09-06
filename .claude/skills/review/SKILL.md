---
name: review
description: Reviews my own change BEFORE delivering — in two passes: a fast read every round (diff, spec, memory; minutes) and one deep measuring pass at the end (renders, instruments, reverts fixes to see tests fail; bounded) — on a prepared worktree pinned to the reviewed commit, incrementally after the first round, with a time budget per agent. TRIGGER when the feature is ready, before /deliver, or AFTER a round of review fixes. Also activates on /review.
---

# /review — the review someone else would do, at a cost the loop can afford

🔴 **The value is in the measurement; the cost was in repeating it.** Measured on M1-02
(`docs/memory/measurements.md`): a deep reviewer took 25.8 min and 51 tool calls per round, the
test engineer 52 min, and the card went through five rounds. The fix is not less measurement — it
is measuring **once**, on a **prepared** worktree, and reading **only what changed** after that.

⚠️ **Commit before starting.** Reviewers work on a pinned commit; what is not committed is not
reviewed.

## 0 · Prepare once per round

```bash
uv run --directory tools python -m board.review --prepare
```

Creates (or refreshes) **one** detached worktree at the current HEAD under
`/tmp/liminal-review/<pr-or-branch>/<sha>/`, runs `pnpm install` there **once** (offline from the
store when possible), records `evidence/<id>/review.json` (`round`, `head`, `reviewedHead`,
`findings[]` with status) and prints `reviewPath`. Every agent receives that path and works
**there**, never in the loop's working copy — so the branch can be rebased or pushed while they
run, and two agents never share a tree (each one that needs to edit or revert makes its own
throwaway copy with `board.review --scratch`, which links `node_modules` instead of installing).

`board.check --area <path>` runs here too: `newComments`, `deadMocks`, `deadBranches`,
`outOfArea`, `testsWithoutCriterion`.

## 1 · Fast pass — every round, in parallel, `mode: read`

The reviewers of the touched areas (process §5) plus `spec-reviewer`, `code-quality-reviewer`,
`security-auditor`, `docs-reviewer` — all in **read mode**: the diff, the spec, the area's
memory, the tests as text. **No install, no build, no render, no long test run.** Budget: **10
minutes** each; at the budget they report what they checked and what they did not.

**Incremental after round 1.** Each agent receives `review.json`: the findings it raised, the
fixes since `reviewedHead`, and `git diff <reviewedHead>...HEAD`. It verifies its own findings
are fixed (without trusting the fix), reads only the new diff, and re-runs nothing it already
measured unless the new diff touches it.

Blocking → fix → re-run **only the agents that found it**, in read mode. Three rounds without
convergence → `Blocked` (process §3.4½).

## 2 · Deep pass — once, when the fast pass is clean, `mode: measure`

The area's reviewer(s) and the project `test-engineer`, on the prepared worktree, with the
**measurement recipes** from `docs/memory/rules.md › review` (what to run, on which fixture, for
how long). This is where a test is reverted to see it fail, audio is rendered and measured, a
node count is checked, a screen is opened. Budget: **30 minutes** each; partial results with
"not measured: …" beat silence. In parallel across areas; never two of the same area at once.

A finding here → fix → the deep agent re-measures **only what the fix touches**; the fast pass
re-reads the new diff once. A deep finding that changes the design goes back to a fast round.

## 3 · The rest of the review, unchanged

- **Was the card fulfilled whole?** Spec item by item; what is not done is declared.
- **Edge cases** — what if it fails, happens twice, arrives late or never, comes empty; keyboard;
  state scope; what is sent along; and, here, *what if the brain is late* and *what if it runs
  twice*.
- **Coverage per layer** — one rule, one test, where it lives; a new test is run without the fix
  in the **deep** pass, not in every round.
- **Read the diff as someone else's** — names, comments, dead branches, `Math.random`, imports
  across boundaries, what the change creates unasked.
- **What only the screen proves** — the deep pass opens the app when the renderer changed,
  against the design brief.

## 4 · Close

Every finding: a commit, a `question`, or a written discard. `review.json` marks the round done
with the `reviewedHead`. Then `/deliver` — whose gate reads `review.json`: no merge with a
blocking finding open, and no merge without the deep pass on the final head (or on a head whose
diff to the final one touched nothing the deep pass measured).

## The prompt to a reviewer — what makes it fast and useful

1. `mode: read` or `mode: measure`, the **budget**, the `reviewPath`, and the rule "work there".
2. The diff command — full on round 1, `<reviewedHead>...HEAD` after — and the paths.
3. The spec, the area's memory and the **recipes** as criteria.
4. In incremental rounds: its previous findings, and "verify the fix; do not trust it".
5. Forbid changing code (the `test-engineer` writes tests only, in its scratch copy).
6. Require "where I found nothing" and "what I did not check within the budget".
