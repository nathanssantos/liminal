# ADR-0008 · Everything in the repo in English; Biome

**Status:** accepted · 2026-09-05 (revised the same day: docs were briefly Portuguese)

## Context
The repo is public. Libraries (Tone, tonal, SDK), any LLM's best output, and any future
contributor read English. The owner's chat language is a personal preference, not a project fact.

## Decision
Everything **in the repo and everything public on GitHub** is in English: folder and file names,
identifiers, docs, specs, cards, issues, PRs, labels, release notes, agents, skills, memory. The
chat language is a local, non-versioned preference (`CLAUDE.local.md`). Lint and format with Biome.

## Alternatives discarded
- **Portuguese docs, English code** — two languages in one repo, and skills/labels that another
  LLM or contributor would have to translate mentally.
- **ESLint + Prettier** — two tools, two configs, slower; `biome-ignore` is already the sanctioned
  form in the house rules.

## Consequences
- `AGENTS.md` states the rule; the `spec-reviewer` rejects mixed language in the repo.
- No versioned file mentions the owner's chat language; `CLAUDE.local.md` does.
