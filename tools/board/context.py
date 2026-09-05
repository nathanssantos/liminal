from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from board.github import GitHub, repo_from_remote
from board.project import Board, Item, find_board
from board.specs import Card, load_cards

SPECS = Path("docs") / "specs"


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True
    )
    return Path(result.stdout.strip())


def git(root: Path, *arguments: str) -> str:
    result = subprocess.run(
        ["git", *arguments], cwd=root, capture_output=True, text=True, check=False
    )
    return result.stdout.strip()


@dataclass
class Context:
    root: Path
    github: GitHub
    board: Board

    @classmethod
    def open(cls) -> Context:
        root = repo_root()
        owner, name = repo_from_remote(root)
        github = GitHub(owner=owner, name=name)
        return cls(root=root, github=github, board=find_board(github))

    def cards(self) -> list[Card]:
        return load_cards(self.root / SPECS)

    def card_by_issue(self, number: int) -> Card | None:
        return next((card for card in self.cards() if card.issue == number), None)

    def items(self) -> list[Item]:
        return self.board.items()

    def item_by_issue(self, number: int) -> Item | None:
        return next((item for item in self.items() if item.number == number), None)


def emit(payload: dict[str, Any]) -> int:
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 1 if "error" in payload else 0
