from __future__ import annotations

import argparse
import json
from typing import Any

from board import state, status
from board.context import Context, emit, git
from board.project import Item
from board.specs import Card

PRIORITIES = ("P0", "P1", "P2", "P3")
HEARD_OK = "heard: ok"


def milestone_key(item: Item) -> tuple[int, str]:
    title = item.milestone or "zzz"
    return (0, title) if title else (1, title)


def priority_rank(card: Card | None, item: Item) -> int:
    value = item.fields.get("Priority") or (card.priority if card else "P2")
    return PRIORITIES.index(value) if value in PRIORITIES else len(PRIORITIES)


def summarize(item: Item, card: Card | None) -> dict[str, Any]:
    return {
        "issue": item.number,
        "id": card.id if card else item.title.split(" · ")[0],
        "title": item.title,
        "status": item.status,
        "priority": item.fields.get("Priority"),
        "milestone": item.milestone,
        "labels": item.labels,
        "dependsOn": card.depends_on if card else [],
        "listening": item.fields.get("Listening") == "yes",
    }


def board_view(context: Context) -> dict[str, Any]:
    items = context.items()
    cards = {card.issue: card for card in context.cards() if card.issue}
    done = {
        (cards[item.number].id if item.number in cards else item.title.split(" · ")[0])
        for item in items
        if item.status == status.DONE
    }
    open_milestone = next(
        (
            item.milestone
            for item in sorted(items, key=milestone_key)
            if item.milestone and item.status != status.DONE
        ),
        None,
    )

    blocked: list[dict[str, Any]] = []
    decisions: list[dict[str, Any]] = []
    ready: list[tuple[int, str, dict[str, Any]]] = []
    promotable: list[dict[str, Any]] = []

    for item in items:
        card = cards.get(item.number or 0)
        entry = summarize(item, card)
        if item.status == status.DECISION_NEEDED:
            decisions.append(entry)
            continue
        if item.status == status.BLOCKED or "blocked" in item.labels:
            blocked.append(entry)
            continue
        if "question" in item.labels:
            blocked.append(entry | {"reason": "an open question"})
            continue
        if item.milestone != open_milestone:
            continue
        unmet = [name for name in entry["dependsOn"] if name not in done]
        if unmet:
            continue
        if item.status == status.READY:
            ready.append((priority_rank(card, item), entry["id"], entry))
        elif item.status == status.SPECIFIED:
            promotable.append(entry)

    return {
        "openMilestone": open_milestone,
        "ready": [entry for _, _, entry in sorted(ready, key=lambda row: (row[0], row[1]))],
        "promotable": sorted(promotable, key=lambda entry: str(entry["id"])),
        "blocked": blocked,
        "decisionsNeeded": decisions,
        "cardsToMove": cards_to_move(context, items, cards),
    }


def cards_to_move(
    context: Context, items: list[Item], cards: dict[int, Card]
) -> list[dict[str, Any]]:
    branches = git(context.root, "branch", "--format=%(refname:short)").splitlines()
    moves: list[dict[str, Any]] = []
    for item in items:
        card = cards.get(item.number or 0)
        if card is None or item.status in (*status.PARKING, status.DONE):
            continue
        marks = (f"-{item.number}-", f"/{item.number}-")
        has_branch = any(mark in branch for branch in branches for mark in marks)
        if has_branch and item.status in (status.READY, status.SPECIFIED):
            moves.append({"issue": item.number, "from": item.status, "to": status.IN_PROGRESS})
    return moves


def pull_requests(context: Context) -> dict[str, Any]:
    fields = "number,title,headRefName,isDraft,mergeable,statusCheckRollup,body,comments"
    output = context.github.runner(
        ["pr", "list", "--repo", context.github.repo, "--author", "@me", "--state", "open",
         "--json", fields],
        None,
    )
    mine: list[dict[str, Any]] = []
    for entry in json.loads(output or "[]"):
        checks = entry.get("statusCheckRollup") or []
        failed = [
            check.get("name") or check.get("context")
            for check in checks
            if (check.get("conclusion") or check.get("state")) in ("FAILURE", "TIMED_OUT", "ERROR")
        ]
        waiting = ("", None, "PENDING", "IN_PROGRESS")
        pending = [
            check
            for check in checks
            if (check.get("conclusion") or check.get("state")) in waiting
        ]
        comments = entry.get("comments") or []
        mine.append(
            {
                "number": entry["number"],
                "title": entry["title"],
                "branch": entry["headRefName"],
                "draft": entry["isDraft"],
                "ci": "failing" if failed else ("pending" if pending else "green"),
                "failedChecks": failed,
                "conflicts": entry.get("mergeable") == "CONFLICTING",
                "heardOk": any(
                    HEARD_OK in (comment.get("body") or "").lower() for comment in comments
                ),
                "cardsDelivered": closes(entry.get("body") or ""),
            }
        )
    return {"mine": mine}


def closes(body: str) -> list[int]:
    import re

    return [int(number) for number in re.findall(r"(?:Closes|Fixes) #(\d+)", body, re.IGNORECASE)]


def git_view(context: Context) -> dict[str, Any]:
    root = context.root
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD")
    behind = git(root, "rev-list", "--count", f"{branch}..origin/main")
    merged = git(root, "branch", "--merged", "main", "--format=%(refname:short)")
    return {
        "dirtyTree": bool(git(root, "status", "--porcelain")),
        "branch": branch,
        "behindMain": int(behind or 0),
        "mergedBranches": [
            line.strip()
            for line in merged.splitlines()
            if line.strip() not in ("main", "")
        ],
    }


def inbox(context: Context) -> dict[str, Any]:
    watermark = state.load(context.root).get("lastRun")
    query = f"repos/{context.github.repo}/issues/comments?per_page=100&sort=created&direction=desc"
    comments = context.github.paged(query)
    fresh = [
        {
            "issue": int(str(comment["issue_url"]).rsplit("/", 1)[-1]),
            "author": comment["user"]["login"],
            "at": comment["created_at"],
            "body": comment["body"][:400],
        }
        for comment in comments
        if watermark is None or comment["created_at"] > watermark
    ]
    return {
        "newComments": fresh[:30],
        "heardOk": [entry for entry in fresh if HEARD_OK in entry["body"].lower()],
        "since": watermark,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.queue")
    parser.add_argument("--only", choices=["prs", "board", "inbox", "git"])
    parser.add_argument("--mark", action="store_true")
    arguments = parser.parse_args(argv)

    context = Context.open()
    sections = {
        "board": lambda: board_view(context),
        "prs": lambda: pull_requests(context),
        "inbox": lambda: inbox(context),
        "git": lambda: git_view(context),
    }
    wanted = [arguments.only] if arguments.only else list(sections)
    payload: dict[str, Any] = {}
    for name in wanted:
        try:
            payload[name] = sections[name]()
        except Exception as error:
            payload[name] = {"error": str(error)}

    if arguments.mark:
        saved = state.load(context.root)
        saved["lastRun"] = state.now()
        state.save(context.root, saved)
    return emit(payload)


if __name__ == "__main__":
    raise SystemExit(main())
