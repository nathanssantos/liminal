# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). One version per milestone.

## [Unreleased]

## [0.0.0] — 2026-09-05

The foundation. Nothing to hear yet: this release is the ground the music will be built on.

### Added

- A pnpm and Turborepo monorepo with the seven packages the architecture describes — `score`,
  `composition`, `engine`, `analysis`, `brain`, `conductor`, `protocol` — and the Electron app,
  each with a real test. The import table between packages is itself a test.
- An Electron shell that opens a window, built with electron-vite, React and Tailwind, and a
  `shot` command that drives it with Playwright and saves a screenshot with its measurements at
  1024, 1440 and 1920.
- A Python analyzer worker that speaks JSON lines over stdio and answers `ping`, with ruff,
  mypy in strict mode and pytest.
- `pnpm check`: Biome, tsc, Vitest, ruff, mypy and pytest, with the full output of each and a
  summary naming every tool that failed.
- Continuous integration on every pull request, in three jobs, with nothing silenced.
- A board whose cards are generated from the specs in `docs/specs`, kept in step both ways, and
  the scripts the autonomous loop reads it with.
- `main` protected behind a pull request with the three checks required, and a commit-msg hook
  that keeps the messages conventional.
- The documents the project is run from: the plan, the architecture, the stack, the process, the
  product strategy, the design principles, the memory and the specs of the first milestones.

[Unreleased]: https://github.com/nathanssantos/liminal/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/nathanssantos/liminal/releases/tag/v0.0.0
