# ADR-0009 · The Zod schema carries shape and is strict; legality lives in `validate`

**Status:** accepted · 2026-09-06 · depends on ADR-0007

## Context
`@liminal/score` needs two different things from one document description. The invariant table in
[score.md](../../specs/cross-cutting/score.md) gives every rule a stable code (`E2`, `W1`) and asks
for a message naming the element that broke it. Zod gives shape checking at the boundary, and
`@liminal/protocol` will import these schemas to validate IPC payloads.

Putting the ranges in both places duplicates the numbers. Putting them only in Zod means a
violation reports Zod's own code and path instead of `E9` and the section id, and warnings cannot
exist at all — Zod has no way to say "valid, but probably wrong".

## Decision
The Zod schema describes **shape**: keys, types, enums, the instrument discriminant and the
automation target union. It is **strict** at every depth: an unknown key is an error.

Every legality rule — integrality, ranges, uniqueness, cross-references, ordering — lives in
`validate`, which returns coded findings and warnings. `parse` is the only door that runs both, in
that order, and it is the door every consumer outside this package should use.

## Alternatives discarded
- **Ranges in Zod, `validate` mapping issue paths back to codes** — the mapping is by path shape,
  so a Zod error-format change silently degrades every code.
- **Ranges in both, with shared constants** — one number, two checks that can drift apart, and no
  test can prove they agree for every input.
- **A permissive schema that strips unknown keys** — a field written by a newer producer, or a
  key an LLM invents, disappears with no signal and `parse` still reports success.
- **`superRefine` carrying the invariants** — it cannot emit warnings, and it forces a full
  re-parse on the result of every transform.

## Consequences
- `scoreSchema.parse` alone accepts a document the engine refuses. Anything outside this package
  calls `parse` from `@liminal/score`, never the schema directly.
- A v2 document fails against a v1 parser with a shape error naming the unknown key. That is the
  intended behaviour: loud, not lossy.
- Adding an invariant is a change in one place, and it needs a new code in the table.
- `@liminal/protocol` gets shape validation from the schema and must call `parse` when it needs
  legality.
