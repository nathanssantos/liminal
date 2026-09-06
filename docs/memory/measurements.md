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


| 2026-09-06 | one `engine-reviewer` round on M1-02, measure mode, own worktree + `pnpm install` | **25.8 min**, 51 tool calls, 114k tokens; second round 13.1 min, 51 calls, 107k | the loop's session log | `review`: why two passes and a prepared worktree |
| 2026-09-06 | the machine's `test-engineer` on M1-02 | **~52 min** | the loop's session log | `review`: the project override with a 30-min budget |
| 2026-09-06 | rounds on M1-02 before the deep-pass rule | 3 rounds × 6 agents + 2 engine-only rounds | the loop's report | `review`: the 3-fast-rounds limit and the single deep pass |

## To measure in the first milestones

| Milestone | What | Why |
|---|---|---|
| M1 | `renderOffline` time for 16 bars at 128 BPM, 48 kHz, in Chromium and in Node | fixes the soundcheck budget |
| M1 | measurement difference Chromium × Node on the same score | fixes the tolerance of headless tests |
| M2 | `analyze` time per 5-min track; `measure` time per 16-bar section | fixes the minimum horizon |
| M2 | BPM and key accuracy on 10 known tracks | plan requirement 4 |
| M4 | latency per decision of the `claude` brain on this project, persistent session | fixes `COMMIT_HORIZON` |
