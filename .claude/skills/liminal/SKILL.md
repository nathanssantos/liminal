---
name: liminal
description: One iteration of liminal's autonomous loop — reads human input, picks a card from the board, opens, implements, proves, reviews, delivers, merges, closes and starts the next. When there is no card, it writes specs, closes/opens milestones, plans, releases, or researches — it never idles. TRIGGER when the user says "iteration", "run the loop", "take the next card", "continue development", or under /loop 3m /liminal. Also activates on /liminal.
---

# /liminal — one iteration of the loop

The law is `docs/process.md`. This skill is the **execution order**; where they diverge, the process
wins and this skill gets fixed.

🔴 **One iteration = one card.** Or a spec, planning, release or research iteration. Never two cards.
🔴 **Never end the turn without the next iteration started** — or without the stop report.
🔴 **Never undo a human action on GitHub.** If it contradicts the spec, the spec changes.
🔴 **Everything written in the repo and on GitHub in English.** The chat language is the owner's local preference in `CLAUDE.local.md`.

---

## 0 · Gates (process §3.0)

```bash
uv run --directory tools python -m board.queue            # board, PRs, human inbox, git
uv run --directory tools python -m board.sync --dry-run   # GitHub → md divergences
```

Read, in this order, and **turn the iteration** if any asks for it:

1. **Chat.** A message from the owner since the last iteration? It outranks everything: "stop"
   stops; "prioritise #n" is the card; "change X" becomes a spec edit (docs PR) before any code.
2. **Sync reported divergence** (issue edited, created by hand, card moved)? Run the sync without
   `--dry-run`; the `docs/sync-<nº>` PR merges by itself. Read what changed.
3. **A PR of mine waiting only on `listening`** with a new `heard: ok` comment? Merge (§6) now.
4. **A human thread unanswered** on a PR of mine? That is the iteration: draft in the chat →
   approval → answer → fix → full `/review` → continue from §5.
5. **Red CI on `main`?** That is the iteration. Second in a row → stop (§4).
6. Clean tree; `git fetch && git status -sb` without divergence; `pnpm check` and
   `echo '{"cmd":"ping"}' | uv run --directory tools python -m analyzer` answer.

## 1 · Choose (§3.1)

From `/queue` (`board.ready`, already ordered): `Ready` · no `blocked` · no `question` · oldest
open milestone · every `depends_on` `Done` · highest priority · lowest id. **One.**

| If there is no… | Then |
|---|---|
| `Ready`, but there is `Specified` with dependencies done | promote to `Ready` and take it |
| that either, but there is `Backlog` in the milestone | **spec iteration** (§9; skill `/spec`) — step S |
| any card left to do in the milestone | **release + close the milestone and open the next** (§7, §14; skill `/release`) — step F |
| next milestone in `plan.md` | **planning iteration** (§10; skill `/spec`) — step P |
| anything workable (all in `Blocked`/`listening`) | **research iteration** (§13; skill `/research`) — step R. Never idle |

🔴 **Before choosing:** `board.decisionsNeeded` not empty → **stop** (step D). The loop does not run
while a course decision waits.

## 2 · Open (§3.2)

1. The area's memory: `docs/memory/rules.md › <area>`, `grep -l "<area>" docs/memory/decisions/`,
   `docs/memory/measurements.md`.
2. `/start #<issue>` — if `BLOCKED`, `blocked` label + a comment with the barrier, back to §1 with
   another card.
3. The area's reviewer in **design mode** (process §5 table), with the whole spec, the area's
   memory, and "do not write code; bring a discarded alternative".
4. `git switch -c feat/<nº>-<slug>` from `main`; `board.move <nº> "In progress"`.

🔴 A local doubt: comment on the issue **with options**, `question` label, `board.move <nº> "Blocked" --reason`,
one line in the chat, and **another card**. Do not wait.
🔴 A **course decision** (process §15): card (or a new `decision` issue) to `Decision needed` with
options and a recommendation, the same in the chat, and **stop** (step D).

## 3 · Implement (§3.3)

Test named after the criterion first; then the code. On every edit that adds code:
`git diff | grep -nE '^\+.*(//|/\*|#)'` — a comment outside the exceptions leaves immediately.
Out of scope → one comment on the right issue (or an `idea` issue), and move on.

## 4 · Prove (§3.4)

`pnpm check` — full output. Then the criterion × proof × evidence table. Evidence in
`evidence/<id>/` when it is a file. `listening` criterion → "pending: `heard: ok` on the PR".

**Touched the renderer?** Open the app and look — Playwright over CDP to use and measure while
developing; `pnpm --filter desktop shot <state>` for every state and width (1024/1440/1920), with
the measurements next to the screenshot (process §3.4 › Screens are proven on screen).

## 4½ · Review (§3.4½)

