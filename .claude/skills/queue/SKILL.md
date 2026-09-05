---
name: queue
description: Scans the state of work on this repo's GitHub — board (Projects v2), issues, my PRs with threads and CI, human input since the last iteration, and local git. TRIGGER when the user asks to update the queue, check the PRs, see what there is to do, or as step 0/1 of /liminal. Also activates on /queue.
---

# /queue — what is in flight, what you asked, what comes next

GitHub only, this repo only. No token in code: the scripts use the authenticated `gh`.

```bash
uv run --directory tools python -m board.queue            # everything, as JSON
uv run --directory tools python -m board.queue --only prs # prs | board | inbox | git
```

Output contract in `docs/specs/cross-cutting/board.md`. Everything in parallel, ~5 s. A source
that fails becomes `{"error": …}` and does **not** bring the others down — report the failed
source, never pretend it is empty.

## 1 · Human inbox — read before anything else

`inbox` lists what changed by human hand since the last iteration (watermark in
`.claude/local-state.json`, not versioned):

| Entry | Meaning |
|---|---|
| issue body/title differs from the `.md` hash | the spec changed there; the sync pulls it (`board.sync`) |
| card moved by a human | new order; respect it, never undo |
| new comment on a `question` issue | an answer: remove the label, the card returns to the queue |
| `heard: ok` comment on a PR of mine | releases the merge |
| new issue with `idea`, `research` or no label | a product request, a research request, or a hand-made card |
| `milestone` issue closed by a human | veto or completion |

🔴 **A comment deserves reading, not counting.** Business rules and answers to doubts live there.

## 2 · In flight — close before opening a new front

For every PR in `prs.mine`:

| Signal | What to do |
|---|---|
| `openThreads` not empty | read each one. 🔴 Fixing a review finding is delivering again: run the whole `/review` afterwards |
| `ci` ≠ `success` | read `failedChecks`; empty = nothing to do; not empty = a problem, and the job name is there |
| `conflicts: true` | rebase via `/deliver --rebase-only` |
| `listeningPending: true` and `heardOk: true` | merge now (`/liminal` §0.3) |
| `behindMain: N` | **information only**. Rebase is not routine: only on conflict, when merging, or when it depends on what landed |

🔴 **A rebase rewrites every commit** and invalidates the reviewer's "compare with the previous version".

## 3 · The board — the queue comes from it, and nothing else

`board.ready` comes filtered and ordered by the process §3.1 rule: `Ready` · no `blocked` · no
`question` · oldest open milestone · `depends_on` in `Done` · priority · id. `board.promotable` are
the `Specified` with dependencies done. `board.cardsToMove` crosses Status with the PRs' real state
and says where each card should be — **moving is the queue's job** (`board.move <nº> <status>`); a
wrong board misinforms.

🔴 **A `Done` card with an open PR is the worst case** and enters the count; do not filter by status
before judging status.

## 4 · Local git

`git.dirtyTree`, `git.branch`, `git.behindMain`, `git.mergedBranches` (by patch-id, `git cherry` —
ancestry never proves a merge when the merge is a squash).

## 5 · Report

One screen: **human inbox** · **PRs in flight and what each asks** · **cards to move** · **the next
card** (or "no card: spec / close milestone / plan / research"). A raw list is worse than not running.
