from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from board import frontmatter, state, status
from board.github import GitHub, repo_from_remote
from board.project import Board, Item, find_board
from board.specs import Card, body_hash, load_cards

SPECS = Path("docs/specs")
FOOTER = re.compile(r"\n*---\n+Source of truth: \[`[^`]+`\]\([^)]+\)\s*$")
SKELETON_ID = re.compile(r"^(?P<id>M\d+-\d+)\b")


@dataclass
class Report:
    created: list[dict[str, Any]] = field(default_factory=list)
    updated: list[dict[str, Any]] = field(default_factory=list)
    pulled: list[dict[str, Any]] = field(default_factory=list)
    skeletons: list[dict[str, Any]] = field(default_factory=list)
    moved_by_human: list[dict[str, Any]] = field(default_factory=list)
    new_comments: list[dict[str, Any]] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "created": self.created,
            "updated": self.updated,
            "pulled": self.pulled,
            "skeletons": self.skeletons,
            "movedByHuman": self.moved_by_human,
            "newComments": self.new_comments,
        }


def strip_footer(body: str) -> str:
    return FOOTER.sub("", body or "").rstrip() + "\n"


class Sync:
    def __init__(
        self,
        root: Path,
        github: GitHub,
        board: Board,
        *,
        dry_run: bool = False,
        only: str | None = None,
    ) -> None:
        self.root = root
        self.github = github
        self.board = board
        self.dry_run = dry_run
        self.only = only
        self.report = Report()
        self.milestones = {
            entry["title"]: entry["number"]
            for entry in github.paged(f"repos/{github.repo}/milestones?state=all&per_page=100")
        }
        self.issues = {
            entry["number"]: entry
            for entry in github.paged(f"repos/{github.repo}/issues?state=all&per_page=100")
            if "pull_request" not in entry
        }
        self.items = {item.number: item for item in board.items() if item.number is not None}

    def run(self) -> Report:
        cards = [
            card
            for card in load_cards(self.root / SPECS)
            if self.only is None or card.milestone == self.only
        ]
        for card in cards:
            if card.issue is None:
                self.create(card)
            else:
                self.reconcile(card)
        self.find_orphan_issues({card.issue for card in cards if card.issue})
        return self.report

    def milestone_number(self, card: Card) -> int | None:
        for title, number in self.milestones.items():
            if title.split(" ")[0].lower() == card.milestone.lower():
                return int(number)
        return None

    def create(self, card: Card) -> None:
        entry = {"id": card.id, "title": card.issue_title, "status": card.status_from_spec}
        self.report.created.append(entry)
        if self.dry_run:
            return
        body = card.issue_body(self.github.repo)
        payload: dict[str, Any] = {
            "title": card.issue_title,
            "body": body,
            "labels": card.labels,
        }
        number = self.milestone_number(card)
        if number is not None:
            payload["milestone"] = number
        issue = self.github.api(f"repos/{self.github.repo}/issues", "POST", payload)
        entry["issue"] = issue["number"]
        item_id = self.board.add_issue(issue["node_id"])
        self.apply_fields(item_id, card, card.status_from_spec)
        self.write_frontmatter(card, issue["number"], body, card.status_from_spec)

    def reconcile(self, card: Card) -> None:
        issue = self.issues.get(card.issue or 0)
        if issue is None:
            self.report.updated.append({"id": card.id, "issue": card.issue, "error": "not found"})
            return
        stored = card.sync.get("hash")
        remote = body_hash(strip_footer(issue["body"] or "") + issue["title"])
        if stored is not None and remote != stored:
            if self.matches(card, issue):
                self.push(card, issue)
                return
            if self.tree_is_dirty():
                self.report.pulled.append(
                    {
                        "id": card.id,
                        "issue": card.issue,
                        "skipped": "the working tree is dirty; commit or stash, then sync again",
                    }
                )
                return
            self.pull(card, issue)
            return
        self.push(card, issue)

    def matches(self, card: Card, issue: dict[str, Any]) -> bool:
        rendered = card.issue_body(self.github.repo)
        same_body = strip_footer(issue["body"] or "") == strip_footer(rendered)
        return same_body and issue["title"] == card.issue_title

    def push(self, card: Card, issue: dict[str, Any]) -> None:
        body = card.issue_body(self.github.repo)
        wanted_milestone = self.milestone_number(card)
        current_milestone = (issue.get("milestone") or {}).get("number")
        changes: dict[str, Any] = {}
        if issue["title"] != card.issue_title:
            changes["title"] = card.issue_title
        if strip_footer(issue["body"] or "") != strip_footer(body):
            changes["body"] = body
        if sorted(label["name"] for label in issue["labels"]) != sorted(card.labels):
            changes["labels"] = card.labels
        if wanted_milestone is not None and current_milestone != wanted_milestone:
            changes["milestone"] = wanted_milestone

        item = self.items.get(card.issue or 0)
        target = self.target_status(card, item)

        if changes or target is not None:
            self.report.updated.append(
                {"id": card.id, "issue": card.issue, "fields": sorted(changes), "status": target}
            )
        if self.dry_run:
            return
        if changes:
            self.github.api(f"repos/{self.github.repo}/issues/{card.issue}", "PATCH", changes)
        if item is not None:
            self.apply_fields(item.id, card, target)
        self.write_frontmatter(card, card.issue, body, target or (item.status if item else None))

    def target_status(self, card: Card, item: Item | None) -> str | None:
        if item is None:
            return None
        written = card.sync.get("status")
        if item.status is not None and written is not None and item.status != written:
            self.report.moved_by_human.append(
                {"id": card.id, "issue": card.issue, "from": written, "to": item.status}
            )
            return None
        wanted = card.status_from_spec
        return wanted if status.advances(item.status, wanted) else None

    def apply_fields(self, item_id: str, card: Card, target: str | None) -> None:
        if target is not None:
            self.board.set_single_select(item_id, "Status", target)
        self.board.set_single_select(item_id, "Priority", card.priority)
        self.board.set_single_select(item_id, "Listening", "yes" if card.listening else "no")

    def write_frontmatter(
        self, card: Card, issue: int | None, body: str, applied: str | None
    ) -> None:
        front = card.document.front
        sync = dict(card.sync)
        wanted = body_hash(strip_footer(body) + card.issue_title)
        unchanged = (
            front.get("issue") == issue
            and sync.get("hash") == wanted
            and (applied is None or sync.get("status") == applied)
        )
        if unchanged:
            return
        front["issue"] = issue
        sync["hash"] = wanted
        sync["at"] = state.now()
        if applied is not None:
            sync["status"] = applied
        front["sync"] = sync
        card.path.write_text(frontmatter.dump(card.document), encoding="utf-8")

    def pull(self, card: Card, issue: dict[str, Any]) -> None:
        body = strip_footer(issue["body"] or "")
        title = issue["title"].split(" · ", 1)[-1]
        self.report.pulled.append({"id": card.id, "issue": card.issue})
        if self.dry_run:
            return
        card.document.body = body
        card.document.front["title"] = title
        sync = dict(card.sync)
        sync["hash"] = body_hash(body + issue["title"])
        sync["at"] = state.now()
        card.document.front["sync"] = sync
        card.path.write_text(frontmatter.dump(card.document), encoding="utf-8")
        open_sync_pull_request(self.root, card, issue["number"])

    def tree_is_dirty(self) -> bool:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=self.root,
            capture_output=True,
            text=True,
            check=False,
        )
        return bool(result.stdout.strip())

    def find_orphan_issues(self, known: set[int | None]) -> None:
        for number, issue in self.issues.items():
            if number in known or issue["state"] != "open":
                continue
            labels = {label["name"] for label in issue["labels"]}
            if labels & {"milestone", "release", "idea", "research", "decision"}:
                continue
            self.skeleton(issue)

    def skeleton(self, issue: dict[str, Any]) -> None:
        milestone = (issue.get("milestone") or {}).get("title") or self.open_milestone()
        short = milestone.split(" ")[0]
        folder = self.folder_for(short)
        match = SKELETON_ID.match(issue["title"])
        card_id = match["id"] if match else f"{short}-{issue['number']:02d}"
        path = folder / f"{card_id}.md"
        self.report.skeletons.append({"id": card_id, "issue": issue["number"], "path": str(path)})
        if self.dry_run or path.exists():
            return
        folder.mkdir(parents=True, exist_ok=True)
        path.write_text(skeleton_text(card_id, issue, short), encoding="utf-8")

    def open_milestone(self) -> str:
        titles = sorted(self.milestones)
        return titles[0] if titles else "M0 · Foundation"

    def folder_for(self, short: str) -> Path:
        root = self.root / SPECS
        for candidate in sorted(root.iterdir()):
            if candidate.is_dir() and candidate.name.startswith(f"{short}-"):
                return candidate
        return root / short