`/review` with the agents of the touched areas (process §5) — in parallel, one round; `docs-reviewer`
on every code change, `usability-reviewer` when the renderer changed. Blocking →
fix → re-run **only those who found it**. Three rounds without convergence → `blocked` + a comment
with what does not close, PR left as draft, and **another card**.

## 5 · Deliver (§3.5)

`/deliver`. Description with the three sections and `Closes #<issue>`. No person's name. Card →
`In review`. The iteration's final commit includes `docs/journal.md`, memory and spec, if changed.

## 6 · Merge (§3.6)

`board.deliver --merge <pr>` — merges only if all hold; card → `Done`: green CI · zero blocking ·
every piece of evidence present · no `listening` pending · no open human thread. Missing
`listening` → the PR stays ready and the loop moves on. Missing anything else → `blocked` + comment.

## 7 · Close (§3.7)

- `docs/journal.md`: `| date | id | result | what blocked |`
- `docs/memory/`: rule (per area), ADR (if it closed a door), measurement (if measured). **Same PR.**
- **docs** (process §16): every document the change made stale, updated in the same PR;
  `board.deliver --stale-docs` clean. Nothing is left behind; everything evolves together.
- `CLAUDE.local.md › Current situation`: what is in flight.

## 8 · Next (§3.8)

**Start §0 again, in this turn.** There is no alarm of its own: the rhythm is
`/loop 3m /liminal`, which wakes the session every **3 minutes**.

🔴 **Waking with an iteration in flight: do not restart** — continue from where it stopped (the
branch and the `In progress` card say where). Only start a new iteration if none is in flight.
Waking with nothing to do ends in one line: "no new input; iteration N in progress at step X".

---

## S · Spec iteration (§9) — `/spec`

1. Read `plan.md`, `architecture.md`, the milestone's cross-cutting specs, the whole
   `docs/memory/`, and the research briefs in `docs/research/` that the milestone cites.
2. Check in the code what already exists (call site, not symbol).
3. Write/complete `docs/specs/<milestone>/README.md` and one `.md` per card (complete frontmatter,
   five sections, "done when" with proof). Owner issues (`idea`/hand-made) enter with their text as
   Context.
4. `spec-reviewer` in two passes: facts × code; consistency. `usability-reviewer` when a card touches
   the UI.
5. PR `docs/<milestone>-specs` → merge → run the sync (creates and moves the cards) → §1.

## F · Release, close and open a milestone (§7, §14) — `/release`

1. Run the milestone gate proof (the milestone's row in `plan.md`); paste the evidence in the
   `milestone` issue.
2. Passed → `/release`: version tag, `CHANGELOG.md`, GitHub Release notes, `open-source-steward`
   pass; close the issue and the milestone; open the next milestone and create its `milestone`
   issue with the gate. Failed → new card in the milestone (spec on the spot, `Backlog`) and §1.
3. Memory cleanup pass (process §12 › Maintenance). One line in the journal.

## P · Planning iteration (§10) — `/spec`

1. Read `journal.md`, `measurements.md`, open `idea` issues, the specs' "Out of scope",
   `plan.md › Then`, `docs/product/strategy.md`, and the latest briefs in `docs/research/`.
2. `product-strategist` in advisory mode: which candidate milestone brings the most user value and
   why; `usability-reviewer` on the current app: what hurts most.
3. Propose **one** milestone (5–10 cards): name, delivery, **measurable gate**, cards in one line,
   risks. Order and cut — never a new requirement.
4. PR on `docs/plan.md` + `docs/specs/<milestone>/README.md`; `spec-reviewer`. **Do not merge:** a
   new milestone is a course decision — `decision` issue to `Decision needed` with the proposal and
   the discarded alternatives, the options in the chat with a recommendation, and **stop** (step D).
   On approval (merged PR or a chat answer), create the milestone and its `milestone` issue. → §1.

## R · Research iteration (§13) — `/research`

Only when nothing is workable, at every milestone close (before planning), or every 10 card
iterations. Rate-limited: at most one per hour when nothing else is workable — otherwise the wake
ends in one line. Output: a dated brief in `docs/research/` with sources, and `idea` issues
labelled `research`. Never touches code.

---

## D · Course decision (§15) — stop and ask

1. The question, the options, what each costs, and the loop's recommendation — on the issue (moved
   to `Decision needed`, in English) and in the chat (in the owner's language).
2. End the turn with the stop report. Do not start another card: the answer may change several.
3. On the next wake-up, gate 0 reads the answer (chat, comment, or the card moved out of the
   column), records it (ADR or plan edit when it deserves one) and resumes at §1.

## Stop (§4)

Only when: a course decision waits (step D); `main` red two iterations in a row; environment
down; research rate-limited with nothing else workable; or the owner said stop. Nothing
workable is **not** a stop — it is a research iteration (rate-limited). The report, in the chat,
in four lines: what waits on what · what unblocks each thing · what was delivered this session ·
the next step once unblocked.
