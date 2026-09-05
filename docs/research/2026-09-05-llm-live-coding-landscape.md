---
topic: R01
question: What "LLM makes music live" projects exist, what do they do well, and what do they lack that liminal should own?
sources:
  - https://github.com/p-poss/dj-claude
  - https://github.com/rcarmo/apfelstrudel
  - https://github.com/williamzujkowski/live-coding-music-mcp
  - https://mcpmarket.com/server/strudel
  - https://strudellm.com/
  - https://dev.to/harishkotra/how-i-built-swarm-dj-a-multi-agent-ai-system-performing-live-electronic-music-3lc2
  - https://github.com/calvinw/strudel-llm-docs
  - https://arxiv.org/pdf/2602.05064
confidence: medium
refresh_by: 2026-12-01
---

## What we asked

Which projects already let an LLM make music in real time, what pattern do they share, and where
are the gaps a new product can own.

## What the sources say

- The dominant pattern is **MCP server + Strudel**: the LLM writes Strudel patterns and a browser
  plays them. Several implementations exist — [DJ Claude](https://github.com/p-poss/dj-claude)
  (multi-agent, agents add layers over HTTP), [Apfelstrudel](https://github.com/rcarmo/apfelstrudel)
  (live-coding editor with an agent chat), at least three Strudel MCP servers
  ([1](https://github.com/williamzujkowski/live-coding-music-mcp), [2](https://mcpmarket.com/server/strudel),
  [3](https://strudellm.com/)). (source: the repos' READMEs, 2026)
- [Swarm DJ](https://dev.to/harishkotra/how-i-built-swarm-dj-a-multi-agent-ai-system-performing-live-electronic-music-3lc2)
  describes a multi-agent system performing live and reports cutting its decision cycle from
  15 s to 5 s as the main improvement. (source: the article)
- [strudel-llm-docs](https://github.com/calvinw/strudel-llm-docs) exists specifically to help LLMs
  write Strudel — evidence that pattern-language terseness is what makes these systems workable.
- A design-space paper for live music agents ([arXiv 2602.05064](https://arxiv.org/pdf/2602.05064))
  frames the axes: autonomy, timing, interaction modality. (source: the paper; we read the abstract
  and framing, not the full evaluation — **assumed** that its taxonomy matches the projects above)

## What it means for liminal

- **Inferred:** none of these treat music as a versioned document with bar-level edits, history or
  A/B — Strudel patterns are cyclic. liminal's `Score` (ADR-0007) is a real differentiator; the
  spec should keep "bar 37 exists" as a headline capability.
- **Inferred:** none measure the rendered audio back to the LLM. The soundcheck (two-clocks.md) is
  unique in this set; make it visible in the UI (M5) as a trust signal.
- **Inferred:** Swarm DJ optimising cycle time shows the field fights latency instead of designing
  around it. The two-clock architecture should be stated plainly in the README as "the LLM is never
  in the audio path".
- **From the sources:** Strudel's terseness is why LLMs cope. Keep the M3 spike on `@strudel/core`
  as notation for the brain's output (ADR-0003), even though it is not the engine.
- **Risk:** these projects have communities and demos today; liminal has neither until M1 ships a
  playable build. The README and the first release notes must show, not tell.

## Ideas

- If the set UI shows the soundcheck (target vs measured), then users can trust the "in the style
  of" claim without hearing the reference again.
- If the brain can emit Strudel mini-notation compiled into `Score`, then prompts about rhythm
  ("more syncopated hats") map to fewer tokens and fewer errors.
- If the README opens with a 30-second clip of a generated set, then the first five minutes for a
  stranger are solved.

## What we did not find

- Any measured comparison of these systems' musical coherence over long sets.
- Adoption numbers (users, sessions) for any of them.
- Whether any of them handle harmonic mixing or key continuity between segments.
