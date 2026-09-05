# ADR-0004 · Brain via the Agent SDK with a persistent session, and a rules brain as baseline

**Status:** accepted · 2026-09-05

## Context
The app's LLM is Claude Code (the user's credential), as in another project of this account.
There it was measured: one process per decision costs ~10 s; a persistent session, ~2 s.

## Decision
`@liminal/brain` exposes a `Brain` interface with two implementations: `rules` (deterministic,
TypeScript) and `claude` (`@anthropic-ai/claude-agent-sdk`, persistent session, structured output
validated by Zod). `rules` is baseline and fallback; `claude` is the product.

## Alternatives discarded
- **Raw `claude -p` over `stream-json`** — works, but it is what the SDK wraps; less code of ours,
  official types.
- **API SDK with a key** — cost per token outside the user's plan; stays as a third
  implementation if it ever makes sense.

## Consequences
- Every LLM plan passes through a schema; invalid = fallback, never an exception in the loop.
- Every call has a deadline; past it, discard.
- The session restarts every N turns to contain the context.
