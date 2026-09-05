# ADR-0006 · The markdown spec is the source; the issue is a mirror

**Status:** accepted · 2026-09-05

## Context
The process is SDD with an autonomous loop. Cards need verifiable "done when", history and
review — things git gives and an issue does not.

## Decision
Every card is `docs/specs/<milestone>/<id>.md` with frontmatter. `tools/board/sync` creates and
updates the issue and the board card from the `.md`, and writes the issue number into the
frontmatter. Human edits on GitHub are pulled back into the `.md`. Editing only the issue and
expecting it to stick is a deviation.

## Alternatives discarded
- **Issue as source** — no review, no diff, no stable link with the code.
- **No sync, only hand-written issues** — the loop would have no way to derive status or prove
  the spec and the card say the same thing.

## Consequences
- Changing a criterion is a docs PR (or an issue edit that becomes one).
- The sync runs in CI on every merge touching `docs/specs`.
- Needs the `project` scope on the `gh` token.
