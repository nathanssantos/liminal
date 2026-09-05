from __future__ import annotations

import argparse
from pathlib import Path

from board.context import Context, emit


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="board.comment")
    parser.add_argument("number", type=int)
    parser.add_argument("--file", required=True)
    parser.add_argument("--label", action="append", default=[])
    arguments = parser.parse_args(argv)

    body = Path(arguments.file).read_text(encoding="utf-8").strip()
    if not body:
        return emit({"error": "the comment file is empty"})

    context = Context.open()
    repo = context.github.repo
    posted = context.github.api(
        f"repos/{repo}/issues/{arguments.number}/comments", "POST", {"body": body}
    )
    if arguments.label:
        context.github.api(
            f"repos/{repo}/issues/{arguments.number}/labels",
            "POST",
            {"labels": arguments.label},
        )
    return emit({"url": posted["html_url"], "labels": arguments.label})


if __name__ == "__main__":
    raise SystemExit(main())
