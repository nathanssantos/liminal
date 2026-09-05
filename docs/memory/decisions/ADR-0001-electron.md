# ADR-0001 · Electron as the app shell

**Status:** accepted · 2026-09-05

## Context
The product plays on the machine wired to the speakers and will have a rich UI (timeline,
energy curve, knobs). There was prior experience with Electron 42 + Vite + React +
electron-builder in another repo of this account.

## Decision
Desktop app in Electron. `main` in Node with the conductor, the brain and the analyzer;
`renderer` in React with the audio engine; one hidden window for the soundcheck.

## Alternatives discarded
- **Web (Next.js) + local Node server** — two processes to start, a browser as the UI of an app
  that is local by nature, no path to packaging.
- **Tauri** — audio in the system WebView (Safari on macOS) and no Node in main; we would lose
  Chromium's Web Audio and Tone.js in the engine.

## Consequences
- Typed IPC replaces HTTP/WebSocket (`@liminal/protocol`).
- Packaging and signing only in M5.
- Remote control from a phone becomes a small server in `main`, later.
