---
name: discover
description: Runs a product discovery iteration — walks the app as each persona through docs/product/scenarios.md, checks every surface against docs/product/completeness.md and the research, and turns every gap into a ranked idea or a card, without waiting for the owner to notice. TRIGGER after a UI card ships, every 5 card iterations, at every milestone close before planning, when the user asks "what is missing", or as step G of /liminal. Also activates on /discover.
---

# /discover — find what a person would miss before they do

The loop owns completeness. The owner owns direction. This skill is how the loop finds the
volume control before anyone asks (process §17).

## 1 · Walk

Start the app (`pnpm --filter desktop dev`, Playwright over CDP). Walk **every scenario** in
`docs/product/scenarios.md` as that person, step by step; where a step needs something that does
not exist yet in the open milestone, note it as a gap for the milestone that owns it
(`docs/product/controls.md`). Take a screenshot per broken step into `evidence/discover/<date>/`.

## 2 · Check

Run the `usability-reviewer` on the current screens with the mandatory **Expected but missing**
section, against `docs/product/completeness.md`. Run the `research-scout` on the latest R15/R19
briefs (UI patterns; what DJs and listeners actually touch) if they are older than the last
release. Read open `idea` issues and issues from other people.

## 3 · Rank

Give the list to the `product-strategist`: value for the first audience, cost, whether it
strengthens a primitive, whether it is a **completeness gap** (autonomous) or a **direction
change** (course decision, process §15). The strategist returns the ranked list with a reason each.

## 4 · Act

| Gap | What happens |
|---|---|
| completeness gap inside the open milestone, small (≤ 1 card), no ADR, no new dependency or cost | **a card now**: `.md` in the open milestone, `Ready` if dependencies allow — within the milestone's improvement budget (§17) |
| completeness gap for a later milestone | an `idea` issue with the scenario step and the row of `completeness.md` it violates; enters that milestone's spec iteration |
| direction change | a `decision` issue → `Decision needed` → stop (§15) |
| a row missing from `completeness.md` | add it, in the same PR |

## 5 · Close

`docs/journal.md` line: scenarios walked, gaps found, cards created, ideas filed. One line in the
chat: the three biggest gaps and what was done about them. Never idle: if nothing was found, say
which scenarios were walked and with which build.
