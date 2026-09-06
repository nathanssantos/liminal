# HANDOFF 04 — the design system (`@liminal/ui`, card M1-07)

Paste this into a new Claude Code session opened at `~/Documents/dev/liminal`, **with the loop
chat paused** (tell it "pausa controlada" first and wait for its state report: M1-04 is in
progress on `feat/14-…` and touches `apps/desktop`, which this card refactors).

---

You will build the design system as **one card, M1-07**, through the normal process — branch,
gates, two-pass review, PR, merge — not as a side project. Read before acting:

1. `AGENTS.md`, `CLAUDE.md`, `CLAUDE.local.md` (local preferences).
2. `docs/design/components.md` — the rules and the catalogue: this is the spec of the system.
3. `docs/design/principles.md` — the look: roles, tokens, motion, the controls we keep needing.
4. `docs/specs/M1-sound/M1-07.md` — the card, with its "done when".
5. `docs/product/controls.md` — what the screens will need from you, and when.
6. `docs/process.md › §3.4½` and `.claude/skills/review/SKILL.md` — the review in two passes.
7. `docs/memory/rules.md › desktop` and `measurements.md` — what is already known (Vite 7,
   electron-vite 5, Electron 44, TypeScript 6).

## What exists

`apps/desktop` (Electron shell from M0-02, with `tokens.css` inside the app and a Play/Stop
readout from M1-04 in progress), seven `@liminal/*` packages with a boundary test in
`tools/boundaries.ts`, `board.review` for the review worktree, Tailwind 4, React 19, Biome,
Vitest. No `packages/ui`, no Radix, no Storybook.

## What to build

Follow the card. In short: `packages/ui` (`@liminal/ui`) with `tokens.css` **moved** out of the
app and filled from the principles (both themes); wrappers over `radix-ui` for `Button`
(Slot), `Toggle`, `Slider`, `Select`; our `Readout`, `Transport`, `ErrorStrip`; **Storybook that
exercises every variant and prop** — autodocs per component, an `argType` with a control for
every prop, a named story per state and per variant, `play` interaction tests for the keyboard
contract, `addon-a11y`, the 1024/1440/1920 viewports, and the interaction tests running headless
inside `pnpm check`; RTL + axe tests per behaviour rule; the boundary table extended; the M0-02
shell refactored to compose `Transport` and `Readout` from the package with no local token or
style left; the catalogue rows filled with the real props.

**Design brief first** (`ui-designer` → `docs/design/M1-07.md`), then code. **Versions checked on
the day** (`npm view radix-ui version`, `storybook`, `@storybook/react-vite`,
`@storybook/addon-a11y`, `@testing-library/react`, `axe-core`), pinned, recorded in
`measurements.md`; if Storybook and Vite 7 do not pair, pin the last pair that works and write
the rule in `rules.md › desktop`.

## The rules that matter most here

- Everything in English; no comments in code; tokens only — no loose value anywhere in
  `packages/ui/src` outside `tokens.css`, and none left in `apps/desktop`.
- A component is named by what it is; a new variant is a new prop with a default that preserves
  what exists; no `boolean` positional parameters.
- Every "done when" gets evidence in the PR: Vitest output, the story list, screenshots at the
  three widths in `evidence/M1-07/`, the boundary test's negative case.
- Review in two passes on the prepared worktree (`board.review --prepare`); the deep pass opens
  Storybook and the app and takes the screenshots.
- A doubt that changes the outcome → a `question` on issue M1-07 with options; a direction
  question → `Decision needed` and stop.

## When you are done

`board.deliver --merge` on the PR; card `Done`. Then update `docs/design/components.md` if the
real API differs from the catalogue, and report in the chat: what was built, what was left out
and why, what changed under M1-04's feet (tokens moved, the shell composing from the package, the
components it should use). The planning chat reviews the result against the card and writes the
prompt that resumes the loop on top of `@liminal/ui`; the boilerplate gets `packages/ui` as a
template after that review.
