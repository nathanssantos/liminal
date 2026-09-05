# Security

## Reporting a vulnerability

Report privately through GitHub's
[security advisories](https://github.com/nathanssantos/liminal/security/advisories/new). Please do
not open a public issue for a vulnerability.

Say what you found, how to reproduce it, and what an attacker could do with it. You will get an
answer, and the fix will land as a normal card with its own spec and evidence.

## What this project handles

liminal runs on your machine. It downloads audio from a reference link into a local cache,
measures it, and generates its own music from those numbers — none of the original audio enters
the set. It talks to an LLM through Claude Code's credential. It has no accounts, no server and no
telemetry.

## Secrets

No secret lives in the tree. The scripts use the authenticated `gh` command. The repository has a
single GitHub Actions secret, `BOARD_TOKEN`, used only by the workflow that mirrors the specs onto
the board. Adding a second one is a decision the owner records.
