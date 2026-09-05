---
name: deliver
description: Closes a card's delivery — gates without truncated output, safe rebase, verified push, PR with description and evidence, link to the card, merge by the process policy. TRIGGER when the user asks to deliver, open a PR, push the branch, or as steps 5–6 of /liminal. Also activates on /deliver.
---

# /deliver — from a ready branch to a merged PR

Fixed order. Every step exists because of a mistake made; **none is skipped because "it is simple"**.

## 0 · Does this become a PR now?

🔴 **Nothing is delivered without a card.** Branch and commits cite `#n`; otherwise the script blocks.
🔴 **Without `/review` first, no.** Gates run commands; they do not read code.

## 1 · Gates

```bash
uv run --directory tools python -m board.deliver --gates-only
```

Runs `pnpm check` at the root and the sweep the linter does not do, returning `verdict: READY |
BLOCKED` (exit code 2 on failure):

- 🔴 **full output, never truncated** — `| tail` once hid a `Found 1 error` and zeroed the exit code;
- 🔴 **a lint warning does not fail the command** — the gate runs Biome with `--error-on-warnings`;
- **new comment in the diff** outside the house exceptions;
- **`MOCK:`** in the diff;
- **dirty tree** — the sweep compares `origin/main...HEAD`, between commits;
- **evidence per criterion**: every "done when" of the spec appears in the description with proof;
- **touched the renderer without a screenshot** in `evidence/<id>/` → blocks.

## 2 · Safe rebase and push

```bash
uv run --directory tools python -m board.deliver --rebase-only
```

🔴 **`git rebase` silently drops commits** (default `--no-reapply-cherry-picks` since 2.34). The
script uses `--reapply-cherry-picks` and checks four things: commit count before × after;
`rev-list --count HEAD..origin/main` = 0; diff files before × after; one symbol of the delivery in
`git grep`. Aborts if any fails.

Push with `--force-with-lease`, **without silencing the output**, and compares `local` × `remote`.
🔴 **Never becomes `--force`**: a refused push is `git log -1 --format=%an origin/<branch>` first
(who committed?), then `reset --hard origin/<branch>` and rebase from there.

⚠️ Rebase only when **needed**: conflict, about to merge, or depends on what landed. Behind `main`
is not a reason.

## 3 · Title and description

Title in Conventional Commits, English, imperative, ≤ 72. Description with the three sections of
process §3.5 and `Closes #n` (PR → card link).

🔴 **The description says WHAT WAS DONE.** Out: validation method, diagnosis, neighbouring defect.
The test: a sentence explaining *why I did it this way* or *how I found out* gets cut.

🔴 **Never name a person.** Before publishing, re-read hunting for proper names and attribution verbs.

🔴 **The description ages with every round of fixes.** At the end of each:
`board.deliver --stale-description` lists the backticked symbols that no longer exist and the
criteria whose evidence vanished. An entry with no diff against `main` **leaves** the description.

## 4 · Evidence and screenshots

Criterion × proof × evidence table. A screenshot enters **only when the image contains the fact**:
a visible, static state. A sequence is proven by a named test, not by two screenshots. A visual
tweak carries **before and after**. The screenshot frames the component; **never someone else's
data**; no method caption. Screenshots live in `evidence/<id>/` and go into the repo — they are
small and they are the proof.

## 5 · Open

```bash
uv run --directory tools python -m board.deliver --open --title "feat(engine): play the score live" --description /tmp/desc.md [--dry-run]
```

Creates the PR as a **draft**, with the repo template, and moves the card to `In review`. Marks it
ready (`--ready`) when the gates and `/review` closed — inside `/liminal`, the loop itself marks it;
outside, the owner does.

## 6 · Merge

```bash
uv run --directory tools python -m board.deliver --merge 34
```

Only when **all** hold (process §3.6): green CI · zero blocking finding · every piece of evidence
present · no `listening` pending · no open human thread. Squash, delete the branch, card → `Done`.
Missing any, the script says **which** and does not merge.

🔴 **A human thread is answered with approval**: draft in the chat → wait → post. Applies to
answering and to resolving.

## 7 · Close

`docs/journal.md`, memory (rule/ADR/measurement) and spec — **in the same PR**, before the merge.
