---
name: explore
description: Runs a strategy iteration — explores how the product itself could evolve: new uses, new audiences, revised assumptions — with research briefs and cheap spikes, and brings a well-argued proposal to the owner as a decision. TRIGGER at every milestone close after discovery and before planning, every 20 card iterations, when a research brief or user signal suggests a new use, when the user asks "where could this go", or as step X of /liminal. Also activates on /explore.
---

# /explore — evolve the idea, not just complete it

Completeness (`/discover`) asks "what would a person expect here?". Exploration asks "who else,
for what, and is the proposal itself still right?". The product is a set of bets
(`docs/product/bets.md`); this iteration moves them.

## 1 · Read the signals

`docs/product/bets.md` (status of every bet, candidate uses, open assumptions), the latest
`docs/research/` briefs, issues and discussions from other people, `docs/journal.md` and
`measurements.md` (what actually happened), the proof columns of the accepted bets (are they
being validated or not), and what comparable products shipped since the last iteration
(`research-scout`, topics R10, R18, R20, R21).

## 2 · Pick what to explore

At most **two** items per iteration: the candidate use with the strongest signal, or an
assumption the evidence questions. Say why these and not the others.

## 3 · Explore, cheaply

| Question is about | Instrument | Budget |
|---|---|---|
| a market, a use, what people pay for | `research-scout` brief with sources; `product-strategist` in exploration mode | one iteration |
| something technical ("can the engine follow a game?") | a **spike**: branch `spike/<slug>`, label `spike`, throwaway code, a measurement, a short write-up in `docs/research/` — never merged as product | ≤ 2 days of loop work |
| a screen or an interaction | `ui-designer` brief and, when useful, a design canvas | one iteration |

A spike that finds something a card can reuse says so in its write-up; the code itself does not
land.

## 4 · Propose, or drop

- Worth it → a `decision` issue: the bet, the evidence, the cost, what changes in `plan.md`,
  which bets it competes with, the recommendation → `Decision needed` → the loop stops (§15).
- Not worth it → the row in `bets.md` gets `declined` with the reason, in a docs PR that merges
  on its own. Dropping with a written reason is a result.
- Every exploration updates `bets.md` (status, evidence, date) and leaves one line in the journal.

## 5 · The rule that keeps this honest

The loop **proposes**; the owner **decides** direction. But a quarter without a proposal is a
failure signal: if nothing was worth proposing, the write-up says what was explored and why it
did not qualify.
