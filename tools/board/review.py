from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

from board.context import emit, git, repo_root

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


def prepared_path(base: Path, branch: str, head: str) -> Path:
    return base / branch.replace("/", "-") / head


def prepare(
    root: Path,
    card: str,
    *,
    base: Path = REVIEW_ROOT,
    runner: Runner = shell,
) -> dict[str, Any]:
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD")
    head = git(root, "rev-parse", "HEAD")
    path = prepared_path(base, branch, head)
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
    }


def scratch(
    root: Path,
    card: str,
    *,
    base: Path = REVIEW_ROOT,
    runner: Runner = shell,
) -> dict[str, Any]:
    prepared = Path(prepare(root, card, base=base, runner=runner)["reviewPath"])
    room = prepared.parent / f"{prepared.name}-scratch"
    room.mkdir(parents=True, exist_ok=True)
    path = room / f"copy-{len(list(room.iterdir()))}"
    shutil.copytree(prepared, path, ignore=shutil.ignore_patterns("node_modules"))
    (path / "node_modules").symlink_to(prepared / "node_modules", target_is_directory=True)
    return {"scratchPath": str(path), "of": str(prepared)}


def clean_scratch(root: Path, card: str, *, base: Path = REVIEW_ROOT) -> dict[str, Any]:
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD")
    head = git(root, "rev-parse", "HEAD")
    room = prepared_path(base, branch, head).parent / f"{head}-scratch"
    removed = [str(entry) for entry in room.iterdir()] if room.exists() else []
    shutil.rmtree(room, ignore_errors=True)
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


def record_findings(root: Path, card: str, findings: list[dict[str, Any]]) -> dict[str, Any]:
    state = load_state(root, card)
    state["findings"] = findings
    save_state(root, card, state)
    return state


def open_blocking(state: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        finding
        for finding in state["findings"]
        if finding.get("status") == "open" and finding.get("severity") == BLOCKING
    ]


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
    measured = set(state.get("measured", []))
    touched = sorted(path for path in changed if path in measured)
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
    parser.add_argument("--card", required=True)
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--scratch", action="store_true")
    parser.add_argument("--clean", action="store_true")
    parser.add_argument("--state", action="store_true")
    parser.add_argument("--round-done", action="store_true")
    parser.add_argument("--deep", action="store_true")
    parser.add_argument("--measured", nargs="*", default=[])
    arguments = parser.parse_args(argv)

    root = repo_root()
    if arguments.prepare:
        return emit(prepare(root, arguments.card))
    if arguments.scratch:
        if arguments.clean:
            return emit(clean_scratch(root, arguments.card))
        return emit(scratch(root, arguments.card))
    if arguments.round_done:
        head = git(root, "rev-parse", "HEAD")
        return emit(round_done(root, arguments.card, head, deep=arguments.deep,
                               measured=list(arguments.measured)))
    if arguments.state:
        return emit(load_state(root, arguments.card))
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