def skeleton_text(card_id: str, issue: dict[str, Any], milestone: str) -> str:
    title = issue["title"].split(" · ", 1)[-1]
    written_by_hand = "Written by hand on GitHub; the spec iteration completes it."
    context = (issue["body"] or "").strip() or written_by_hand
    return (
        f"---\nid: {card_id}\ntitle: {title}\nmilestone: {milestone}\narea: docs\n"
        f"priority: P2\ndepends_on: []\nlistening: false\nissue: {issue['number']}\n---\n\n"
        f"## Context\n\n{context}\n\n## What to do\n\n## Done when\n\n## Out of scope\n\n"
        "## Risks and questions\n"
    )


def open_sync_pull_request(root: Path, card: Card, issue: int) -> None:
    branch = f"docs/sync-{issue}"
    title = f"docs: pull the edit of issue #{issue} into {card.id}"
    body = f"The issue was edited on GitHub. The spec follows.\n\nRefs #{issue}"

    def git(*arguments: str) -> None:
        subprocess.run(["git", *arguments], cwd=root, check=True, capture_output=True, text=True)

    was_on = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()

    try:
        git("switch", "-c", branch)
        git("add", str(card.path))
        git("commit", "-m", title)
        git("push", "-u", "origin", branch)
        gh = ["gh", "pr", "create", "--title", title, "--body", body, "--base", "main"]
        subprocess.run(
            [*gh, "--head", branch], cwd=root, check=True, capture_output=True, text=True
        )
        subprocess.run(
            ["gh", "pr", "merge", branch, "--squash", "--auto", "--delete-branch"],
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        )
    finally:
        git("switch", was_on)


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True
    )
    return Path(result.stdout.strip())


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.sync")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only")
    parser.add_argument("--root", default=None)
    arguments = parser.parse_args(argv)

    root = Path(arguments.root).resolve() if arguments.root else repo_root()
    owner, name = repo_from_remote(root)
    github = GitHub(owner=owner, name=name)
    board = find_board(github)
    report = Sync(root, github, board, dry_run=arguments.dry_run, only=arguments.only).run()
    print(json.dumps(report.as_dict(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
