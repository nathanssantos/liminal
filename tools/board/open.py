from __future__ import annotations

import argparse
import json
import re
from typing import Any

from board import memory, status
from board.context import Context, emit, git
from board.project import Item
from board.specs import Card

SECTION = re.compile(r"^## (?P<name>.+)$", re.MULTILINE)


def sections(body: str) -> dict[str, str]:
    found: dict[str, str] = {}
    matches = list(SECTION.finditer(body))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        found[match["name"].strip()] = body[match.end() : end].strip()
    return found


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def barriers(card: Card | None, item: Item, done: set[str]) -> list[str]:
    found: list[str] = []
    if item.status == status.DECISION_NEEDED:
        found.append("the card waits on a course decision")
    if item.status == status.BLOCKED or "blocked" in item.labels:
        found.append("the card is blocked")
    if "question" in item.labels:
        found.append("an open question on the issue")
    if card is not None:
        unmet = [name for name in card.depends_on if name not in done]
        if unmet:
            found.append(f"dependencies not done: {', '.join(unmet)}")
        if card.missing_sections:
            found.append(f"the spec is incomplete: {', '.join(card.missing_sections)}")
    return found


def repo_already_has(context: Context, terms: list[str]) -> dict[str, Any]:
    manifests = sorted(context.root.glob("packages/*/package.json")) + sorted(
        context.root.glob("apps/*/package.json")
    )
    dependencies: dict[str, str] = {}
    for path in manifests:
        parsed = json.loads(path.read_text(encoding="utf-8"))
        for group in ("dependencies", "devDependencies"):
            dependencies.update(parsed.get(group, {}))
    symbols: list[str] = []
    for term in terms:
        found = git(context.root, "grep", "-l", "-i", term, "--", "packages", "apps", "tools")
        symbols += [f"{term}: {line}" for line in found.splitlines()[:5]]
    return {
        "dependencies": sorted(dependencies),
        "symbols": symbols,
        "precedents": [str(path.parent.relative_to(context.root)) for path in manifests],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.open")
    parser.add_argument("number", type=int)
    parser.add_argument("--search", nargs="*", default=[])
    arguments = parser.parse_args(argv)

    context = Context.open()
    item = context.item_by_issue(arguments.number)
    if item is None:
        return emit({"error": f"issue #{arguments.number} is not on the board"})
    cards = context.cards()
    card = next((entry for entry in cards if entry.issue == arguments.number), None)
    done = {
        entry.id
        for entry in cards
        if (other := context.item_by_issue(entry.issue or 0)) and other.status == status.DONE
    }

    blockers = barriers(card, item, done)
    dirty = bool(git(context.root, "status", "--porcelain"))
    branches = [
        line.strip()
        for line in git(context.root, "branch", "--format=%(refname:short)").splitlines()
        if str(arguments.number) in line
    ]
    verdict = "BLOCKED" if blockers else ("CHECK" if dirty else "CLEARED")

    comments = context.github.paged(
        f"repos/{context.github.repo}/issues/{arguments.number}/comments?per_page=100"
    )
    area = card.area if card else ""
    payload = {
        "verdict": verdict,
        "barriers": blockers,
        "card": {
            "id": card.id if card else None,
            "frontmatter": card.document.front if card else {},
            "sections": sections(card.document.body) if card else {},
            "issue": {
                "number": item.number,
                "title": item.title,
                "labels": item.labels,
                "milestone": item.milestone,
                "status": item.status,
            },
            "comments": [
                {"author": entry["user"]["login"], "at": entry["created_at"], "body": entry["body"]}
                for entry in comments
            ],
        },
        "memory": memory.for_area(context.root, area) if area else {},
        "repoAlreadyHas": repo_already_has(context, list(arguments.search)),
        "suggestedBranch": f"feat/{arguments.number}-{slug(card.title if card else item.title)}",
        "dirtyTree": dirty,
        "branchesCiting": branches,
    }
    return emit(payload)


if __name__ == "__main__":
    raise SystemExit(main())
