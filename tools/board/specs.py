from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

from board import frontmatter

CARD_FILE = re.compile(r"^M\d+-\d+\.md$")
REQUIRED_SECTIONS = (
    "## Context",
    "## What to do",
    "## Done when",
    "## Out of scope",
    "## Risks and questions",
)
PLACEHOLDER = re.compile(r"^\s*(-\s*\[[ x]\]\s*)?$")

STATUS_BACKLOG = "Backlog"
STATUS_SPECIFIED = "Specified"


@dataclass
class Card:
    path: Path
    document: frontmatter.Document

    @property
    def id(self) -> str:
        return str(self.document.front.get("id", self.path.stem))

    @property
    def title(self) -> str:
        return str(self.document.front.get("title", ""))

    @property
    def milestone(self) -> str:
        return str(self.document.front.get("milestone", ""))

    @property
    def area(self) -> str:
        return str(self.document.front.get("area", ""))

    @property
    def priority(self) -> str:
        return str(self.document.front.get("priority", "P2"))

    @property
    def listening(self) -> bool:
        return self.document.front.get("listening") is True

    @property
    def depends_on(self) -> list[str]:
        value = self.document.front.get("depends_on")
        return [str(item) for item in value] if isinstance(value, list) else []

    @property
    def issue(self) -> int | None:
        value = self.document.front.get("issue")
        return value if isinstance(value, int) else None

    @property
    def sync(self) -> dict[str, frontmatter.Scalar]:
        value = self.document.front.get("sync")
        return value if isinstance(value, dict) else {}

    @property
    def labels(self) -> list[str]:
        labels = [f"area:{self.area}"] if self.area else []
        if self.document.front.get("spike") is True:
            labels.append("spike")
        return labels

    @property
    def issue_title(self) -> str:
        return f"{self.id} · {self.title}"

    def issue_body(self, repo: str, branch: str = "main") -> str:
        where = self.path.as_posix()
        source = f"https://github.com/{repo}/blob/{branch}/{where}"
        footer = f"Source of truth: [`{where}`]({source})"
        return f"{self.document.body.rstrip()}\n\n---\n\n{footer}\n"

    @property
    def missing_sections(self) -> list[str]:
        body = self.document.body
        missing = [section for section in REQUIRED_SECTIONS if section not in body]
        return missing + self._empty_sections(body)

    def _empty_sections(self, body: str) -> list[str]:
        empty: list[str] = []
        for section in REQUIRED_SECTIONS:
            start = body.find(section)
            if start == -1:
                continue
            rest = body[start + len(section) :]
            end = rest.find("\n## ")
            content = rest if end == -1 else rest[:end]
            if all(PLACEHOLDER.match(line) for line in content.splitlines()):
                empty.append(section)
        return empty

    @property
    def status_from_spec(self) -> str:
        return STATUS_BACKLOG if self.missing_sections else STATUS_SPECIFIED


def body_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]


def load_cards(specs_root: Path) -> list[Card]:
    cards: list[Card] = []
    for path in sorted(specs_root.rglob("*.md")):
        if not CARD_FILE.match(path.name):
            continue
        cards.append(Card(path=path, document=frontmatter.parse(path.read_text(encoding="utf-8"))))
    return cards
