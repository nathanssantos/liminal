from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from board import frontmatter, state, status
from board.context import Context, emit
from board.project import Item
from board.specs import Card


def set_by_human(card: Card | None, item: Item) -> bool:
    if card is None:
        return False
    if card.sync.get("statusBy") == "human":
        return True
    written = card.sync.get("status")
    return written is not None and item.status is not None and item.status != written


def plan(
    card: Card | None, item: Item, target: str, reason: str | None, unblock: bool
) -> dict[str, Any]:
    if unblock:
        previous = (card.sync.get("previousStatus") if card else None) or status.SPECIFIED
        target = str(previous)
    if target not in status.ALL:
        return {"error": f"unknown status {target!r}"}
    if target in status.PARKING and not reason:
        return {"error": f"moving to {target!r} needs --reason"}
    if set_by_human(card, item) and status.rank(target) < status.rank(item.status):
        return {"error": f"{item.status!r} was set by a human; the loop does not demote it"}
    return {"from": item.status, "to": target, "by": "loop"}


def write_card(card: Card, item: Item, target: str) -> None:
    sync = dict(card.sync)
    if target in status.PARKING and item.status not in status.PARKING:
        sync["previousStatus"] = item.status
    sync["status"] = target
    sync["statusBy"] = "loop"
    sync["at"] = state.now()
    card.document.front["sync"] = sync
    card.path.write_text(frontmatter.dump(card.document), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.move")
    parser.add_argument("number", type=int)
    parser.add_argument("status", nargs="?", default="")
    parser.add_argument("--reason")
    parser.add_argument("--unblock", action="store_true")
    arguments = parser.parse_args(argv)

    context = Context.open()
    item = context.item_by_issue(arguments.number)
    if item is None:
        return emit({"error": f"issue #{arguments.number} is not on the board"})
    card = context.card_by_issue(arguments.number)

    reason = Path(arguments.reason).read_text(encoding="utf-8") if arguments.reason else None
    result = plan(card, item, arguments.status, reason, arguments.unblock)
    if "error" in result:
        return emit(result)

    if reason:
        context.github.api(
            f"repos/{context.github.repo}/issues/{arguments.number}/comments",
            "POST",
            {"body": reason},
        )
    context.board.set_single_select(item.id, "Status", str(result["to"]))
    if card is not None:
        write_card(card, item, str(result["to"]))
    return emit(result)


if __name__ == "__main__":
    raise SystemExit(main())
