from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

from board.context import SPECS, emit, git, repo_root
from board.specs import load_cards

REVIEW_ROOT = Path("/tmp/liminal-review")
EVIDENCE = Path("evidence")
STATE_FILE = "review.json"
BLOCKING = "blocking"

Runner = Callable[[Sequence[str], Path], int]


def shell(command: Sequence[str], cwd: Path) -> int:
    return subprocess.run(list(command), cwd=cwd, capture_output=True, text=True).returncode


def state_path(root: Path, card: str) -> Path:
    return root / EVIDENCE / card / STATE_FILE


def load_state(root: Path, card: str) -> dict[str, Any]:
    path = state_path(root, card)
    if not path.exists():
        return {
            "card": card,
            "round": 0,
            "head": None,
            "reviewedHead": None,
            "deepPassHead": None,
            "measured": [],
            "findings": [],
        }
    loaded: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return loaded


def save_state(root: Path, card: str, state: dict[str, Any]) -> None:
    path = state_path(root, card)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


BRANCH_ISSUE = re.compile(r"^feat/(\d+)-")


def issue_on_this_branch(root: Path) -> int | None:
    match = BRANCH_ISSUE.match(git(root, "rev-parse", "--abbrev-ref", "HEAD"))
    return None if match is None else int(match.group(1))


def card_on_this_branch(root: Path) -> str | None:
    issue = issue_on_this_branch(root)
    if issue is None:
        return None
    return next((card.id for card in load_cards(root / SPECS) if card.issue == issue), None)


def branch_of(root: Path) -> str:
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD")
    return "detached" if branch in ("", "HEAD") else branch


def prepared_path(base: Path, branch: str, head: str) -> Path:
    return base / branch.replace("/", "-") / head


def drop(root: Path, path: Path, runner: Runner) -> None:
    runner(["git", "worktree", "remove", "--force", str(path)], root)
    shutil.rmtree(path, ignore_errors=True)


def drop_older_heads(root: Path, keep: Path, runner: Runner) -> list[str]:
    room = keep.parent
    if not room.exists():
        return []
    keeping = (keep.name, f"{keep.name}-scratch")
    stale = sorted(entry for entry in room.iterdir() if entry.name not in keeping)
    for entry in stale:
        if entry.name.endswith("-scratch"):
            for copy in sorted(entry.iterdir()):
                drop(root, copy, runner)
            shutil.rmtree(entry, ignore_errors=True)
        else:
            drop(root, entry, runner)
    if stale:
        runner(["git", "worktree", "prune"], root)
    return [str(entry) for entry in stale]


def prepare(
    root: Path,
    card: str,
    *,
    base: Path = REVIEW_ROOT,
    runner: Runner = shell,
) -> dict[str, Any]:
    branch = branch_of(root)
    head = git(root, "rev-parse", "HEAD")
    path = prepared_path(base, branch, head)
    dropped = drop_older_heads(root, path, runner)
    installed = False
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        runner(["git", "worktree", "add", "--detach", str(path), head], root)
    if not (path / "node_modules").exists():
        if runner(["pnpm", "install", "--offline"], path) != 0:
            runner(["pnpm", "install"], path)
        installed = True
    state = load_state(root, card)
    state["head"] = head
    save_state(root, card, state)
    return {
        "reviewPath": str(path),
        "head": head,
        "reviewedHead": state["reviewedHead"],
        "round": state["round"] + 1,
        "installed": installed,
        "dropped": dropped,
    }


def scratch(
    root: Path,
    card: str,
    *,
    base: Path = REVIEW_ROOT,
    runner: Runner = shell,
) -> dict[str, Any]:
    prepared = Path(prepare(root, card, base=base, runner=runner)["reviewPath"])
    head = git(root, "rev-parse", "HEAD")
    room = prepared.parent / f"{prepared.name}-scratch"
    room.mkdir(parents=True, exist_ok=True)
    taken = len(list(room.iterdir()))
    path = room / f"copy-{taken}"
    while path.exists():
        taken += 1
        path = room / f"copy-{taken}"
    runner(["git", "worktree", "add", "--detach", str(path), head], root)
    if runner(["pnpm", "install", "--offline"], path) != 0:
        runner(["pnpm", "install"], path)
    return {"scratchPath": str(path), "of": str(prepared)}


