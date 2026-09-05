from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from board.github import GitHub
from board.project import Board, Item

CARD = """---
id: M9-01
title: A card that exists
milestone: M9
area: infra
priority: P1
depends_on: []
listening: false
issue:
---

## Context

Something to do.

## What to do

- the work.

## Done when

- [ ] it works — proof: a test.

## Out of scope

Nothing.

## Risks and questions

None.
"""


class FakeGitHub(GitHub):
    def __init__(self, issues: list[dict[str, Any]] | None = None) -> None:
        super().__init__(owner="owner", name="liminal")
        self.issues = issues or []
        self.milestones = [{"title": "M9 · Test", "number": 9}]
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []
        self.next_number = 100

    def paged(self, path: str) -> list[Any]:
        if "milestones" in path:
            return self.milestones
        return self.issues

    def api(self, path: str, method: str = "GET", body: dict[str, Any] | None = None) -> Any:
        self.calls.append((path, method, body))
        if method == "POST" and path.endswith("/issues"):
            issue = {
                "number": self.next_number,
                "node_id": f"NODE{self.next_number}",
                "title": (body or {}).get("title", ""),
                "body": (body or {}).get("body", ""),
                "labels": [{"name": name} for name in (body or {}).get("labels", [])],
                "milestone": {"number": 9, "title": "M9 · Test"},
                "state": "open",
            }
            self.next_number += 1
            self.issues.append(issue)
            return issue
        return {}


class FakeBoard(Board):
    def __init__(self, items: list[Item] | None = None) -> None:
        super().__init__(github=FakeGitHub(), id="PVT", number=1, fields={})
        self._items = items or []
        self.applied: list[tuple[str, str, str]] = []

    def items(self) -> list[Item]:
        return self._items

    def add_issue(self, issue_node_id: str) -> str:
        return f"ITEM-{issue_node_id}"

    def set_single_select(self, item_id: str, field_name: str, option_name: str) -> None:
        self.applied.append((item_id, field_name, option_name))


def make_item(number: int, board_status: str) -> Item:
    return Item(
        id=f"ITEM{number}",
        number=number,
        title="M9-01 · A card that exists",
        state="open",
        labels=["area:infra"],
        milestone="M9 · Test",
        fields={"Status": board_status},
    )


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    folder = tmp_path / "docs" / "specs" / "M9-test"
    folder.mkdir(parents=True)
    (folder / "M9-01.md").write_text(CARD, encoding="utf-8")
    return tmp_path
