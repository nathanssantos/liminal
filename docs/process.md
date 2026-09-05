# Process — SDD with an autonomous loop

> How work moves in this repo. The spec defines "done" in a verifiable way. A loop picks the card,
> implements, proves, reviews, delivers, merges and picks the next — and when the milestone
> closes, it writes the specs for the next one and plans what comes after. **You switch the loop
> on and leave.** To change course, talk in the chat or touch GitHub; the loop reads both as input.

---

## 1 · Sources of truth

| Thing | Lives in | Mirror |
|---|---|---|
| **What to do** | `docs/specs/<milestone>/<id>.md` — one file per card, with frontmatter | issue + board card, kept by `tools/board/sync` **in both directions** (§8) |
| **Why and how** | `docs/plan.md`, `docs/architecture.md`, `docs/specs/cross-cutting/*.md` | — |
| **Where it goes** | `docs/plan.md › Milestones` and `› Then`; issues labelled `idea` | — |
| **Work state** | the board | `CLAUDE.local.md › Current situation` (local, not versioned) |
| **What we learned** | `docs/memory/` — rules, decisions (ADR), measurements — and `docs/journal.md` | — |

🔴 **The spec is the source; the issue is the mirror — but the mirror accepts writes.** You may
edit the issue on GitHub: the sync detects it, pulls the change into the `.md` in a docs PR, and
the loop carries on with the new version. Editing the issue is a legitimate way to steer the loop
(§11).

### A card's frontmatter

```yaml
---
id: M1-02
title: Engine plays a score live
milestone: M1
area: engine            # score | composition | engine | analysis | brain | conductor | protocol | desktop | analyzer | infra | docs
priority: P1            # P0 blocks the milestone · P1 critical path · P2 important · P3 when possible
depends_on: [M1-01]
listening: true         # has a criterion only the speakers can prove
issue:                  # filled by the sync, never by hand
sync:                   # filled by the sync: body hash and last sync date
---
```

Mandatory sections: **Context** · **What to do** · **Done when** (a list; every item says **how it
is proven**) · **Out of scope** · **Risks and questions**.

🔴 **A "done when" without "how it is proven" is not a criterion, it is a wish.** The
`spec-reviewer` rejects it.

---

## 2 · The board

One GitHub Projects v2 board:

| Field | Values |
|---|---|
| **Status** | `Backlog` → `Specified` → `Ready` → `In progress` → `In review` → `Done`, plus two parking columns: **`Blocked`** and **`Decision needed`** |
| **Priority** | P0 · P1 · P2 · P3 |
| **Milestone** | GitHub milestone (M0…, created by the loop as it plans) |
| **Area** | label `area:*` |
| **Listening** | checkbox — a human must listen before merge |
| control labels | `question` · `decision` · `idea` · `research` · `spike` · `milestone` · `release` |

| Status | Means | Who moves here |
|---|---|---|
| Backlog | exists, spec incomplete | sync |
| Specified | `.md` complete, with provable "done when" | sync, on the docs PR merge |
| Ready | dependencies done, milestone open | the loop |
| In progress | branch open | the loop |
| In review | PR ready | the loop |
| Done | PR merged | the loop |
| **Blocked** | waiting on something the loop cannot resolve now: an open `question`, a review that did not converge, a dependency, the environment. The reason is the last comment; `sync.previousStatus` remembers where it came from | the loop (and you) |
| **Decision needed** | waiting on **your** course decision (§15). The loop is **stopped** while any card sits here | the loop |

🔴 **Every card that enters `Blocked` or `Decision needed` is announced in the chat**, in one line:
card, why, what unblocks it. You follow the work on the kanban; these two columns are what needs
you.

**You may move any card anywhere.** The loop never undoes a move of yours: a card you sent to
`Backlog` leaves the queue; a card you labelled `blocked` waits; a card you set to `Ready` enters,
even out of order.

---

## 3 · One iteration

`/liminal` is the project skill (`.claude/skills/liminal/SKILL.md`), and it calls the other five
skills of the repo — `/queue`, `/start`, `/review`, `/deliver`, `/spec` — which call the
`tools/board` modules ([board.md](specs/cross-cutting/board.md)). Nothing depends on a skill
outside the repo. It runs under `/loop 3m /liminal`: every 3 minutes the session wakes, continues
the iteration in flight, or begins the next one. One iteration is **one card** — or a spec
iteration (§9), or a planning iteration (§10), when that is what is missing.

