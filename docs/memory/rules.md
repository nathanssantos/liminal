# Learned rules

> One rule per mistake made or measurement taken. By area. Read the area's section **before**
> opening a card there. Process lives in [process.md](../process.md); decisions live in
> [decisions/](decisions/).

## General

- ⚠️ **`AGENTS.md` is not read by Claude Code.** It reads `CLAUDE.md`; its first line is
  `@AGENTS.md`. Codex, Cursor, Copilot and Gemini read `AGENTS.md` directly. (measured: docs as
  of August 2026)
- ⚠️ **A new agent in `.claude/agents/` only loads after restarting Claude Code** — the watcher
  covers only folders that existed when the session started. (measured on another project)
- ⚠️ **The `gh` token has no Projects scope by default.** `gh project …` answers
  `missing required scopes [read:project]`. Fix: `gh auth refresh -s project,read:project` on the
  right account. (measured 2026-09-05)
- ⚠️ **"No secrets" means no secret in the tree.** A GitHub Actions secret is fine, and there is
  exactly one: `BOARD_TOKEN`, a personal access token with the Projects scope, used only by the
  spec ↔ board sync workflow. Locally the scripts use the authenticated `gh` and need no token.
  Any second secret is a course decision (process §15). (decided 2026-09-05)
- 🔴 **Never invent a commit identity.** `<login>@users.noreply.github.com` is attributed to whoever
  owns that login on GitHub — a made-up one credited an unrelated real account as co-author, and
  removing it took a history rewrite of `main` with the loop paused (2026-09-06). A human commits
  with their own `git config`; automation commits as
  `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>`. Trailers follow the
  same rule: no `Co-authored-by` with an address nobody controls.
- ⚠️ **`gh project …` answers `unknown owner type` with a classic PAT that has only `project` and
  `repo`.** Measured 2026-09-05 with `BOARD_TOKEN`. ⚠️ Correction: direct `gh api graphql` calls with
  `user(login:)` do **not** need more — the CI sync ran green with `project` + `repo` alone before
  `read:org` was added (run 33997931460). `read:org` is only for the `gh project` subcommands.
- ⚠️ **The loop depends on no skill outside the repo.** Everything it calls is in
  `.claude/skills/` and `tools/board`; the only external prerequisite is an authenticated `gh`
  with the `project` scope.
- ⚠️ **Two `gh` accounts on this machine.** The default active one is the work account; the repo
  belongs to the personal one. `gh auth switch -u nathanssantos` before any `gh repo` /
  `gh project`.
- ⚠️ **Everything in the repo and everything public on GitHub is in English** — folders, files,
  skills, docs, specs, commits, issues, labels, release notes, memory. The chat language is a local
  preference in `CLAUDE.local.md`, never in a versioned file. (decided 2026-09-05, ADR-0008)

## score

- 🔴 **xorshift32 has a fixed point at 0, and `seed: 0` is a legal document.** An unnormalized
  state gives an endless stream of zeros: every `newId` identical (E3 fails) and every generated
  note at tick 0. `createRng` normalizes `state = (seed >>> 0) || 0x9e3779b9`. (measured
  2026-09-06, test `does not collapse on seed 0, which is xorshift32 fixed point`)
- ⚠️ **`newId` ids are unique within one PRNG stream, never globally.** Two documents built from
  the same seed get the **same** ids. Fine for E3, which is scoped per document; a hazard for
  `lineage.parentId`, which points across documents. Whatever links two documents needs its own
  identity, not `newId`. (measured 2026-09-06)
- ⚠️ **The ids are ULID-shaped, not ULIDs.** All 26 characters come from the PRNG, so they carry
  no timestamp and do not sort by creation. Sorting by id is meaningless. (decided 2026-09-06)
- ⚠️ **The Zod schema carries shape only; legality lives in `validate`.** Ranges and integrality
  in the schema would report Zod's own codes, and the invariant table needs `E9` plus the element
  id. `parse` is the only door that runs both — `scoreSchema.parse` alone accepts a document the
  engine refuses. (decided 2026-09-06, ADR-0009)
- 🔴 **A range check written as `value < min || value > max` accepts `NaN`.** Both comparisons are
  false, so the value is judged inside the range. A transform computing `20 * Math.log10(0 / 0)`
  produced a document `validate` called valid, and `NaN` on a Web Audio param poisons the graph.
  Every range check starts with `Number.isFinite`. (measured 2026-09-06, mutation test
  `NaN guard`)
