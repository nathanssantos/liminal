# Usability

> The flows we care about, the heuristics we hold ourselves to, and the first-run promise. The
> `usability-reviewer` reads this; every UI spec cites the flow it serves.

## The promise

**From opening the app to hearing music: one paste, one sentence, one click.** Nothing requires a
terminal. If the person does nothing, the app still shows what it is (an example set ready to play).

## The flows, in order of importance

| # | Flow | Steps we accept | Must be visible |
|---|---|---|---|
| F1 | **First run → music** | open · (optional) paste a link · (optional) type a prompt · play | what is playing, the key and BPM, that it will not stop |
| F2 | **Steer the set** | type a live prompt · see when it lands | "lands at the next phrase (in N bars)"; the change, when it happens |
| F2b | **Queue the next reference** | paste a link while playing · see it analyzed · see when the set will start moving | the queue, the current target, "moving toward <title> — N phrases left", an error with retry if analysis failed |
| F3 | **Teach taste** | one control for "more of this", one for "less" | that it was heard, and what it will affect |
| F4 | **Understand** | glance at the timeline | current section, energy curve, next transition, the reference card |
| F5 | **Recover** | an error says what and how to fix; retry is one click; stop is always one click | the error, in the user's words |
| F6 | **Keep** (after M5) | export what was heard | where it went |

## Heuristics we check (adapted to an audio app)

1. **Visibility of state** — playing / planning / downloading / error, always on screen; feedback
   within 100 ms of any action; audio never starts or stops without a visual cue.
2. **Match with the listener's language** — "reference track", "key", "tempo", "energy"; producer
   terms only behind a "details" affordance.
3. **Control and freedom** — stop, undo a prompt (revert to the previous plan), skip to the next
   section; nothing is irreversible without a confirmation.
4. **Consistency** — the same action lives in the same place with the same word on every screen.
5. **Error prevention** — invalid links are caught on paste; a prompt that cannot be honoured says
   so before, not after.
6. **Recognition over recall** — recent references and prompts are visible; the queue is a list
   you can reorder and remove from, not a hidden state; no hidden commands.
7. **Flexibility** — keyboard shortcuts for play/stop/prompt; every flow works with the keyboard alone.
8. **Minimalism** — the first screen shows F1 and nothing else; details unfold on demand.
9. **Recovery** — every error names what happened and offers the next step (retry, choose another
   link, use the example set).
10. **Help where it is needed** — a one-line hint next to the control, not a manual.

## Accessibility is usability

WCAG 2.2 AA (`CLAUDE.md › Quality targets`): keyboard path for every flow, visible focus, no
information carried by colour alone, live regions for state changes that matter (a section change,
an error), and reduced-motion respected in the timeline.

## The empty state is a state

With nothing loaded the app shows the example set (`sixteenBars` at first, a real generated set
later) ready to play, a paste box with an example link as placeholder, and one sentence saying what
will happen. An empty shell fails F1.

## How we measure

- **Action count** from open to music, per release, from the usability walk.
- **Blocking usability findings** per release.
- Later: time-to-music from the set log, prompts per session, sessions longer than 20 minutes.
