---
name: release
description: Cuts a release at a milestone close — proves the gate, tags a version, writes CHANGELOG and GitHub Release notes for users, and runs the open-source hygiene pass. TRIGGER when a milestone has no card left, when the user asks to release, or as step F of /liminal. Also activates on /release.
---

# /release — ship like a company would

A milestone that closes is a release. Users (and future contributors) read the release, not the
board.

## 1 · Prove the gate

Run what the milestone's row in `plan.md` asks. Paste the evidence (outputs, screenshot paths,
measurements) in the `milestone` issue. Gate failed → new card in the milestone (`Backlog`, spec on
the spot) and stop here.

## 2 · Version and notes

- Tag `v0.<milestone number>.0` (e.g. M1 → `v0.1.0`); patch releases within a milestone only for
  fixes the owner asks to ship.
- `CHANGELOG.md` (Keep a Changelog): **Added · Changed · Fixed · Known limitations**, written for
  a user, not for the board: what they can do now, in one line each; no card ids in the headline
  (link them at the end).
- GitHub Release with the same notes plus **how to try it** (the commands until packaging exists in
  M5) and **what to listen for**.
- `open-source-steward` pass: README current, CONTRIBUTING and templates valid, licence headers
  where needed, no secret or personal data in the tree, issues triaged with labels.

## 3 · Close and open

Close the `milestone` issue and the milestone. Open the next: create the milestone and its
`milestone` issue with the gate from `plan.md`. Memory cleanup pass (process §12 › Maintenance).
One line in the journal. One line in the chat: version, what changed, how to try it.

🔴 Never name a person in notes or changelog. Never ship `--remote-debugging-port` in a build.