- 🔴 **Integrality has to cover what a tick is multiplied by, not only the tick.** `beatsPerBar`
  was range-checked but never checked for wholeness: `4.0005` passed `validate` and made
  `scoreLengthTicks` return `61447.68`, so the invariant meant to guard tick integrality was
  itself computed in floating point. (measured 2026-09-06)
- 🔴 **`validate` must never throw — it reports.** Adding a guard to `ticksPerBar` made E5 blow up
  on a fractional meter instead of reporting E1, so a document that is merely invalid crashed the
  caller. The checks that need a bar length now run only when the meter has whole bars.
  (measured 2026-09-06)
- ⭐ **A test per invariant code is not a test per branch.** Nine `E` tests passed while twelve of
  the invariants' branches survived being replaced by `if (false)`. The gate that found it was
  mutation testing, not coverage: a table-driven case per sub-check, then a mutant per site.
  (measured 2026-09-06, 20 of 20 mutants killed after the fix)
- ⚠️ **`-0` round-trips through JSON as `0`.** A generated document with `gainDb: -0` broke the
  round-trip equality test. Nothing musical depends on the sign of zero, so the behaviour is
  stated in a test rather than fought. (measured 2026-09-06)
- ⚠️ **A `Score` byte-compared against a committed file needs `eol=lf` in `.gitattributes`.**
  Without it the comparison passes on macOS and fails on a CRLF checkout. Biome also reformats a
  committed `.json`, so `stringify` emits exactly Biome's shape: two spaces, sorted keys, trailing
  newline. (decided 2026-09-06)
- ⚠️ **`@liminal/score` must stay usable in the renderer**, so no `node:` import outside its
  tests and `zod` as the only runtime dependency. A test asserts both, because the package's
  tsconfig now carries node types for the byte-comparison test. (measured 2026-09-06)

## composition

- (empty — the first rule is born in M3)

## conductor

- (empty — the first rule is born in M4)

## engine

- 🔴 **superdough and Strudel do not run outside a browser.** Their "headless" is Puppeteer. An
  engine that must run in Node (CI, tests) cannot be Strudel. (measured: docs and issues, 2026-09)
- ⚠️ **Tone.js in Node needs the polyfill before the import.** `import 'node-web-audio-api/polyfill.js'`
  and only then `await import('tone')` — Tone uses `standardized-audio-context`, which does
  `instanceof` against globals such as `window.AudioParam`.
  ⚠️ Correction: the subpath carries the extension. `node-web-audio-api` 2.2.0 exports `.` and
  `./polyfill.js` and nothing else, so the extensionless form the README suggests throws
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. The original note was taken from the README, not from a run.
  (measured 2026-09-06, node 24.18.0)
- 🔴 **Tone's `Transport.PPQ` is 192; the score's is 960.** A score tick is not a Tone tick, and
  nothing warns about it: scheduling our ticks as Tone ticks plays the document five times too
  fast. Convert through seconds, or set the transport's PPQ, and never pass a score tick to a Tone
  API that wants ticks without saying which unit it is. (measured 2026-09-06)
- 🔴 **Wrapping an `OfflineAudioContext` in `Tone.Context` renders audio but never moves the
  transport.** Zero transport callbacks fire, silently: Tone reports the context as "suspended" and
  its ticker is a wall clock. Nodes scheduled straight on the graph still sound, so the render is
  not empty and nothing looks wrong. The offline path needs `Tone.OfflineContext(raw)`, whose
  `render()` advances transport time. An engine that takes a raw context has to pick the wrapper
  itself. (measured 2026-09-06)
- ⭐ **Offline rendering is the fast way to prove timing, at the real tempo.** The 16-bar fixture at
  128 BPM renders in ~112 ms against 30 s of wall clock, and the bar callbacks land on exact
  times (1.875 s apart). Raising a fixture's BPM to make a real-clock test bearable trades the
  tempo the product runs at for nothing. (measured 2026-09-06)
- 🔴 **A Tone event built without `{ context }` binds to the global transport, not yours.**
  `new tone.Part({ callback, events })` throws `Cannot read properties of undefined (reading
  'value')` from `_getBpm`, because the global transport has no bpm in a Node process that never
  called `Tone.setContext`. Every Tone object the engine builds carries the engine's context.
  (measured 2026-09-06)
- ⚠️ **Rewinding the transport makes `context.now()` slightly negative, and Tone rejects it.**
  `transport.seconds = 0` then `part.stop()` throws `Value must be within [0, Infinity], got:
  -3.6e-13`. Pass the time explicitly — `part.stop(0)`, `transport.stop(0)` — instead of letting
  Tone read the clock. (measured 2026-09-06)
