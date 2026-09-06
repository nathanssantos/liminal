# Components — the design system (`@liminal/ui`)

> One package, `@liminal/ui` (under `packages/`), holds every reusable piece of interface: the tokens, thin wrappers
> over Radix Primitives for behaviour and accessibility, and the audio controls no library ships.
> The app composes them; product-specific composites (the queue entry, the layer map row, the
> soundcheck card) live in `apps/desktop` and are built only from what is here. This file is the
> catalogue; it is updated in the same PR as the component (process §16).

## The rules

- **Radix Primitives for behaviour, our tokens for looks.** Slider, Select, Toggle, Switch,
  Dialog, Popover, Tooltip, Tabs, Checkbox, Dropdown come from `radix-ui`, unstyled, wrapped once
  here with our tokens and our class names. No Radix Themes, no shadcn: the look is
  `docs/design/principles.md`, not someone else's.
- **Audio controls are ours**, built with the same accessibility contract Radix uses (`role`,
  keyboard, `aria-valuetext`): Knob (with centre detent and a value while dragging), Fader, Meter,
  Transport, Readout, StepGrid, Waveform/Timeline (canvas), DurationField (the dwell time control).
- **A component is born when a screen needs it**, named by what it is, never by the screen that
  asked first. If a second music app could use it, it belongs here; if only liminal's set could,
  it stays in the app as a composite.
- **Every component ships with:** its API (props, no boolean positional), every state (rest,
  hover, focus, active, disabled, loading, error, empty where it applies), tokens only (no loose
  value), keyboard and screen-reader behaviour, a story per state, a test per behaviour rule
  (React Testing Library + axe), and a screenshot at 1024/1440/1920 in the card's evidence.
- **Storybook exercises everything.** Every component has an autodocs page; every prop is an
  `argType` with controls; a story per state and per variant (not one story with knobs — a story
  is a named, reachable state the `ui-designer` and the reviewers can open by name); interaction
  tests (`play`) for the keyboard contract; `addon-a11y` on every story; the three widths as
  viewports. Stories are for design, review and evidence, not proof: the gate is still the real
  screen (`docs/process.md › §3.4`). A story for a state nobody reaches is dead code.
- **Change is additive.** A new variant is a new prop with a default that preserves what exists;
  the machine's `design-system-guardian` and the `ui-quality-reviewer` check every consumer.
- **What shipped before the system is brought into it**, not left beside it: a screen or a
  control built before a rule existed gets a follow-up card the moment the rule lands (process
  §16 › Code follows the docs).

## Catalogue

| Component | Job | On | Since |
|---|---|---|---|
| `tokens.css` | colour, space, radius, type, motion — roles, not values; both themes | — | M1-07 |
| `Button` | an action; variants `primary` · `quiet` · `danger`; sizes | Radix Slot | M1-07 |
| `Toggle` | a two-state control with a name (mute, solo, a layer) | Radix Toggle | M1-07 |
| `Slider` | a value in a range with keyboard steps (volume, trims, dwell) | Radix Slider | M1-07 |
| `Select` | one of the system's options (output device) | Radix Select | M1-07 |
| `Readout` | tempo · key · `bar:beat` · elapsed, `tabular-nums`, no layout shift | ours | M1-07 |
| `Transport` | play / pause / stop with state visible without colour | ours + Button | M1-07 |
| `ErrorStrip` | what went wrong and the one action | ours | M1-07 |
| `Tooltip`, `Dialog`, `Popover`, `Tabs`, `Switch`, `Checkbox`, `Dropdown` | as needed | Radix | when a screen asks |
| `Knob` | a rotary value with a centre detent (the filter sweep) | ours | M4 |
| `Fader`, `Meter` | a level and the signal | ours | M4–M5 |
| `StepGrid` | a phrase as steps (the layer map's pattern) | ours | M5 |
| `DurationField` | a dwell time in one gesture | ours + Slider | M5 |
| `Waveform`, `Timeline` | the deck (canvas), after research R26 | ours | M5 |

## Where things live

```
packages/ui/
  src/tokens.css            the tokens (moved here from apps/desktop; the app imports them)
  src/<Component>/          <Component>.tsx · <Component>.test.tsx · <Component>.stories.tsx
  src/index.ts              the public surface
  .storybook/               Storybook (Vite builder, addon-a11y)
```

`@liminal/ui` imports nothing internal; `apps/desktop` imports it. The boundary test knows.