def clean_scratch(
    root: Path,
    card: str,
    *,
    base: Path = REVIEW_ROOT,
    runner: Runner = shell,
) -> dict[str, Any]:
    branch = branch_of(root)
    head = git(root, "rev-parse", "HEAD")
    room = prepared_path(base, branch, head).parent / f"{head}-scratch"
    removed = sorted(str(entry) for entry in room.iterdir()) if room.exists() else []
    for entry in removed:
        runner(["git", "worktree", "remove", "--force", entry], root)
    shutil.rmtree(room, ignore_errors=True)
    runner(["git", "worktree", "prune"], root)
    return {"removed": removed}


def round_done(
    root: Path,
    card: str,
    head: str,
    *,
    deep: bool = False,
    measured: list[str] | None = None,
) -> dict[str, Any]:
    state = load_state(root, card)
    state["round"] = state["round"] + 1
    state["head"] = head
    state["reviewedHead"] = head
    if deep:
        state["deepPassHead"] = head
        state["measured"] = sorted(measured or [])
    save_state(root, card, state)
    return state


SEVERITIES = ("blocking", "major", "minor")

STATUSES = ("open", "fixed", "discarded", "accepted")


REQUIRED = ("agent", "round", "summary")


def refuse_malformed(findings: list[dict[str, Any]]) -> None:
    for finding in findings:
        if not isinstance(finding, dict):
            raise ValueError(f"a finding is a mapping, not {type(finding).__name__}")
        for field, allowed in (("severity", SEVERITIES), ("status", STATUSES)):
            given = finding.get(field)
            if given not in allowed:
                raise ValueError(f"a finding's {field} is one of {allowed}, not {given!r}")
        for field in REQUIRED:
            if finding.get(field) in (None, ""):
                raise ValueError(f"a finding carries an {field}; the gate reads it")


def record_findings(root: Path, card: str, findings: list[dict[str, Any]]) -> dict[str, Any]:
    refuse_malformed(findings)
    state = load_state(root, card)
    replaced = {(f.get("agent"), f.get("round")) for f in findings}
    kept = [f for f in state["findings"] if (f.get("agent"), f.get("round")) not in replaced]
    state["findings"] = kept + findings
    save_state(root, card, state)
    return state


def open_blocking(state: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        finding
        for finding in state["findings"]
        if finding.get("status") == "open" and finding.get("severity") == BLOCKING
    ]


def under_any(path: str, measured: list[str]) -> bool:
    return any(path == entry or path.startswith(entry.rstrip("/") + "/") for entry in measured)


def review_blockers(root: Path, card: str, head: str, changed: list[str]) -> list[str]:
    state = load_state(root, card)
    reasons = [
        f"blocking finding still open: {finding['summary']}" for finding in open_blocking(state)
    ]
    deep = state.get("deepPassHead")
    if not deep:
        reasons.append("no deep pass recorded")
        return reasons
    if deep == head:
        return reasons
    measured = state.get("measured", [])
    touched = sorted(path for path in changed if under_any(path, measured))
    if touched:
        reasons.append(f"the deep pass was not run on {head}, and it measured {', '.join(touched)}")
    return reasons


def merge_blockers(root: Path, card: str, head: str) -> list[str]:
    state = load_state(root, card)
    deep = state.get("deepPassHead")
    changed = changed_since(root, deep, head) if deep else []
    return review_blockers(root, card, head, changed)


def changed_since(root: Path, deep: str, head: str) -> list[str]:
    diff = git(root, "diff", "--name-only", f"{deep}...{head}")
    return [line for line in diff.splitlines() if line]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.review")
    parser.add_argument("--card")
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--scratch", action="store_true")
    parser.add_argument("--clean", action="store_true")
    parser.add_argument("--state", action="store_true")
    parser.add_argument("--round-done", action="store_true")
    parser.add_argument("--deep", action="store_true")
    parser.add_argument("--measured", nargs="*", default=[])
    parser.add_argument("--findings")
    arguments = parser.parse_args(argv)

    root = repo_root()
    card = arguments.card or card_on_this_branch(root)
    if card is None:
        return emit({"error": "no --card given and the branch does not name an issue with a card"})
    if arguments.prepare:
        return emit(prepare(root, card))
    if arguments.scratch:
        if arguments.clean:
            return emit(clean_scratch(root, card))
        return emit(scratch(root, card))
    if arguments.findings:
        given = json.loads(Path(arguments.findings).read_text(encoding="utf-8"))
        try:
            return emit(record_findings(root, card, given))
        except ValueError as refused:
            return emit({"error": str(refused)})
    if arguments.round_done:
        head = git(root, "rev-parse", "HEAD")
        return emit(round_done(root, card, head, deep=arguments.deep,
                               measured=list(arguments.measured)))
    if arguments.state:
        return emit(load_state(root, card))
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
