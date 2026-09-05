# ADR-0005 · Analyzer in Python, as a long-lived stdio worker

**Status:** accepted · 2026-09-05

## Context
`librosa` and `yt-dlp` are Python; importing `librosa` costs 1–2 s. The soundcheck measures a
section every ~30 s of music and cannot pay that import every time.

## Decision
`tools/analyzer` (uv, Python 3.12) runs as a long-lived child process of `main`, speaking JSON
lines over stdio: `analyze`, `measure`, `ping`. The style card schema is Zod in
`@liminal/analysis`; the exported JSON Schema validates the Python output in tests.

## Alternatives discarded
- **HTTP service** — a port, a lifecycle, infrastructure without a need in a local app.
- **One process per call** — 1–2 s of import per measurement.
- **Everything in Node** — there is no equivalent to librosa at its level.

## Consequences
- `main` supervises the worker: restarts it if it dies, and reports an explicit error, never empty.
- The schema has **one** source (Zod); Python does not redefine it.