```
0 gates ──► 1 choose ──► 2 open ──► 3 implement ──► 4 prove ──► 4½ review
                                                                    │
              8 next ◄── 7 close ◄── 6 merge ◄── 5 deliver ◄────────┘
```

### 0 · Gates of the iteration

In order, and each one may **become** the iteration:

1. **Human input** since the last iteration: chat messages; edited issues and specs (the sync
   reports divergence); new comments on my issues and PRs; moved cards; new `idea` issues. Read
   everything **before** choosing. Chat outranks everything.
2. **Pending merges:** a PR of mine that is all green and was only waiting for `listening` and
   got the ok → merge now (§6).
3. **Unanswered human review threads** → that is the iteration: answer (with approval), fix,
   full `/review` again.
4. **Red CI on `main`** → that is the iteration: fix it. If the second consecutive iteration
   fails on this, stop (§4).
5. clean tree, local `main` equal to remote, analyzer worker and `pnpm check` responding.

### 1 · Choose

`/queue` brings the board. The choice is mechanical:

1. only `Ready`, without `blocked`, without an open `question`;
2. from the oldest open milestone;
3. with every `depends_on` in `Done`;
4. highest priority; tie → lowest id.

One card only. If there is no `Ready` but there is `Specified` with dependencies done in the open
milestone → promote and take it. If there is only `Backlog` in the open milestone → **spec
iteration** (§9). If the open milestone has no card left to do → **close the milestone and open
the next** (§7). If there is no next → **planning iteration** (§10).

### 2 · Open

Read the area's memory (§12): the section in `rules.md`, the ADRs that cite it,
`measurements.md`. Then `/start #<issue>`: its gates, what the repo already solves, and the
area's reviewer in **design mode** (§5) with the whole spec and a ban on writing code. Branch
`feat/<nº>-<slug>` from `main`; card → `In progress`.

🔴 **A local doubt does not block the iteration.** Write the question **with options** as a
comment on the issue, add the `question` label, move the card to **`Blocked`**, say it in the chat
in one line, and **take another card** that does not depend on the answer. The answer arrives by
comment or chat; gate 0 of the next iteration reads it, removes the label and moves the card back.

🔴 **A course decision stops the loop** (§15). If the doubt is about the product's direction, a
recorded decision, a milestone's scope or anything that would make more than one card's work
useless if wrong: card to **`Decision needed`**, the question with options in the chat, and stop.

### 3 · Implement

- What is a rule is born as a test first. Every "done when" that fits a test becomes a test
  **named after the criterion**.
- Zero comments. Sweep the diff after every edit that adds code.
- Strict scope: a finding outside the card becomes **one** comment on its issue — or a new issue
  labelled `idea` if there is no card — and move on.

### 4 · Prove

`pnpm check` at the root (Biome, tsc, Vitest, ruff, mypy, pytest) — full output, never truncated.

Then, **one piece of evidence per criterion**, in the table that goes into the PR:

| Criterion | How it was proven | Evidence |
|---|---|---|
| rendering twice yields identical bytes | test `renderOffline is deterministic` | Vitest output |
| the UI plays and stops | Playwright with Electron | `evidence/M1-04/playing-1440.png` |
| sounds like a kick and a hat | **listening** | pending: comment `heard: ok` on the PR |

#### Screens are proven on screen

🔴 **Nothing that touches the renderer ships without opening the app and looking.** Lint, types
and unit tests pass with the UI visibly broken — positioning, CSS cascade and native events do not
exist in the test DOM.

The instrument is **Playwright with Electron**, in two uses:

| Use | How | When |
|---|---|---|
| **use and see** while developing | the app starts with `--remote-debugging-port`; Playwright (MCP or script) attaches over CDP, clicks, reads `getComputedStyle`, takes a screenshot | whenever a UI decision needs eyes: "where did it open?", "does it cover the trigger?", "what colour came out?" |
| **prove** the criterion | `pnpm --filter desktop shot <state>` launches the app via `_electron`, drives it to the state, saves `evidence/<id>/<state>-<width>.png` and the measurements in a `.json` next to it | every card with `area: desktop` or touching `apps/desktop/src/renderer`; one screenshot **per state** (open, playing, stopped, error, empty) and per width in the Quality targets (1024 / 1440 / 1920) |