- ⭐ **The guard that keeps `dispose()` honest is textual, not a counter.** A test asserts that
  every `new tone.X` in the engine's sources sits inside `ledger.add(...)`, so a node added inline
  fails the build instead of leaking. A wrapper that adds the node somewhere else defeats it — the
  `ledger.add(` has to enclose the construction where a reader can see it. (measured 2026-09-06)
- 🔴 **A transport callback is handed a CONTEXT time, not a transport position.** Deriving the bar
  from it works only while the context clock reads about zero at `play()` — true in every offline
  render, and never in the app, where the context is born at startup and play comes later. Measured:
  a context 31 s old emitted **no** bar events at all, silently, because every bar looked past the
  end. The bar comes from `transport.getSecondsAtTime(time)`; the callback's `time` is for
  scheduling nodes. (measured 2026-09-06)
- 🔴 **`AudioParam` times are context times, so automation cannot be scheduled at construction.**
  Points converted to score-relative seconds and handed straight to `setValueAtTime` fire against
  the context clock: on a context older than the score, the whole sweep is already over before the
  first note. Automation is planned at load and **applied inside transport callbacks**, which also
  makes it replay on a second `play()`. (measured 2026-09-06)
- ⭐ **The test that catches both is one that ages the context before playing.** Every offline test
  creates a fresh context where context time equals transport time, so the two bugs above are
  invisible to all of them. One live test that waits a few seconds before `play()` kills both.
  (measured 2026-09-06)
- ⚠️ **One transport per engine: two engines on one context fight.** The second engine's `stop()`
  stops the first engine's music, and `transport.cancel(0)` would wipe events the host scheduled.
  `createEngine` refuses a context that already drives an engine, and clears only the ids it
  registered. (measured 2026-09-06)
- ⚠️ **Disposing a Tone context closes the raw context underneath it.** `Context.dispose()` calls
  `close()`, which closes the `AudioContext` it was given, so an engine that wraps a caller's
  context must never dispose the wrapper — it would close the caller's device.
  ⚠️ Correction: the ticker is **not** the price. `context.clockSource = 'offline'` releases the
  wrapper's clock (the setter disposes the timeout or terminates the worker) and never touches the
  raw context — measured: the device stays `running` afterwards, and the caller still closes it
  itself. An engine that made the wrapper releases the clock on dispose and on a failed build.
  (measured 2026-09-06)
- 🔴 **A mutation run belongs in a worktree, never in the working tree.** An interrupted run left
  `if (false && …)` sitting in `instruments.ts`, uncommitted, and the next measurements were taken
  against sabotaged code — two tests "failed" for a reason that did not exist. `git diff HEAD` on
  the sources is the check before trusting any number that follows a mutation pass.
  (measured 2026-09-06)
- ⭐ **A test renders only as far as it looks.** The engine suite spent 41 s of its 47 on six tests
  that rendered the whole 30-second fixture to read a value at bar 8 or observe bar 4. Rendering to
  the instant asserted, with the notes stripped where no one listens, took the same six from ~11 s
  each to under 1 s and the suite from 47 s to 9 s — with every assertion unchanged. The cost is
  the audio graph, not the test: 4 s of the fixture renders in 192 ms, and 48 ms with no notes.
  (measured 2026-09-06)
- 🔴 **Never stop the transport from inside the tick that is running.** `transport.stop(time)`
  called at that same `time` rewinds the tick source while the clock loop is still in its window,
  and every `Part` replays its first event: 165 attacks on a document holding 48, all the opening
  chord, forty times in ~50 ms. A `PolySynth` prints `Max polyphony exceeded` and looks like a
  dropped release; a monophonic voice retriggers in silence. The stop belongs in a
  `context.setTimeout`, outside the tick. (⚠️ Correction: first written here as a race between the
  releases and the stop, which it is not — the mechanism is the rewind, and it is deterministic per
  configuration.) (measured 2026-09-06)
- 🔴 **Offline does see it, and that is where the guard belongs.** The same rewind adds 6 ghost
  attacks to an offline render of the fixture — deterministic, and cheap to assert. The engine
  counts the notes it triggers, and the test compares that count with the document; a live test
  alone would leave CI blind, because CI has no device. The bar events do not move: the bar
  callback already refuses to fire past the score's length. (⚠️ Correction: a seventeenth `bar`
  event was written here and does not reproduce.) (measured 2026-09-06)
