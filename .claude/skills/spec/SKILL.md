---
name: spec
description: Writes or completes this repo's SDD specs — a milestone's spec iteration (README + one .md per card, with provable "done when") and the planning iteration (proposing the next milestone, with product and research input). Checks every claim in the code and the memory before writing. TRIGGER when the user asks for a spec, SDD, "spec M2", "plan the next milestone", or as steps S and P of /liminal. Also activates on /spec.
---

# /spec — raise a milestone to the last doubt, without inventing

**The document is worth what was CHECKED, not what was gathered.** A symbol existing is not being
used: find the call site.

## Spec iteration (process §9)

1. **Read:** `plan.md`, `architecture.md`, the cross-cutting specs the milestone touches, the whole
   `docs/memory/`, the milestone's `README.md` (if any), the milestone's issues (`idea`, hand-made)
   — their text becomes Context — and the `docs/research/` briefs the milestone cites.
2. **Check in the code** every "already exists": `grep` the symbol **and** who calls it.
3. **Write** `docs/specs/<milestone>/README.md` (milestone gate, what already exists, cards in
   order with dependencies, milestone decisions) and one `.md` per card with the process §1
   frontmatter and the five sections. Every "done when" says **how it is proven**. Mark
   **measured** × **assumed**.
4. **Review** with `spec-reviewer` in two passes, in parallel: **facts × code** and **internal
   consistency** (ids, dependencies, order, links, contradiction with an ADR). Cards touching the
   UI also go through `usability-reviewer` in advisory mode. 🔴 Check serious findings yourself
   before accepting.
5. **PR** `docs/<milestone>-specs`, short description, merge; run `board.sync` — creates and moves
   the cards.
6. **A doubt that changes what gets built** → `question` on the card's issue, with options and with
   what changes in each answer; the criterion is marked **provisional** and the card does not go to
   `Ready`.

**Writing rules:** never name a person; the origin is an artifact (card, ADR, measurement, brief);
record a correction of a previous version ("⚠️ Correction:") instead of erasing; milestones of
5–10 cards — a bigger one becomes two.

## Planning iteration (process §10)

1. **Read what happened:** `journal.md`, `measurements.md`, proven gates, open `idea` issues, the
   specs' "Out of scope", `plan.md › Then`, `docs/product/strategy.md`, and the latest briefs in
   `docs/research/`.
2. **Ask the advisors**, in parallel, read-only: `product-strategist` (which candidate brings the
   most user value, against the strategy) and `usability-reviewer` (what hurts most in the current
   app). Their output is input.
3. **Propose one milestone:** name, what it delivers, **measurable gate**, cards in one line,
   risks. Criterion: what brings us closest to the five requirements, the strategy and the `idea`s;
   what unblocks the most; what memory says is cheap.
4. PR on `docs/plan.md` (a row in the milestones table) + `docs/specs/<milestone>/README.md`;
   `spec-reviewer`; merge; create the milestone and the `milestone` issue with the gate; say in the
   chat what was planned and how to veto.

⛔ **Do not invent requirements.** Requirements come from the owner (chat or `idea`). The loop
proposes order and cut. ⛔ **Do not estimate.** ⛔ **Do not declare "does not exist"** before
searching for the verb, not only the label.