Screenshot rules: frame the component (`clip` from `getBoundingClientRect`), never the whole
screen with data that is not the card's; measure with `getComputedStyle`, never compare zoomed
images; the screenshot goes into the evidence table **and** is what the `ui-quality-reviewer`
inspects. A screenshot without measurements next to it proves appearance, not alignment.

### 4½ · Review

`/review`, with the agents of the touched areas (§5). Blocking finding → fix → re-run **only the
agents that found it**. Limit: **3 rounds**. On the fourth: card to **`Blocked`**, a comment with
what does not converge, PR left as draft, one line in the chat, and the loop **takes another card**.

🔴 **A screen change the spec does not describe → do not do it.** It becomes a `question` (§3.2)
and another card.

### 5 · Deliver

`/deliver`. Draft PR → ready when the gates pass. Description:

```
## What was done
## Done when — evidence     (the §4 table)
## Out of scope
Closes #<issue>
```

No person's name, no narrated validation method, no diagnosis. Card → `In review`.

### 6 · Merge

Merges by itself when **all** hold:

- green CI on the PR;
- no open blocking finding from the agents;
- every criterion with evidence, and no `listening` criterion pending — the ok is a comment
  `heard: ok` on the PR, or the phrase in the chat;
- no unanswered human thread.

Squash, delete the branch, card → `Done`. Missing `listening`: the PR stays ready (the card stays
`In review` with the Listening box checked), the iteration moves on to another card, and gate 0 of
a future iteration merges when the ok arrives. Missing anything else: card to `Blocked` + comment +
one line in the chat, and another card.

🔴 **A human review thread is answered with approval**: write the draft, show it in the chat,
wait. Applies to answering and to resolving.

### 7 · Close

- one line in `docs/journal.md`: date · card · result · what blocked;
- **memory** (§12): rule, ADR or measurement — **in the same PR**;
- **docs** (§16): every document the change made stale — README, plan, architecture, specs,
  process, product, `AGENTS.md` commands, CHANGELOG — updated **in the same PR**;
  `board.deliver --stale-docs` clean;
- spec: if the implementation changed a "done when", the `.md` changes **in the same PR**;
- `CLAUDE.local.md`: current situation only.

### 8 · Next

🔴 **Never end the turn without the next iteration started** — or without a short report saying
why it stopped (§4). The alarm clock is `/loop 3m /liminal`: if the session sleeps, it wakes in
3 minutes and **continues** the iteration in flight — it never restarts one that is in flight.

---

## 4 · When the loop stops

A card that gets stuck goes to `Blocked` and the loop moves on; nothing workable is a research
iteration (§13), not a stop. It stops, and reports in the chat, only when:

| Condition | Why |
|---|---|
| **a course decision is pending** — any card in `Decision needed` (§15) | the project must not take a wrong turn on the loop's guess |
| red CI on `main` for two consecutive iterations | broken in a way that needs eyes |
| credential, tool or service down | not work, environment |
| research is rate-limited and nothing else is workable | idling is cheaper than spinning |
| you said stop | — |

On stopping, the report says: what is waiting on what, what unblocks each thing, and — for a
decision — the options with the loop's recommendation.

---

## 5 · Review agents by area

The project's agents live in `.claude/agents/` and are **read-only**: they report, never edit.
The machine's agents (`~/.claude/agents/`) still apply to UI and general quality.

| Path touched | Project agents | Machine agents |
|---|---|---|
| always | `spec-reviewer` | `code-quality-reviewer`, `security-auditor`, `test-engineer` |
| `packages/score` | `score-reviewer` | — |
| `packages/composition` | `music-reviewer`, `score-reviewer` | — |
| `packages/engine` | `engine-reviewer` | — |
| `packages/analysis`, `tools/analyzer` | `analysis-reviewer` | — |
| `packages/brain` | `brain-reviewer` | — |
| `packages/conductor` | `conductor-reviewer`, `engine-reviewer` | — |
| `packages/protocol`, `apps/desktop/src/main`, `…/preload` | `desktop-reviewer` | `api-contract-guardian` |
| `apps/desktop/src/renderer` | `desktop-reviewer` | `ui-quality-reviewer`, `accessibility-auditor`, `design-system-guardian`, `performance-auditor` |
| `docs/specs`, `docs/plan.md` | `spec-reviewer` | — |
| any code change | `docs-reviewer` (are the docs still true?) | — |
| `apps/desktop/src/renderer` (also) | `usability-reviewer` | — |
| lockfile, `pyproject` | — | `dependency-guardian` |

