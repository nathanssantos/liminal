from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from board.context import Context, emit, git, repo_root
from board.review import card_for_issue, issue_in_branch, merge_blockers
from board.stale import stale_docs

GATES_LOG = Path("evidence") / "_gates"
COMMENT = re.compile(r"^\+\s*(//|/\*|#(?!\!)|\*\s)")

PROSE_AND_LOCKS = (":!*.lock", ":!*lock.yaml", ":!*.md", ":!*.json")
ALLOWED_COMMENT = re.compile(r"biome-ignore|eslint-disable|noqa|type:\s*ignore|TODO\(#\d+\)|MOCK:")
CONVENTIONAL = re.compile(
    r"^(feat|fix|docs|chore|ci|refactor|test|perf|build|style|revert)(\([a-z0-9-]+\))?!?: .+"
)


@dataclass
class Gate:
    name: str
    passed: bool
    detail: Any


def run(command: list[str], root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=root, capture_output=True, text=True, check=False)


def check_gate(root: Path) -> Gate:
    log = root / GATES_LOG / f"{datetime.now(UTC).strftime('%Y-%m-%dT%H%M%SZ')}.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    result = run(["pnpm", "check"], root)
    log.write_text(result.stdout + result.stderr, encoding="utf-8")
    return Gate("check", result.returncode == 0, {"log": str(log.relative_to(root))})


def comments_gate(root: Path, base: str = "origin/main") -> Gate:
    diff = git(root, "diff", f"{base}...HEAD", "--", ".", *PROSE_AND_LOCKS)
    offenders = [
        line
        for line in diff.splitlines()
        if COMMENT.match(line) and not ALLOWED_COMMENT.search(line)
    ]
    return Gate("no comments", not offenders, offenders[:20])


def stale_docs_gate(root: Path) -> Gate:
    stale = stale_docs(root)
    return Gate("docs current", not stale, stale)


def commit_messages_gate(root: Path, base: str = "origin/main") -> Gate:
    subjects = git(root, "log", "--format=%s", f"{base}..HEAD").splitlines()
    bad = [
        subject
        for subject in subjects
        if len(subject) > 72 or not CONVENTIONAL.match(subject)
    ]
    return Gate("commit messages", not bad, bad)


def rebase_only(root: Path, base: str = "origin/main") -> dict[str, Any]:
    before = int(git(root, "rev-list", "--count", f"{base}..HEAD") or 0)
    result = run(["git", "rebase", "--reapply-cherry-picks", base], root)
    if result.returncode != 0:
        run(["git", "rebase", "--abort"], root)
        return {"verdict": "ABORTED", "reason": result.stderr.strip()[:500]}
    after = int(git(root, "rev-list", "--count", f"{base}..HEAD") or 0)
    if after != before:
        return {"verdict": "ABORTED", "reason": f"commit count changed {before} -> {after}"}
    behind = int(git(root, "rev-list", "--count", f"HEAD..{base}") or 0)
    return {"verdict": "OK", "commits": after, "behind": behind}


def review_gate(root: Path, branch: str, head: str) -> Gate:
    issue = issue_in_branch(branch)
    if issue is None:
        return Gate("review", True, f"branch {branch} names no issue, so there is no review")
    card = card_for_issue(root, issue)
    if card is None:
        return Gate("review", False, f"branch {branch} names issue {issue}, which no spec claims")
    reasons = merge_blockers(root, card, head)
    return Gate("review", not reasons, reasons)


def pull_request_head(context: Context, number: int) -> tuple[str, str]:
    output = context.github.runner(
        [
            "pr", "view", str(number), "--repo", context.github.repo,
            "--json", "headRefName,headRefOid",
        ],
        None,
    )
    seen = json.loads(output)
    return str(seen["headRefName"]), str(seen["headRefOid"])


def gates(root: Path) -> dict[str, Any]:
    collected = [
        check_gate(root),
        comments_gate(root),
        stale_docs_gate(root),
        commit_messages_gate(root),
    ]
    return {
        "verdict": "PASS" if all(gate.passed for gate in collected) else "FAIL",
        "gates": [
            {"name": gate.name, "passed": gate.passed, "detail": gate.detail} for gate in collected
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.deliver")
    parser.add_argument("--gates-only", action="store_true")
    parser.add_argument("--rebase-only", action="store_true")
    parser.add_argument("--stale-docs", action="store_true")
    parser.add_argument("--open", action="store_true")
    parser.add_argument("--title")
    parser.add_argument("--description")
    parser.add_argument("--ready", type=int)
    parser.add_argument("--merge", type=int)
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args(argv)

    root = repo_root()
    if arguments.stale_docs:
        stale = stale_docs(root)
        return emit({"staleDocs": stale, "verdict": "PASS" if not stale else "FAIL"})
    if arguments.gates_only:
        return emit(gates(root))
    if arguments.rebase_only:
        return emit(rebase_only(root))

    context = Context.open()
    if arguments.open:
        if not arguments.title or not arguments.description:
            return emit({"error": "--open needs --title and --description"})
        body = Path(arguments.description).read_text(encoding="utf-8")
        if arguments.dry_run:
            return emit({"title": arguments.title, "body": body})
        output = context.github.runner(
            ["pr", "create", "--repo", context.github.repo, "--draft",
             "--title", arguments.title, "--body", body, "--base", "main"],
            None,
        )
        return emit({"url": output.strip()})
    if arguments.ready:
        context.github.runner(
            ["pr", "ready", str(arguments.ready), "--repo", context.github.repo], None
        )
        return emit({"ready": arguments.ready})
    if arguments.merge:
        verdict = gates(root)
        branch, head = pull_request_head(context, arguments.merge)
        review = review_gate(root, branch, head)
        verdict["gates"].append(
            {"name": review.name, "passed": review.passed, "detail": review.detail}
        )
        if not review.passed:
            verdict["verdict"] = "FAIL"
        if verdict["verdict"] != "PASS":
            return emit(verdict)
        context.github.runner(
            ["pr", "merge", str(arguments.merge), "--repo", context.github.repo,
             "--squash", "--delete-branch"],
            None,
        )
        return emit({"merged": arguments.merge})
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
