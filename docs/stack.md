# Stack

> Every choice carries the discarded alternative and the reason. Versions checked on the
> registry in September 2026; setup pins the exact ones in `package.json`.

## Base

| Layer | Choice | Discarded | Why |
|---|---|---|---|
| Runtime | **Node 24 LTS** (`.nvmrc`), **pnpm 11**, **Turborepo** | Node 25 (installed on the machine) | LTS for the native test binary and for CI; pnpm and Turbo are what `marketmind` already uses |
| Language | **TypeScript 6** strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, pure ESM | — | index and optional errors are what escapes most in music code (note arrays, fields that "always come") |
| Lint and format | **Biome** | ESLint + Prettier | one tool, one config, fast; `biome-ignore` is already the sanctioned form in the house rules |
| Tests | **Vitest**; **Playwright** with Electron for the app; `node-web-audio-api` for the headless engine | Jest | Vitest is native ESM and matches the renderer's Vite |
| Schemas | **Zod 4** | Valibot, TypeBox | single source for the document, the IPC protocol, the style card and the LLM output; exports JSON Schema for Python |

## Desktop

| Layer | Choice | Discarded | Why |
|---|---|---|---|
| Shell | **Electron 44** + **electron-vite 5** (which caps Vite at 7) + **electron-builder** | Tauri | Tauri plays audio in the system WebView (Safari on macOS) and has no Node in main — we would lose Chromium's Web Audio **and** Tone.js in the engine |
| UI | **React 19** + **Zustand** | Next.js | no server, no routes, no SSR; `marketmind` already has this pair |
| Styling | **Tailwind 4** with tokens as CSS vars (`@theme`) | loose CSS Modules | tokens from day one, without inventing a design system before there are two consumers |
| Primitives | **Radix** when the first real need appears | shadcn up front | do not bring blocks nobody asked for |

## Music

| Layer | Choice | Discarded | Why |
|---|---|---|---|
| Engine | **Tone.js 15** over Web Audio | superdough/Strudel as engine | superdough does not run outside a browser; the engine must also run in Node for CI. `@strudel/core` may return as **notation** (spike in M3) |
| Theory | **tonal 6** | music21 (Python) | pure TS, no I/O, fits inside transforms |
| Headless | **node-web-audio-api 2** (`devDependencies` only) | audiojs/web-audio-api | IRCAM implementation, maintained, with a Tone.js polyfill and `OfflineAudioContext` |
| PRNG | own (xorshift32) | `seedrandom` | 10 lines, zero dependencies, total determinism |
| Advanced synthesis | SuperCollider, samples, soundfonts | — | **after M5**. None of it is on the path of the five requirements |

## Brain

| Layer | Choice | Discarded | Why |
|---|---|---|---|
| LLM | **`@anthropic-ai/claude-agent-sdk`** with a persistent session; Claude Code's credential | raw `claude -p` over `stream-json`; the API SDK with a key | the Agent SDK is the official form of what `valheim-agent` does by hand. The persistent session was measured there: 10 s → 2 s |
| Baseline | **rules** brain in TS | — | proves the loop without tokens, and is the product's fallback |

## Analysis

| Layer | Choice | Discarded | Why |
|---|---|---|---|
| Runtime | **Python 3.12** with **uv** | plain Node | `librosa` has no JS equivalent at its level; `yt-dlp` is Python |
| Tools | **librosa**, numpy, soundfile, **yt-dlp** + `bgutil-ytdlp-pot-provider` | essentia | librosa covers all of M2; essentia comes in if precision is missing |
| Quality | **ruff**, **mypy --strict**, **pytest** | — | same rigor as the TS side |
| Shape | **long-lived worker**, JSON lines over stdio | HTTP service | one process per measurement costs 1–2 s of import; HTTP is infrastructure without a need |
| Stems | Demucs | — | after M5 |

## Delivery

| Item | Choice |
|---|---|
| CI | GitHub Actions: `ubuntu` for lint, types, Node and Python tests; `macos` for Playwright with Electron |
| Branches | `main` protected; `feat/<nº>-<slug>`, `fix/…`, `docs/…`, `spike/…` |
| Commits | Conventional Commits, in English, imperative, ≤ 72 chars on the first line; squash on merge |
| Version | one, the app's. No changesets: no published package |
| License | MIT |
