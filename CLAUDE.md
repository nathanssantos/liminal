@AGENTS.md

# Claude Code — what only applies here

## Skills and agents

- Skills **of this repo** (`.claude/skills/`): `/queue` → `/start #n` → implement → `/review` →
  `/deliver`, plus `/spec`, `/research` and `/release`. The whole loop is **`/liminal`**, and it
  runs on its own with `/loop 3m /liminal`. None depends on the machine's skills; the scripts are
  in `tools/board`.
- Project agents in `.claude/agents/` (all read-only): reviewers `spec-reviewer`, `score-reviewer`,
  `engine-reviewer`, `music-reviewer`, `analysis-reviewer`, `brain-reviewer`,
  `conductor-reviewer`, `desktop-reviewer`, `usability-reviewer`, `docs-reviewer`; advisors
  `research-scout`, `product-strategist`, `open-source-steward`; and `ui-designer`, which writes
  only under `docs/design/`. The table of who runs per path is in
  `docs/process.md › §5`. The machine's agents (`~/.claude/agents/`) still apply to UI and
  general quality.
- No config and no token: the scripts use the authenticated `gh` and find the board by title.
- Local situational memory and **the owner's local preferences (including chat language)** in
  `CLAUDE.local.md` (not versioned). **Lessons do not live there** — they live in `docs/memory/`,
  versioned, for any LLM.

## Quality targets

- Accessibility: WCAG 2.2 AA
- Breakpoints: 1024 / 1440 / 1920 (desktop app; no mobile)
- Performance budget: interaction < 100 ms in the renderer; no audio work on the UI thread beyond
  Tone.js scheduling; zero `underrun` reported by the engine over 10 min

## Autonomy in this repo

This repo **overrides** the general rule of "never commit without asking": inside a `/liminal`
iteration, commit, push, PR, merge, opening and closing milestones, writing specs and planning are
autonomous, under `docs/process.md`. A local doubt does not block: it becomes a `question`, the card goes to `Blocked`, and the loop
takes another card. A **course decision** stops the loop and waits for the owner
(`docs/process.md › §15`). Outside an iteration, the general rule applies. A human review
thread still requires approval. The human steers through the chat and GitHub
(`docs/process.md › §11`); the loop never undoes an action of theirs there.
