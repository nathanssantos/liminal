import json
from typing import IO, Any

VERSION = "0.0.0"


def handle(request: dict[str, Any]) -> dict[str, Any]:
    command = request.get("cmd")
    if command == "ping":
        return {"ok": True, "version": VERSION}
    return {"error": f"unknown command: {command!r}"}


def _respond(line: str) -> dict[str, Any]:
    try:
        request = json.loads(line)
    except json.JSONDecodeError as error:
        return {"error": f"invalid json: {error.msg}"}
    if not isinstance(request, dict):
        return {"error": "request must be a json object"}
    return handle(request)


def run(stdin: IO[str], stdout: IO[str]) -> None:
    for line in stdin:
        if not line.strip():
            continue
        stdout.write(json.dumps(_respond(line), sort_keys=True) + "\n")
        stdout.flush()