- 🔴 **A guard that makes the symptom impossible also makes the fix untestable.** The parts
  once refused to trigger outside the playing state. In working code it changed no number; what it
  did was let the stop go back inside the tick with the suite still green. The assertion has to sit
  on the invariant itself — the notes triggered against the notes written — with nothing between it
  and the defect. (measured 2026-09-06)
- ⚠️ **A Tone `context.setTimeout` already cancels the lookahead, so arm it with a plain delay.**
  It stores `now() + delay` and fires against `now()`, and `now()` carries the lookahead on both
  sides. Subtracting the tick's `time` from `now()` to "correct" the anchor only moves the callback
  earlier, by at most one update interval, and clamps to zero for any tail shorter than that — a
  hat-only score would lose its tail entirely. (⚠️ Correction: this rule first claimed the plain
  delay lands 0.15–0.2 s early; it does not.) (measured 2026-09-06)
- 🔴 **Cancelling a Tone timeout does not stop it once the batch is dispatching.** `_timeoutLoop`
  walks a **snapshot** of everything due, so a `clearTimeout` called from inside that batch removes
  the entry from the timeline and not from the array being walked. The engine holds the id of its
  one pending timeout and cancels it on `play()`, `stop()` and `dispose()` — **and** every deferred
  action checks the state it was armed for. Without the second half a `play()` landing in the same
  batch as the release tail cancelled a rewind that ran anyway: transport running, engine reporting
  itself stopped, notes audible, no event, and only `dispose()` able to silence it. The guard is a
  state token, not a session identity: it closes the race for the engine's own transitions, and
  leaves a caller that owns timeouts on the same context able to drive `playing → idle → playing`
  ahead of a snapshotted action. Nothing in the repo does that. (⚠️ Correction: this rule first said
  cancelling on every transition was enough.) (measured 2026-09-06)
- 🔴 **`transport.start(0)` is right only for the first start.** Offline the context clock begins at
  zero, so the two agree once; on any later start the transport integrates from zero to the current
  render time and jumps straight to the end, playing nothing and emitting nothing. `start()` with no
  argument is right every time. (measured 2026-09-06)
- ⭐ **The release tail is a musical number, so it comes from the presets.** How long the engine
  keeps the transport after `ended` is the longest tail among the score's voices — the envelope's
  release when it sustains, decay plus release when it does not. A constant would silently truncate
  the first preset added with a longer release. It covers the voices only: the day a delay or a
  reverb lands, the effect's own tail joins the sum. (measured 2026-09-06)
- 🔴 **Whatever runs after the end has to survive `play()` landing in the middle of it.** During
  the tail the engine is neither playing nor idle: a `play()` there once re-armed the end in the
  transport's past and left the engine mute forever, with no error and no event. The engine keeps
  three states, and `play()` during the tail rewinds before it starts. ⚠️ It is the rewind **followed
  by a start** that has to leave the tick: rewinding alone from an `ended` listener is fine, which is
  why `stop()` and `dispose()` do it synchronously and a test calls `stop()` from there and counts
  the notes. (measured 2026-09-06)
- 🔴 **Opening the audio device at module scope can hang the whole suite, past any timeout.**
  `new AudioContext()` in `node-web-audio-api` is a synchronous native call; when the device is
  wedged it blocks uninterruptibly, so the file hangs on import and `timeout 90` does not kill it.
  The live tests are opt-in behind `LIMINAL_AUDIO_DEVICE=1`, and they say so when skipped. CI has
  no device either way. (measured 2026-09-06)
- ⚠️ **A reused Tone wrapper needs its clock put back.** `wrapContext` hands the same wrapper to
  every engine built on one raw context — the wrapper is never disposed, because that would close
  the caller's device, so building a new one per engine leaked its destination chain past the
  ledger's sight. Reuse means `release()` parks the clock (`clockSource = 'offline'`) and the next
  wrap restores it. That restore is defended only by the live suite: dropping it leaves the default
  suite green and hangs live playback. (measured 2026-09-06)
- 🔴 **A test that opens the audio device must be silent by default.** A timing test that plays
  through the speakers runs on every `pnpm check`, on the owner's machine, in the middle of
  something else — and worse, a review agent's mutation run replays it dozens of times from a
  worktree pinned to an older commit, where the fix does not reach. The master goes to -60 dB in
  the test; making sound is the job of `play:fixture`, which a human starts on purpose.
  (measured 2026-09-06)
