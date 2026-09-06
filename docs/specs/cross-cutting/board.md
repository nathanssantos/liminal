# The board scripts (`tools/board`)

> What the project skills call. Python, the `board` package of the `uv` project in `tools/`.
> GitHub only, this repo only. **Zero configuration and zero tokens**: the repo comes from the
> `git remote`, the board project is found by a title equal to the repo name, fields and options
> are resolved by name on every run, and every call goes through the authenticated `gh`
> (`gh api`, `gh api graphql`). Implemented in M0-06 (`sync`) and M0-07 (the rest).

## Modules and contracts

| Module | Call | Returns (JSON) |
|---|---|---|
| `board.queue` | `[--only prs\|board\|inbox\|git]` | `board.blocked[]` · `board.decisionsNeeded[]` (the loop must stop while non-empty) · `prs.mine[]` (`number`, `title`, `branch`, `draft`, `ci`, `failedChecks[]`, `conflicts`, `behindMain`, `openThreads[]`, `listeningPending`, `heardOk`, `cardsDelivered[]`) · `board.ready[]` (ordered by the §3.1 rule) · `board.promotable[]` · `board.cardsToMove[]` · `board.openMilestone` · `inbox` (§ below) · `git` (`dirtyTree`, `branch`, `behindMain`, `mergedBranches[]`, `branchesCiting{}`) |
| `board.open` | `<nº> [--search term…]` | `verdict` (`CLEARED`\|`CHECK`\|`BLOCKED`) · `barriers[]` · `card` (frontmatter + sections + issue + comments) · `memory` (`rules`, `adrs[]`, `measurements`) · `repoAlreadyHas` (`dependencies[]`, `symbols[]`, `precedents[]`) · `suggestedBranch` · `dirtyTree` · `branchesCiting[]` |
| `board.move` | `<nº> "<Status>" [--reason file.md]` | `{ from, to, by: "loop" }`; refuses to demote a Status marked `statusBy: human`. Moving to `Blocked` or `Decision needed` requires `--reason` (posted as the last comment) and records `sync.previousStatus`; `board.move <nº> --unblock` returns the card to it |
| `board.comment` | `<nº> --file text.md [--label question]` | `{ url }`; **only inside `/liminal` or with approval said in the chat** |
| `board.check` | `--area <path>` | `newComments[]` · `deadMocks[]` · `deadBranches[]` · `outOfArea[]` · `testsWithoutCriterion[]` · `dirtyTree` |
| `board.deliver` | `--gates-only` \| `--rebase-only` \| `--open --title --description [--dry-run]` \| `--ready <pr>` \| `--merge <pr>` (reads `review.json`: refuses with an open blocking finding or without the deep pass on the final head) \| `--stale-description` \| `--stale-docs` | `verdict` and each gate's detail; never truncates command output (saves it to `evidence/_gates/<date>.log` and cites the path) |
| `board.review` | `--prepare` \| `--scratch` \| `--state` \| `--round-done` | `--prepare`: one detached worktree at HEAD under `/tmp/liminal-review/<branch>/<sha>/` with `pnpm install` done (from the store, offline when possible), reused across agents and rounds while the head is the same; returns `reviewPath`, `head`, `reviewedHead`, `round`. `--scratch`: a throwaway copy of the prepared tree (links `node_modules`) for an agent that edits or reverts; returns its path. `--state`: `evidence/<id>/review.json` — `round`, `head`, `reviewedHead`, `deepPassHead`, `findings[]` (`agent`, `severity`, `file`, `line`, `summary`, `status`: open/fixed/discarded, `round`). `--round-done`: records the reviewed head and, with `--deep`, the deep pass head |
| `board.sync` | `[--dry-run] [--only M1]` | `created[]` · `updated[]` · `pulled[]` (GitHub → md) · `skeletons[]` · `movedByHuman[]` · `newComments[]` · `closed[]` (issues closed because their card is `Done`) |

## Status and issue state agree

A card whose Status is `Done` has a **closed** issue: the merge closes it through `Closes #n`, and
the sync closes any that was left open (`closed[]`), with a comment naming the merge or commit. The
reverse is reported, not fixed: a closed issue whose card is not `Done` appears in
`board.queue › cardsToMove`, because closing an issue by hand is a human signal (§11) and the
loop decides what it means.

## `inbox` — what changed by human hand

Watermark in `.claude/local-state.json` (not versioned): last run and, per issue, the body hash
the sync wrote. Human = any author other than the account running the loop **or** any change
without a matching `sync:`.

| Field | Lists |
|---|---|
| `editedIssues[]` | body/title ≠ stored hash |
| `movedCards[]` | Status changed without the loop moving it (no `by: loop` in the mark) |
| `questionAnswers[]` | new comment on an issue labelled `question` |
| `heardOk[]` | comment `heard: ok` on a PR of mine |
| `newIssues[]` | created since the mark, with labels |
| `closedMilestones[]` | `milestone` issue or milestone closed by a human |
| `unblocked[]` | cards a human moved out of `Blocked` or `Decision needed`, with the last comment as the answer |
| `chat` | — (chat does not pass through here; `/liminal` reads it directly) |

## Rules for every module

- A network or auth failure becomes `{"error": "<gh message>"}` under that key; the others go on.
- No module truncates command output; what is long goes to a file and the path goes in the JSON.
- No module writes a token, an e-mail or a person's name into a versioned file.
- `--dry-run` exists on everything that writes to GitHub.
- Tests with recorded `gh` responses (JSON fixtures), no network; `ruff`, `mypy --strict`.

## `--stale-docs` — what the machine checks in the documentation

Backticked symbols and paths cited in `docs/**`, `README.md`, `AGENTS.md`, `CLAUDE.md` that no
longer exist in the tree · commands in `AGENTS.md › Commands` absent from `package.json` scripts or
`pyproject` · the architecture package table versus real `@liminal/*` dependencies · broken
relative links · specs whose `issue:` does not match GitHub · `CHANGELOG.md` without an entry when
the diff touches `apps/` or `packages/`. Output: `staleDocs[]` with file, line and what is stale.
Blocking in `--gates-only`.
