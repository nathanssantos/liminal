from __future__ import annotations

import subprocess
from pathlib import Path


def run(root: Path, *arguments: str) -> None:
    subprocess.run(["git", *arguments], cwd=root, check=True, capture_output=True, text=True)


def repo_with_commit(tmp_path: Path, name: str, content: str) -> Path:
    root = tmp_path / "repo"
    root.mkdir()
    run(root, "init", "-b", "main")
    run(root, "config", "user.email", "loop@example.com")
    run(root, "config", "user.name", "loop")
    (root / name).write_text(content, encoding="utf-8")
    run(root, "add", "-A")
    run(root, "commit", "-m", "chore: start")
    return root


def commit(root: Path, message: str) -> None:
    run(root, "add", "-A")
    run(root, "commit", "-m", message)
