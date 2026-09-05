---
name: start
description: Opens a board card the right way — entry gates, the area's memory, what the repo already solves, the solution design by the area's reviewer in design mode, branch and board move. TRIGGER when the user says to start/take a card ("let's do #12", "open the branch"), or as step 2 of /liminal. Also activates on /start.
---

# /start — what to do BEFORE the first line

`/review` and `/deliver` catch defects after they are written. This one catches them before.

```bash
uv run --directory tools python -m board.open 12 --search <term> <term>
```

Returns `verdict` (`CLEARED` · `CHECK` · `BLOCKED`), `barriers`, the whole card (`.md` spec +
issue + comments), the area's memory, and what the repo already has.

## 1 · Gates

🔴 **`BLOCKED` is not worked around**: `blocked` label + a comment with the barrier, and another card.

| Barrier | Why |
|---|---|
| card not on the board | off the board, off the queue |
| Status ≠ `Ready` (nor promotable `Specified`) | the order belongs to the board, not to me |
| the card's milestone closed, or not the oldest open one | milestones open through process §7 |
| `depends_on` with a card not `Done` | a dependency is a dependency |
| spec without the five sections, or a "done when" without "how it is proven" | a criterion without proof is a wish |
| open `question` label | the answer changes what gets built |

`CHECK` is where judgment lives: a pending item cited in the card's text has a **date**; the answer
may already be in a comment. Read before discarding.

## 2 · The area's memory

The script already brings `memory.rules` (the area's section), `memory.adrs` (those citing the
area) and `memory.measurements`. **Read them.** That is what avoids repeating a recorded mistake.

## 3 · What the repo ALREADY solves

`--search` answers on three levels: `dependencies` (an installed package matching the term),
`symbols` (a function/type exported in the monorepo), `precedents` (where the repo already does
something similar). ⚠️ No term is too obvious. Reimplementing what an installed library does is
the defect no gate catches afterwards.

## 4 · The architect — the head that does not know what I already decided

Launch the **area's reviewer in design mode** (process §5 table), in the background, with:

1. the whole spec — the problem, not my solution;
2. the result of §3 — what already exists;
3. the area's memory as criterion;
4. the non-negotiable constraints: package boundaries, ADRs, what is out of scope;
5. **a ban on writing code**;
6. **a required discarded alternative with the reason**.

The verdict is input. Whatever it proposes that changes shared behaviour or a screen outside the
spec becomes a `question`, not a decision.

## 4½ · UI cards: the design brief comes first

A card that adds or changes a screen runs the `ui-designer` before any code: it researches control
and layout references (with sources), and writes `docs/design/<card>.md` against
`docs/design/principles.md` — layout, components and states, tokens, motion, keyboard map. The
`usability-reviewer` reviews the brief. `design_review: true` in the frontmatter → the card waits in
`Blocked` for the owner's `design: ok`.

## 5 · What is decided now, and what is declared

Before the branch, in the chat, one screen: **the scope cut** (what is in, what is not, why) ·
**the open questions** (each already posted on the issue with options) · **what will be measured
on screen** and what only a unit test pins.

🔴 A screen change the spec does not show → `question`, even if technically right.

## 6 · Open

```bash
git switch main && git pull --ff-only
git switch -c feat/12-engine-plays-live
uv run --directory tools python -m board.move 12 "In progress"
```

⚠️ A dirty tree travels along; the script returns `dirtyTree`. A branch already citing the card
appears in `branchesCiting` — it may be parked work; check before opening another.

🔴 **The link goes both ways**: `#12` in the branch name and the PR; the PR on the card (the
description's `Closes #12` does that).