- ⚠️ **`AudioWorklet` in `node-web-audio-api` runs synchronously**, with no thread of its own. Do
  not measure worklet latency in Node and call it product latency. (measured: docs)
- 🔴 **Rendering an offline context means rendering the Tone wrapper, not the raw context.**
  `startRendering()` on the raw one bypasses Tone's render loop, so nothing the transport scheduled
  ever runs and the buffer comes back silent — with no error. `renderOffline` wraps first and calls
  `context.render()`; the level assertion is what catches the mistake. (measured 2026-09-06)
- ⚠️ **An offline render stops at the last tick; live playback rings on.** `renderOffline` renders
  exactly `scoreSeconds`, while the engine holds the transport for `scoreReleaseTailSeconds` after
  the last tick. A bounce therefore ends on a non-zero sample, and the two do not agree. It does not
  disturb the soundcheck (the truncation is identical in both implementations, and spectral distance
  over a segment does not move for one envelope tail) — but an export would be truncated. #65
  decides before M3. (measured 2026-09-06)
- ⚠️ **Determinism is per implementation.** Chromium × Node do not yield the same bytes. Compare
  duration and measurements with tolerance; bytes only between two renders of the same Chromium.
  (assumed until M1-05 measures)

## brain

- 🔴 **One LLM process per decision costs 5× a persistent session.** Measured on another project
  with the same design: 10,432 ms × 2,075 ms per decision, because ~9,700 tokens of system prompt
  come from cache in the session. See [measurements.md](measurements.md).
- ⚠️ **`--output-format stream-json` of `claude -p` requires `--verbose`** — without it the
  process dies immediately. Relevant if the Agent SDK is ever swapped for the raw CLI. (measured
  on another project)

## analyzer

- ⚠️ **yt-dlp without a PO token provider fails intermittently in 2026.** YouTube binds the token
  to the video; manual extraction no longer works. Install `bgutil-ytdlp-pot-provider` and treat a
  download failure as an explicit error with retry, never as "video without audio". (measured:
  yt-dlp wiki, 2026-09)
- ⚠️ **Importing `librosa` costs 1–2 s.** That is why the analyzer is a long-lived worker, not a
  process per call. (assumed until M2-06 measures)

## desktop

- 🔴 **UI does not ship without opening the screen.** Lint, types and unit tests pass with the
  component visibly broken; the gate is Playwright opening the app, measuring and taking a
  screenshot per state and width. (measured on other projects, several times)
- ⚠️ **A native module in Electron's main needs a rebuild for Electron's ABI.** Avoided by
  decision: audio plays in the renderer and `node-web-audio-api` only enters tests, in plain
  Node. See ADR-0002.
- ⚠️ **`electron-vite` 5 caps Vite at 7** (peer `^5 || ^6 || ^7`), so the newest Vite does not fit.
  The pinned pair is electron-vite 5.0.0 + Vite 7.3.6 + Electron 44.2.0 + `@vitejs/plugin-react`
  5.2.0. `@vitejs/plugin-react` 6 needs Vite 8 and is therefore out. (measured 2026-09-05, `npm view`)

## review

- 🔴 **A review that re-measures everything every round costs more than the implementation.**
  Measured on M1-02: 25.8 min and 51 tool calls for one deep reviewer round, 52 min for the test
  engineer, five rounds on one card. The fix: fast pass every round in read mode, deep pass once in
  measure mode, on one prepared worktree, incrementally. (measured 2026-09-06)
- 🔴 **A gate the branch under review can write is a checklist, not a control.** `review.json`
  lives in the repository, so the same loop that wants the merge writes it, commits it and reads it
  back. It catches the loop skipping a step and nothing else. Making it a control needs the deep
  pass recorded where the branch cannot reach — a check run, a pull request review, an issue
  comment. Until then, every guard on it is about honesty, not security: refuse an empty measured
  set, read the head from the pull request rather than the local checkout, and refuse a diff that
  cannot be read. ⚠️ Only the head comes from the pull request — the state file and the other four
  gates still read the local working tree, uncommitted changes included. (measured 2026-09-06)
- 🔴 **A prepared worktree keyed by branch name alone is shared by every clone.** Two checkouts of
  one branch, or any two detached heads, landed in the same directory under `/tmp`, and preparing
  from one deleted the other's tree mid-review. The room carries a hash of the repository root, and
  a tree is only deleted when `git worktree remove` accepted it. (measured 2026-09-06)
