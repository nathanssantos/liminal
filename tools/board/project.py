from __future__ import annotations

from dataclasses import dataclass, field
from functools import cache
from pathlib import Path
from typing import Any

from board.github import GitHub, GitHubError

GRAPHQL = Path(__file__).parent / "graphql"


@cache
def operation(name: str) -> str:
    return (GRAPHQL / f"{name}.graphql").read_text(encoding="utf-8")


@dataclass
class Field:
    id: str
    name: str
    options: dict[str, str] = field(default_factory=dict)

    def option(self, name: str) -> str:
        for option_name, option_id in self.options.items():
            if option_name.lower() == name.lower():
                return option_id
        raise GitHubError(f"field {self.name!r} has no option {name!r}")


@dataclass
class Item:
    id: str
    number: int | None
    title: str
    state: str
    labels: list[str]
    milestone: str | None
    fields: dict[str, str]

    @property
    def status(self) -> str | None:
        return self.fields.get("Status")


@dataclass
class Board:
    github: GitHub
    id: str
    number: int
    fields: dict[str, Field]

    def field(self, name: str) -> Field:
        for field_name, value in self.fields.items():
            if field_name.lower() == name.lower():
                return value
        raise GitHubError(f"the board has no field {name!r}")

    def items(self) -> list[Item]:
        items: list[Item] = []
        cursor: str | None = None
        while True:
            data = self.github.graphql(operation("items"), {"project": self.id, "cursor": cursor})
            page = data["node"]["items"]
            for node in page["nodes"]:
                items.append(_item(node))
            if not page["pageInfo"]["hasNextPage"]:
                return items
            cursor = page["pageInfo"]["endCursor"]

    def add_issue(self, issue_node_id: str) -> str:
        data = self.github.graphql(
            operation("add-item"), {"project": self.id, "content": issue_node_id}
        )
        return str(data["addProjectV2ItemById"]["item"]["id"])

    def set_single_select(self, item_id: str, field_name: str, option_name: str) -> None:
        target = self.field(field_name)
        self.github.graphql(
            operation("set-single-select"),
            {
                "project": self.id,
                "item": item_id,
                "field": target.id,
                "option": target.option(option_name),
            },
        )


def _item(node: dict[str, Any]) -> Item:
    content = node.get("content") or {}
    values: dict[str, str] = {}
    for value in node["fieldValues"]["nodes"]:
        name = (value.get("field") or {}).get("name")
        if not name:
            continue
        if "name" in value:
            values[name] = value["name"]
        elif "text" in value:
            values[name] = value["text"]
    milestone = content.get("milestone")
    return Item(
        id=node["id"],
        number=content.get("number"),
        title=content.get("title", ""),
        state=content.get("state", ""),
        labels=[label["name"] for label in (content.get("labels") or {}).get("nodes", [])],
        milestone=milestone["title"] if milestone else None,
        fields=values,
    )


def find_board(github: GitHub, title: str | None = None) -> Board:
    wanted = (title or github.name).lower()
    cursor: str | None = None
    while True:
        data = github.graphql(operation("project"), {"owner": github.owner, "cursor": cursor})
        page = data["user"]["projectsV2"]
        for node in page["nodes"]:
            if node["title"].lower() != wanted:
                continue
            fields = {
                item["name"]: Field(
                    id=item["id"],
                    name=item["name"],
                    options={option["name"]: option["id"] for option in item.get("options", [])},
                )
                for item in node["fields"]["nodes"]
                if item
            }
            return Board(github=github, id=node["id"], number=node["number"], fields=fields)
        if not page["pageInfo"]["hasNextPage"]:
            raise GitHubError(f"no board titled {wanted!r} for {github.owner}")
        cursor = page["pageInfo"]["endCursor"]
