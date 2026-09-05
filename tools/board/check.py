from __future__ import annotations

import argparse
import re
from pathlib import Path

from board.context import Context, emit, git

MOCK = re.compile(r"\bMOCK:", re.IGNORECASE)
TEST_NAME = re.compile(r"^\s*(?:it|test)\(\s*['\"`](?P<name>[^'\"`]+)", re.MULTILINE)
VAGUE = re.compile(r"^(works|works fine|ok|renders|it works|smoke)\b", re.IGNORECASE)


def dead_mocks(root: Path) -> list[str]:
    found: list[str] = []
    for pattern in ("packages/**/*.ts", "apps/**/*.ts", "apps/**/*.tsx", "tools/analyzer/**/*.py"):
        for path in root.glob(pattern):
            if "node_modules" in path.parts:
                continue
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
                if MOCK.search(line):
                    found.append(f"{path.relative_to(root)}:{number}")
    return found


def dead_branches(root: Path) -> list[str]:
    merged = git(root, "branch", "--merged", "main", "--format=%(refname:short)")
    return [line.strip() for line in merged.splitlines() if line.strip() not in ("main", "")]


def out_of_area(root: Path, area: str) -> list[str]:
    changed = git(root, "diff", "--name-only", "origin/main...HEAD").splitlines()
    keep = (area, "docs/")
    return [path for path in changed if path and not path.startswith(keep)]


def tests_without_criterion(root: Path, area: str) -> list[str]:
    weak: list[str] = []
    for path in (root / area).rglob("*.test.ts") if (root / area).exists() else []:
        for match in TEST_NAME.finditer(path.read_text(encoding="utf-8")):
            if VAGUE.match(match["name"]):
                weak.append(f"{path.relative_to(root)}: {match['name']}")
    return weak


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.check")
    parser.add_argument("--area", default="packages")
    arguments = parser.parse_args(argv)

    context = Context.open()
    root = context.root
    return emit(
        {
            "dirtyTree": bool(git(root, "status", "--porcelain")),
            "deadMocks": dead_mocks(root),
            "deadBranches": dead_branches(root),
            "outOfArea": out_of_area(root, arguments.area),
            "testsWithoutCriterion": tests_without_criterion(root, arguments.area),
        }
    )


if __name__ == "__main__":
    raise SystemExit(main())