- 🔴 **A file cannot record the hash of the commit that carries it.** Writing the head into
  `review.json` and then amending the commit leaves the file naming a hash that exists on no branch,
  and the merge gate then claims a review nobody can check out. `--round-done` records the head as
  it stands when the round ends, which is a real commit; the record of that round travels in the
  *next* commit, and the gate's "diff since the deep pass touches nothing measured" rule is what
  covers the gap. (measured 2026-09-06)
- ⚠️ **A reviewer never works in the loop's working copy.** It works on the prepared worktree at a
  pinned commit; rebasing or pushing the branch then changes nothing under it. ⚠️ Preparing a *new*
  head does drop the previous tree, so let a round finish before preparing the next. (rule from the
  same card: a rebase mid-review moved the ground under an agent)
- 🔴 **Never share a pnpm `node_modules` through a symlink.** pnpm reads the linked directory as
  invalid, asks to purge it, and with no TTY fails outright — and had it succeeded it would have
  taken the prepared tree's install with it. A throwaway worktree with its own offline install costs
  about a second, and it also keeps the agent's git state out of the prepared tree.
  (measured 2026-09-06)
- ⚠️ **No `pnpm install` per agent.** `board.review --prepare` installs once per head; `--scratch`
  makes the throwaway copy a worktree with an offline install of its own, about a second.
  (measured: the install dominated each round)
- **Recipes — what a deep pass runs per area** (grow these with every card):
  - `engine`: `pnpm --filter engine test` (the touched files' tests, fast tempo where the spec
    allows); one `renderOffline` of `sixteenBars` at 48 kHz; node count before/after `dispose()`;
    revert one fix at a time and run its test.
  - `score`: `pnpm --filter score test`; the round-trip and determinism tests; 100 generated
    documents through `validate`.
  - `desktop`: `pnpm --filter desktop shot <state>` at the three widths; a `getComputedStyle` read
    over CDP; keyboard path with Playwright.
  - `analyzer`: `uv run --directory tools pytest tests/<area>`; one `measure` on a rendered fixture;
    a `ping` round-trip time.

## process

- 🔴 **`git rebase` silently drops commits** since git 2.34. Always `--reapply-cherry-picks`, and
  check commit count, `rev-list --count HEAD..upstream` = 0, and one symbol of the delivery in
  `git grep`. (measured on another project)
- 🔴 **Truncated output lies twice**: `| tail` hides the error in the middle **and** zeroes the
  exit code. No gate truncates. (measured on another project)
- 🔴 **`--reapply-cherry-picks` does NOT stop the drop.** git reapplies the commit and then drops it
  as empty — `dropping <sha> … patch contents already upstream` — while printing
  `Successfully rebased`. What catches it is comparing the commit count before and after, which is
  what `board.deliver --rebase-only` does. (measured 2026-09-05, test
  `rebase only aborts when git silently drops a commit`)
- ⚠️ **Projects v2 has no checkbox field.** The `Listening` field of the board is a single-select
  with `yes` and `no`; the board scripts read it as a boolean. (measured 2026-09-05)
- ⚠️ **Two commits made in the same second with the same tree, parent, message and author get the
  same SHA.** A git fixture that needs two distinct commits must vary the message. (measured
  2026-09-05, while writing the rebase test)
- 🔴 **`enforce_admins: true` blocks the workflows too.** With `main` protected against everyone, a
  workflow that pushes to `main` fails — the board sync opens an auto-merging pull request instead.
  The alternative, leaving admins outside the protection, would let any owner token push straight to
  `main` and would make the gate a decoration. (measured 2026-09-05, M0-09)
- ⚠️ **The zero-comment gate read a markdown heading as a comment.** `#` opens a comment in Python
  and a heading in prose, so the first delivery that touched an ADR failed a gate it should have
  passed. The gate now skips `.md` and `.json` and still catches `#` in code. (measured 2026-09-06,
  the first real run of `board.deliver --merge`)
- 🔴 **`git add -A` sweeps in whatever a review agent has on disk at that instant.** A reviewer's
  fuzz harness landed inside a commit whose `pnpm check` had run minutes earlier, when the file did
  not exist yet, so the gate was green and the branch was not. Stage by path while an agent is
  running, and re-read `git show --stat` after committing. (measured 2026-09-06)
- 🔴 **A script that switches branches must put the branch back in a `finally`.** The sync opened a
  `docs/sync-<nº>` branch, failed on `gh pr merge`, and left the session on that branch — the next
  commits landed there without anyone noticing. It also must refuse to run at all while the tree is
  dirty. (measured 2026-09-05, during M0-07)