Advisors by iteration type (read-only, their output is input): planning → `product-strategist`,
`usability-reviewer`; research → `research-scout`; release → `open-source-steward`, `docs-reviewer`.

**Design mode.** On opening, the area's reviewer receives the spec and answers with the approach,
the discarded alternative and the reason — no code. Same agent; different question.

🔴 **An agent's verdict is input.** A serious finding is checked before acceptance; a finding that
changes shared behaviour becomes a `question`, not a decision.

---

## 6 · Definition of done

1. every "done when" has evidence in the PR;
2. `pnpm check` passes at the root, with full output;
3. no review agent with an open blocking finding;
4. zero comments in the diff (`git diff origin/main...HEAD | grep -E '^\+.*(//|/\*|#)'` clean,
   except the house exceptions);
4½. touched the renderer → screenshot per state and per width in `evidence/<id>/`, with
   measurements next to it, and the `ui-quality-reviewer` looked at them;
5. spec updated if the criterion changed;
6. `listening` criterion confirmed, when there is one;
7. `docs/journal.md` and memory updated;
8. every doc the change made stale is updated (§16) — `board.deliver --stale-docs` clean.

---

## 7 · Milestones: the loop opens and closes them

A milestone is a GitHub milestone plus a `milestone` issue carrying the gate (the row from the
plan's table).

**Closing:** when the milestone has no card left to do, the loop proves the gate — runs what the
plan's row asks, pastes the evidence in the `milestone` issue, closes the issue and the milestone.
If the gate **fails**, that becomes a new card in the same milestone (`Backlog`, spec on the spot)
and the milestone stays open.

**Opening:** the next milestone in `plan.md`. If it already has specs → promote as dependencies
allow. If it only has a README → spec iteration (§9). If the plan is over → planning iteration
(§10).

You may reorder milestones by editing `docs/plan.md` (PR) or close one by hand on GitHub; the
loop reads both.

---

## 8 · Spec ↔ board sync, both ways

`board.sync` (contract in [board.md](specs/cross-cutting/board.md)) runs at gate 0 of every
iteration and in CI:

**md → GitHub** (the normal path):
- empty `issue:` → creates the issue (title `M1-02 · …`, body = the `.md` without frontmatter +
  link), writes the number and the hash into the frontmatter, adds it to the board;
- body, title, labels, milestone, priority, `listening` updated when the `.md` changes;
- status: incomplete `.md` → `Backlog`; complete → `Specified`; **never demotes**.

**GitHub → md** (when you touch it there):
- an issue whose body or title differs from the stored hash → the sync writes the change into
  the `.md`, opens PR `docs/sync-<nº>` and merges it **without review** (it is your word); the
  loop carries on with the new version;
- an issue created by hand, without a `.md` → the sync creates a skeleton
  `docs/specs/<milestone>/<id>.md` in `Backlog`; the spec iteration fills it. No milestone → goes
  to the open one;
- a status moved by you → respected; the sync records `sync.statusBy: human` and the loop does
  not undo it;
- new comments → listed in gate 0's report, for reading.

`--dry-run` shows without writing. Needs the `project` scope on `gh`
(`gh auth refresh -s project,read:project`).

---

## 9 · The spec iteration

When the open milestone only has `Backlog`. It is SDD adapted to a repo born from scratch:

1. read `plan.md`, `architecture.md`, the cross-cutting specs the milestone touches, and the
   whole memory;
2. **check in the code** what already exists — a symbol existing is not the same as being used;
3. write or complete `docs/specs/<milestone>/README.md` and one `.md` per card, with provable
   "done when"; cards that came from an issue of yours (`idea` or hand-made) take your text as
   Context;
4. `spec-reviewer` in two passes: **facts × code** and **internal consistency**;
5. PR `docs/<milestone>-specs`; the sync creates and moves the cards on merge;
6. a doubt that changes what gets built → `question` on the card's issue, and the spec marks the
   criterion **provisional**. The card does not reach `Ready` while the question is open.

---

## 10 · The planning iteration — the product's evolution

When the plan is over, or you asked ("plan the next milestone"), or a milestone closed and the
next is too vague to spec.

1. **Read what happened:** `journal.md`, `measurements.md`, proven gates, open `idea` issues
   (yours and the loop's), what was left in "Out of scope" in the specs, and the plan's `› Then`.
2. **Propose one milestone:** name, what it delivers, **measurable gate**, cards one line each,
   risks. Selection criterion: what brings us closest to the plan's five requirements and to what
   the `idea`s ask; what unblocks the most; what memory says is cheap.
3. PR on `docs/plan.md` (the new row in the milestones table) + `docs/specs/<milestone>/README.md`.
   `spec-reviewer` checks the gate is measurable and nothing contradicts an ADR.
4. **Does not merge by itself.** A new milestone is a course decision (§15): the PR stays open, a
   card goes to `Decision needed` with the proposal and the discarded alternatives, the chat gets
   the options with a recommendation, and the loop **stops**. You approve by merging the PR (or
   saying so in the chat), reject by closing it, or change it by editing.
5. Milestones are small: 5–10 cards. A big one becomes two.

⚠️ **Planning does not invent requirements.** A new requirement comes from you (chat or `idea`).
The loop proposes **order and cut**, not product.

---

## 11 · How you steer the loop

| You do | The loop reads it as |
|---|---|
| write in the chat | highest-priority input; read at gate 0 or immediately if listening. "stop" stops; "prioritise X" reorders; "change Y" becomes a spec or an answered `question` |
| edit an issue's title or body | a spec change: the sync pulls it into the `.md` and the loop carries on with the new one |
| move a card on the board | new order: `Backlog` removes from the queue, `Ready` jumps the queue, `Done` closes |
| comment on an issue with `question` | an answer: the label goes and the card returns to the queue |
| comment `heard: ok` on a PR | releases the merge |
| create an issue labelled `idea` | a product request: enters the next spec or planning iteration; if it is for the open milestone, it becomes a card right away |
| create an issue labelled `research` | a research request: the next research iteration picks it |
| move a card out of `Blocked` or `Decision needed` | you resolved it: the loop reads the last comment as the answer and resumes |
| create an issue without a label | a hand-made card: the sync creates the `.md`, the spec iteration completes it |
| add `blocked` | wait; removing the label releases |
| edit `docs/plan.md` by PR | new course; the loop re-plans at the next gate 0 |
| close a `milestone` issue or a milestone | veto or completion; the loop reads it and follows |

🔴 The loop **never** undoes an action of yours on GitHub. If it contradicts a spec, the spec
changes.

---

## 12 · Memory — what saves the next iteration

🔴 **A lesson that does not become a versioned file dies with the chat.** Claude Code's
automatic memory is per machine and per tool; it does not serve whoever opens the repo with
another LLM tomorrow. So the project's memory lives in `docs/memory/`, and `AGENTS.md` orders it
read.

| File | Holds | When to write |
|---|---|---|
| `docs/memory/rules.md` | a short rule, per area, born from a mistake or a measurement | closing the iteration, when something cost more than 10 minutes or would recur |
| `docs/memory/decisions/ADR-NNNN-*.md` | an architecture decision: context, decision, alternatives, consequences | when a choice closes doors — and **before** reopening one already taken |
| `docs/memory/measurements.md` | a measured number with date and method | every time something is measured that another iteration will want |
| `docs/journal.md` | one line per iteration | end of every iteration |

### What goes into a rule

- born from a mistake **or** a measurement — never from theory;
- fits in five lines: symptom, cause, fix;
- `🔴` if it already cost a delivery, `⚠️` if it cost time, `⭐` if it is a proven shortcut;
- says **measured** or **assumed**; assumed becomes measured or leaves;
- sits in the **area's** section, so whoever opens a card there reads only what matters.

### What does NOT go in

- what the code or git already tell;
- task narrative — that is the journal;
- a rule copied from another project because it looks generic.

### Who reads, and when

| Moment | Reads |
|---|---|
| opening a card (§3.2) | the area's section in `rules.md`, the ADRs that cite the area, `measurements.md` |
| reviewing (§3.4½) | `spec-reviewer` checks whether the diff contradicts an ADR; the area's reviewer checks whether it repeats a recorded mistake |
| spec and planning iterations | everything: a new spec does not reopen a closed decision without a new ADR |
| new chat, any LLM | `AGENTS.md` points to `docs/memory/` before the first line |

### Maintenance

- a rule that proved wrong: **fix in place**, with "⚠️ Correction:" and what was measured;
- a rule that became a test or a lint rule **leaves**: the code already enforces it;
- an ADR is not edited; it is superseded by another that cites it;
- at every closed milestone, a cleanup pass: duplicates, empty sections, broken links.

---

## 13 · The research iteration — never idle, always learning

The loop investigates the world the product lives in: musical styles and subgenres, production
techniques, music theory, trends, how AI is used in music, tooling and competitors. Electronic
music first; other genres after M5. The agenda is `docs/research/topics.md`; the output is a dated
brief in `docs/research/` with sources, and `idea` issues labelled `research`.

**When:** whenever nothing on the board is workable (instead of stopping); at every milestone
close, before planning; and every 10 card iterations regardless. **Rate limit:** at most one per
hour when nothing else is workable — beyond that the wake-up ends in one line. Research never
touches code. Skill: `/research`; agent: `research-scout`.

A finding that would change a recorded decision is a `question` (or a course decision, §15), never
a silent change.

---

## 14 · Releases and cadences — run like a company

A milestone that closes is a **release**: version tag (`v0.<milestone>.0`), `CHANGELOG.md` for
users (Keep a Changelog), GitHub Release notes with how to try it and what to listen for, and an
`open-source-steward` pass on the repo. Skill: `/release`.

| Cadence | What happens |
|---|---|
| every iteration | one card end to end; journal line; memory; docs current |
| every 10 card iterations | one research iteration |
| every milestone close | gate proven → release → memory cleanup → next milestone opened (or planning) |
| every planning iteration | `product-strategist` and `usability-reviewer` advise; the proposal waits for your decision |
| every release | `open-source-steward` and `docs-reviewer` pass; signals (stars, issues) recorded with a date in `docs/product/strategy.md` |

What the "company" watches is in `docs/product/strategy.md › How we measure`.

---

## 15 · Course decisions — when the loop stops for you

The loop is autonomous on **how**; you own **where**. A doubt is a **course decision**, and stops
the loop, when any of these holds:

| Signal | Example |
|---|---|
| it changes a requirement or a principle in `docs/plan.md` | "should the set also accept a local mp3 now?" |
| it reopens or adds an ADR | audio placement, engine, LLM provider, language |
| it defines a new milestone or reorders them | the planning iteration's proposal |
| it costs money or adds an external account or service | a paid API, telemetry, hosting |
| it touches user data, privacy or licensing | storing references, sample licences, opt-in analytics |
| it would make more than one card's work useless if guessed wrong | a schema change every generator depends on |
| two candidate answers lead to different products | "listener-first or producer-first UI?" |

Everything else is a **local doubt**: `question` label, card to `Blocked`, another card.

**How it stops:** the card (or a new issue labelled `decision`) goes to **`Decision needed`** with
the question, the options, the loop's recommendation and what each option costs — in English, like
everything public; the chat gets the same in the owner's language; the loop ends the turn with the
stop report. **How it resumes:** you answer in
the chat or on the issue, or move the card out of the column; gate 0 reads it, records the decision
(ADR or plan edit if it deserves one) and continues.

---

## 16 · Documentation evolves with the code — nothing is left behind

Every PR leaves the repo's documentation **true**. The rule is not "update the docs later"; it is
"the PR is not done while any document it made stale still says the old thing".

| Document | Goes stale when |
|---|---|
| `README.md` | how to run, what exists, the status line |
| `docs/plan.md` | a requirement, a milestone gate, a risk changed |
| `docs/architecture.md` | a package, a boundary, a process, a channel changed |
| `docs/stack.md` | a dependency added, replaced or removed |
| `docs/specs/**` | a criterion changed in implementation |
| `docs/process.md`, `.claude/skills/**`, `.claude/agents/**` | the way of working changed |
| `docs/product/**` | audience, positioning, flows, measures changed |
| `docs/memory/**` | something was learned, decided or measured |
| `AGENTS.md › Commands`, `CLAUDE.md` | a script or a target changed |
| `CHANGELOG.md` | anything a user would notice |

`board.deliver --stale-docs` checks what a machine can: backticked symbols and paths cited in docs
that no longer exist; commands in `AGENTS.md` absent from `package.json`/`pyproject`; the
architecture table versus the real `package.json` dependencies; broken relative links; specs whose
`issue:` does not match GitHub. The `docs-reviewer` agent reads what a machine cannot: whether the
prose still describes the code. Both run on every code PR and at every release.

**The platform frame.** liminal is a platform for generating and steering music — the endless set
is its first product. Documentation must say so wherever it describes the whole: the score,
transforms, generators, style cards, brains and engines are platform primitives; new products
(a track editor, an export pipeline, a plugin) compose them.
