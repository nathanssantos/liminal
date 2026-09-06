# Loop journal

> One line per loop iteration. Date · card · result · what blocked. Chronological, newest last.

| Date | Card | Result | What blocked |
|---|---|---|---|
| 2026-09-05 | (planning) | plan, architecture, stack, process, memory, specs M0–M2, review agents, project skills, handoffs | — |
| 2026-09-05 | (planning) | requirement 6 added: reference queue and handover — plan, architecture, two-clocks (P7–P9), style-card, strategy, usability, research R17 | — |
| 2026-09-05 | (planning) | dwell time per queued reference; `ui-designer` agent and `docs/design/` (principles, brief per UI card); design-before-build in process §5, start/review/liminal skills, M1-04 | — |
| 2026-09-05 | (planning) | requirement 7 (automated production) and the two-product platform frame — plan, architecture (production pipeline), strategy, usability F7, research R18, M3 gate | — |
| 2026-09-05 | M0-01 | repo, monorepo, TypeScript, Biome, Vitest, the check runner | — |
| 2026-09-05 | M0-03 | uv project in tools/, the analyzer worker answering ping | — |
| 2026-09-05 | M0-02 | seven packages, the Electron app, the boundary test, shot | electron-vite 5 caps Vite at 7 |
| 2026-09-05 | M0-04 | CI with node, python and desktop jobs, green on main | — |
| 2026-09-05 | M0-05 | board with eight columns, six milestones, nineteen labels | Projects v2 has no checkbox field |
| 2026-09-05 | M0-06 | the spec ↔ board sync, both ways; fifteen cards on the board | CI sync needs BOARD_TOKEN |
| 2026-09-05 | M0-07 | queue, open, move, comment, check, deliver and the gates | — |
| 2026-09-05 | M0-08, M0-09 | agents and skills loading, AGENTS commands, main protected, commit-msg hook | admin enforcement blocks the sync push |
| 2026-09-05 | M0-10 | contributing, conduct, security, four issue templates, changelog, release workflow, README | — |
| 2026-09-05 | (M0 close) | milestone gate proven, v0.0.0 released, M1 opened | — |
| 2026-09-06 | (repair) | commit identity: CI commits as github-actions[bot] (#29, #31); main rewritten to remove the invented identity from 14 commits, tag v0.0.0 moved, feat/11 rebased; rule recorded | main rewrite needs the loop paused and the protection relaxed for seconds |
| 2026-09-06 | M1-01 | @liminal/score: schema, E1–E9 and W1–W4, tick math, PRNG, stringify/parse, the sixteenBars fixture and its committed bytes | the card asked for 7/8 while the document pins beatUnit 4; review found NaN and fractional beatsPerBar passing validate |
| 2026-09-06 | (research R08) | synthesis recipes: the kick pitch envelope has a citable number, the hat default is a cymbal decay, and the bass ducks itself through note length rather than a compressor | levels have no citable source; that belongs to R07 |
| 2026-09-06 | (planning) | the control surface: `docs/product/controls.md` (immediate vs planned controls, output, transport, steering, queue, seeing, keep, settings); volume, mute and device in M1-04; M4 and M5 READMEs; usability F0/F1½, design controls, two-clocks inputs, plan gate, research R19 | — |
| 2026-09-06 | (planning) | product discovery owned by the loop: process §17, skill `/discover`, `completeness.md` (first row: sound → volume), `scenarios.md`, usability-reviewer's mandatory Expected-but-missing, strategist ranking; §10 reworded (direction is the owner's, completeness is the loop's) | the owner had to point out the volume control |
| 2026-09-06 | (planning) | the proposal evolves: `docs/product/bets.md` (4 accepted bets, 10 candidate uses, 5 open assumptions), process §18 exploration, skill `/explore`, strategist exploration mode, research R20/R21; plan requirements framed as accepted bets | — |
| 2026-09-06 | (planning) | bet B05 recorded: any music reworked as electronic, alone or as a set — content card sketch in style-card.md, idiom arrangement, spikes and rights constraint in bets.md; plan direction and strategy audience; research R22–R25 | — |
| 2026-09-06 | (planning) | the layer map: see every playing layer and change any aspect (controls.md section, flow F8, completeness row, design control, M4-08/M5-04b, two-clocks planned inputs, scenarios); rights wording on B05 relaxed — the app reworks, the use is the person's | — |
| 2026-09-06 | (planning) | the timeline as a DJ deck: overview + waveform detail with beat/bar grid, band colours, phrase markers (controls.md, design principles, M5-01, flow F4); research R26 on DJ app timelines required before the brief | — |
| 2026-09-06 | (planning) | the proposal as it stands now, everywhere it is described: README, AGENTS.md, CONTRIBUTING, package.json, the GitHub description, the process page | — |
| 2026-09-06 | (planning) | review in two passes on a prepared worktree: process §3.4½, `/review` rewritten, `board.review` contract and card M1-06, project `test-engineer` override, mode/budget blocks in the reviewers, review recipes and measurements in memory, pipeline depth 2 in `/liminal` | the review cost more than the implementation on M1-02 |
| 2026-09-06 | (planning) | the craft book `docs/craft/` (mixing, arrangement, harmony, sound, mistakes; enforced/advised/assumed) — compiled into the brain's prompt, enforced by the conductor, proven by craft metrics in the set log; M3 README; M4 cards and gate; requirement 2; music/brain/conductor reviewers; research R27/R28 and the rule that craft briefs end in entries | — |
| 2026-09-06 | M1-02 | @liminal/engine: nine presets, filter and eq3, lookahead scheduling over Tone's transport, automation per curve, a disposal ledger, and play:fixture for the listening gate | review found the bar number and the automation both taken from the context clock, which only agrees with the transport in an offline render; the listening gate then found the transport stopping on the last tick and dropping the notes still ringing; the suite went from 47 s to 8 s once tests rendered only what they observe |
