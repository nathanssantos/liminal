from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

DOC_GLOBS = ("docs/**/*.md", "README.md", "AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md")
ROOTS = "docs|packages|apps|tools|scripts|\\.github|evidence"
BACKTICKED_PATH = re.compile(rf"`(?P<path>(?:{ROOTS})/[^`\s]+)`")
RELATIVE_LINK = re.compile(r"\[[^\]]*\]\((?P<target>(?!https?:|#|mailto:)[^)#]+)")
COMMAND_ROW = re.compile(r"^\|\s*`(?P<command>[^`]+)`\s*\|")


def documents(root: Path) -> list[Path]:
    found: list[Path] = []
    for pattern in DOC_GLOBS:
        found += [path for path in root.glob(pattern) if path.is_file()]
    return sorted(set(found))


def describes_the_future(document: Path, root: Path) -> bool:
    relative = document.relative_to(root).as_posix()
    return relative.startswith("docs/specs/") or relative.startswith("docs/handoff/")


def exists(root: Path, target: str) -> bool:
    if (root / target).exists():
        return True
    return any((root / f"{target}{suffix}").exists() for suffix in (".py", ".ts", ".tsx", ".md"))


def missing_paths(root: Path) -> list[dict[str, Any]]:
    stale: list[dict[str, Any]] = []
    for document in documents(root):
        if describes_the_future(document, root):
            continue
        for number, line in enumerate(document.read_text(encoding="utf-8").splitlines(), start=1):
            for match in BACKTICKED_PATH.finditer(line):
                target = match["path"].rstrip("/")
                if any(mark in target for mark in ("*", "<", "\u2026")):
                    continue
                if target.startswith("evidence/"):
                    continue
                if not exists(root, target):
                    stale.append(
                        {
                            "file": str(document.relative_to(root)),
                            "line": number,
                            "stale": f"`{target}` does not exist",
                        }
                    )
    return stale


def broken_links(root: Path) -> list[dict[str, Any]]:
    stale: list[dict[str, Any]] = []
    for document in documents(root):
        for number, line in enumerate(document.read_text(encoding="utf-8").splitlines(), start=1):
            for match in RELATIVE_LINK.finditer(line):
                target = match["target"].strip()
                if not target or target.startswith("<"):
                    continue
                if not (document.parent / target).resolve().exists():
                    stale.append(
                        {
                            "file": str(document.relative_to(root)),
                            "line": number,
                            "stale": f"the link {target} points nowhere",
                        }
                    )
    return stale


def known_commands(root: Path) -> set[str]:
    commands: set[str] = set()
    manifests = [root / "package.json"]
    manifests += sorted(root.glob("packages/*/package.json"))
    manifests += sorted(root.glob("apps/*/package.json"))
    for path in manifests:
        if not path.exists():
            continue
        parsed = json.loads(path.read_text(encoding="utf-8"))
        commands |= set(parsed.get("scripts", {}))
    return commands


def missing_commands(root: Path) -> list[dict[str, Any]]:
    agents = root / "AGENTS.md"
    if not agents.exists():
        return []
    scripts = known_commands(root)
    stale: list[dict[str, Any]] = []
    for number, line in enumerate(agents.read_text(encoding="utf-8").splitlines(), start=1):
        match = COMMAND_ROW.match(line)
        if not match:
            continue
        command = match["command"]
        if not command.startswith("pnpm"):
            continue
        words = [word for word in command.split() if not word.startswith("-")]
        script = words[-1] if words else ""
        if script and script not in scripts and "<" not in script:
            stale.append(
                {
                    "file": "AGENTS.md",
                    "line": number,
                    "stale": f"`{command}` has no matching package.json script",
                }
            )
    return stale


def stale_docs(root: Path) -> list[dict[str, Any]]:
    return missing_paths(root) + broken_links(root) + missing_commands(root)
