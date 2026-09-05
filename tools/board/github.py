from __future__ import annotations

import json
import re
import subprocess
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REMOTE = re.compile(r"github\.com[:/](?P<owner>[^/]+)/(?P<name>[^/.]+)")


class GitHubError(RuntimeError):
    pass


def run_gh(arguments: Sequence[str], stdin: str | None = None) -> str:
    result = subprocess.run(
        ["gh", *arguments],
        input=stdin,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise GitHubError(result.stderr.strip() or result.stdout.strip())
    return result.stdout


@dataclass
class GitHub:
    owner: str
    name: str
    runner: Callable[[Sequence[str], str | None], str] = run_gh

    @property
    def repo(self) -> str:
        return f"{self.owner}/{self.name}"

    def api(self, path: str, method: str = "GET", body: dict[str, Any] | None = None) -> Any:
        arguments = ["api", "-X", method, path]
        payload = json.dumps(body) if body is not None else None
        if payload is not None:
            arguments += ["--input", "-"]
        output = self.runner(arguments, payload)
        return json.loads(output) if output.strip() else None

    def paged(self, path: str) -> list[Any]:
        output = self.runner(["api", "--paginate", "--slurp", path], None)
        pages = json.loads(output) if output.strip() else []
        return [item for page in pages for item in page]

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> Any:
        payload = json.dumps({"query": query, "variables": variables or {}})
        answer = json.loads(self.runner(["api", "graphql", "--input", "-"], payload))
        if "errors" in answer:
            raise GitHubError(json.dumps(answer["errors"]))
        return answer["data"]


def repo_from_remote(directory: Path | None = None) -> tuple[str, str]:
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=directory,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise GitHubError("no origin remote")
    match = REMOTE.search(result.stdout.strip())
    if not match:
        raise GitHubError(f"origin is not a GitHub remote: {result.stdout.strip()}")
    return match["owner"], match["name"]
