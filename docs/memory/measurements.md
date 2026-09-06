# Measurements

> A measured number, with date, method and where it applies. Before measuring again, look here.

| Date | What | Value | Method | Applies to |
|---|---|---|---|---|
| 2026-08 (another project) | latency per decision, one `claude -p` process per call, haiku | median **10,432 ms**; 9,674 tokens recreated per call | 7 scenarios, 2 repeats | `brain`: why a persistent session |
| 2026-08 (another project) | latency per decision, persistent `stream-json` session, haiku | median **2,075 ms**; 9,674 tokens from cache | same | `brain`: horizon budget |
| 2026-09-05 | versions on the npm registry | tone 15.1.22 · @strudel/core 1.2.6 · superdough 1.3.0 · tonal 6.4.3 · node-web-audio-api 2.2.0 · @tonejs/midi 2.0.28 | `npm view` | `stack.md` |
| 2026-09-05 | tools on the machine | node 25.9.0 · ffmpeg (with `ebur128`, `astats`) · python3 with numpy and scipy · **no** librosa, yt-dlp, fluidsynth, sox | `command -v`, `find_spec` | setup: what to install |
| 2026-09-05 | versions pinned at setup | node 24.18.0 · pnpm 11.20.0 · turbo 2.10.12 · typescript 6.0.3 · biome 2.5.12 · vitest 4.1.11 · electron 44.2.0 · electron-vite 5.0.0 · vite 7.3.6 · react 19.2.8 · tailwindcss 4.3.3 · @playwright/test 1.63.0 · ruff 0.16.6 · mypy 2.3.1 · pytest 9.1.1 | `npm view`, PyPI JSON API | `stack.md`, M0-01 to M0-04 |
| 2026-09-06 | zod pinned for the document schema | zod 4.5.4 (`latest`; the 4.1.13-beta and 4.5.0-canary tags were not taken) | `npm view zod dist-tags` | `stack.md`, `@liminal/score` |
| 2026-09-06 | kick pitch envelope, from a documented walkthrough | oscillator at C0, pitch decay **7.6 ms**, amp decay **720 ms**; fast pitch decay reads clicky, slow reads thumpy | Sound on Sound, Dec 2016 | `engine`: the kick preset |
| 2026-09-06 | Tone.js percussion defaults against what a hat needs | `MetalSynth` decay **1.4 s** (a cymbal), `NoiseSynth` decay **0.1 s** (a closed hat); a closed hat wants 80–200 ms, an open one 300–600 ms | Tone.js docs r13 + converged technique sources | `engine`: why the hat preset is the risky one |
| 2026-09-06 | Tone.js transport resolution against the score's | `Transport.PPQ` **192** · score `PPQ` **960** | node 24.18.0, tone 15.1.22 over node-web-audio-api 2.2.0 | `engine`: tick conversion |
| 2026-09-06 | offline render of the 16-bar fixture, 128 BPM, 48 kHz, Node | **112 ms** for 30 s of audio; 16 bar callbacks at exactly 1.875 s apart | `Tone.Offline`, node 24.18.0, tone 15.1.22, node-web-audio-api 2.2.0 | `engine`: the timing tests run offline, at the real tempo |
| 2026-09-06 | transport under a caller-supplied offline context | `Tone.Context(raw)` → **0** transport callbacks; `Tone.OfflineContext(raw)` → all of them | 8 s render, same stack | `engine`: which wrapper the engine picks |
| 2026-09-06 | the whole engine rendering the fixture offline (4 tracks, 368 notes, filter automation) | **6.9 s** for 30 s of audio; peak 0.585 under the limiter; 19 nodes created, 19 disposed (⚠️ Correction: first written as 15, which was never measured) | `Tone.OfflineContext`, node 24.18.0 | `engine`: the test suite runs in ~17 s |
| 2026-09-06 | the engine test suite, before and after rendering only what each test observes | **47 s → 9.7 s**; the six heaviest tests ~11 s → under 1 s. Rendering the fixture costs ~0.21 s per second of audio with notes, ~0.012 s without | `vitest --reporter=verbose`, same 40 tests | `engine`: what a review round costs |
| 2026-09-06 | notes the engine triggers when the transport stops at the last tick | **165, 168, 165, 150** attacks live and **374** offline, on a document that holds **48** live and **368** offline; the extra attacks are the clip's first event replayed within ~50 ms. The bar events are unaffected, sixteen either way (⚠️ Correction: a seventeenth was written here and does not reproduce) | live device and `Tone.OfflineContext`, node 24.18.0, tone 15.1.22 | `engine`: the invariant the tests now assert |
| 2026-09-06 | release tail each preset needs to fall silent | kick 0.34 · hat 0.07 · clap 0.16 · bass-mono 0.10 · sub-sine 0.30 · poly-saw 0.40 · pad-fm **1.20** · lead-am 0.30 · noise 0.32 (seconds) | the envelopes the presets are built with: release when they sustain, decay plus release when they do not | `engine`: the tail is derived from the score's presets, not a constant |
| 2026-09-06 | one `engine-reviewer` round on M1-02, measure mode, own worktree + `pnpm install` | **25.8 min**, 51 tool calls, 114k tokens; second round 13.1 min, 51 calls, 107k | the loop's session log | `review`: why two passes and a prepared worktree |
| 2026-09-06 | the machine's `test-engineer` on M1-02 | **~52 min** | the loop's session log | `review`: the project override with a 30-min budget |
| 2026-09-06 | rounds on M1-02 before the deep-pass rule | 3 rounds × 6 agents + 2 engine-only rounds | the loop's report | `review`: the 3-fast-rounds limit and the single deep pass |
| 2026-09-06 | `board.review --prepare`, first call against a reuse | **1.1–1.8 s** to add the worktree and install from the warm store, **30–60 ms** to reuse it; the tree is **280–360 MB** of hardlinks, and grows with the lockfile | `board.review --card M1-06 --prepare` twice on the same head, node 24.18.0, pnpm 11.20.0 | `review`: one prepared tree per round instead of one install per agent |
| 2026-09-06 | a fast review pass against the deep passes it replaces | fast pass **5.2 min**, 13 tool calls, 67k tokens · deep passes on the same card **25.8**, **13.1** and **8.6 min**, 51/51/29 tool calls, 114k/107k/93k tokens | `engine-reviewer` on M1-02, `mode: read` on a prepared worktree against `mode: measure` rounds | `review`: the fast pass is the round, the deep pass happens once |
| 2026-09-06 | `board.review --scratch`, a throwaway worktree with its own offline install | **1.1–1.6 s**, and `pnpm --filter score test` runs in it. Sharing the prepared tree's `node_modules` through a symlink instead: pnpm refuses with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` and would purge the shared install | the real repo, pnpm 11.20.0, node 24.18.0 | `review`: what a reverting agent gets |
| 2026-09-06 | `renderOffline` of the 16-bar fixture in Node, 48 kHz, 2 channels, against `SOUNDCHECK_BUDGET` | **6.6–6.9 s** for 30.000 s of audio; peak 0.585, rms 0.075; the wav is 5.49 MB. The budget is ⅓ of `BRAIN_DEADLINE` = ⅓ of the 8 bars of slack between `COMMIT_HORIZON` and `MIN_HORIZON` = **~5 s** at 128 BPM, for render plus measurement — so **Node misses it by ~35%**. The soundcheck runs in the hidden window, and M1-05 measures Chromium | three runs, `node --experimental-strip-types`, node 24.18.0, tone 15.1.22, node-web-audio-api 2.2.0, Apple M3 Pro | `engine`: the M1-03 criterion, and the soundcheck budget in `two-clocks.md` |
| 2026-09-06 | the engine suite after M1-03 | **16.2 s**, 66 tests; `render.test.ts` is **9.4 s** of it and 6.6 s of that is the one full-fixture render the duration and level criteria name. The determinism, seed and wav tests render two bars | `pnpm --filter engine test`, node 24.18.0, Apple M3 Pro | `engine`: the cost of proving M1-03 on the fixture the spec names |

## To measure in the first milestones

| Milestone | What | Why |
|---|---|---|
| M1 | `renderOffline` time for 16 bars at 128 BPM, 48 kHz, in Chromium and in Node | fixes the soundcheck budget |
| M1 | measurement difference Chromium × Node on the same score | fixes the tolerance of headless tests |
| M2 | `analyze` time per 5-min track; `measure` time per 16-bar section | fixes the minimum horizon |
| M2 | BPM and key accuracy on 10 known tracks | plan requirement 4 |
| M4 | latency per decision of the `claude` brain on this project, persistent session | fixes `COMMIT_HORIZON` |
