from __future__ import annotations

import re
from pathlib import Path
from typing import Any

MEMORY = Path("docs") / "memory"


def area_rules(root: Path, area: str) -> str:
    path = root / MEMORY / "rules.md"
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"^## {re.escape(area)}\s*$", re.MULTILINE)
    match = pattern.search(text)
    if not match:
        return ""
    rest = text[match.end() :]
    end = rest.find("\n## ")
    return rest[: end if end != -1 else len(rest)].strip()


def adrs_citing(root: Path, area: str) -> list[dict[str, str]]:
    folder = root / MEMORY / "decisions"
    if not folder.exists():
        return []
    found: list[dict[str, str]] = []
    for path in sorted(folder.glob("ADR-*.md")):
        text = path.read_text(encoding="utf-8")
        if area.lower() in text.lower():
            title = text.splitlines()[0].lstrip("# ")
            found.append({"path": str(path.relative_to(root)), "title": title})
    return found


def measurements_for(root: Path, area: str) -> list[str]:
    path = root / MEMORY / "measurements.md"
    if not path.exists():
        return []
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.startswith("|") and area.lower() in line.lower()
    ]


def for_area(root: Path, area: str) -> dict[str, Any]:
    return {
        "rules": area_rules(root, area),
        "adrs": adrs_citing(root, area),
        "measurements": measurements_for(root, area),
    }
