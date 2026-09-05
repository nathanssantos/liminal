from __future__ import annotations

import re
from dataclasses import dataclass, field

Scalar = str | int | bool | list[str] | None
Value = Scalar | dict[str, Scalar]

DELIMITER = "---"
SCALAR = re.compile(r"^(?P<key>[a-zA-Z_][a-zA-Z0-9_]*):\s*(?P<value>.*)$")
NESTED = re.compile(r"^  (?P<key>[a-zA-Z_][a-zA-Z0-9_]*):\s*(?P<value>.*)$")


@dataclass
class Document:
    front: dict[str, Value] = field(default_factory=dict)
    body: str = ""


def _parse_scalar(raw: str) -> Scalar:
    text = raw.strip()
    if text == "":
        return None
    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        return [item.strip().strip("\"'") for item in inner.split(",")] if inner else []
    if text in ("true", "false"):
        return text == "true"
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        return text[1:-1]
    return text


def _dump_scalar(value: Value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return "[" + ", ".join(str(item) for item in value) + "]"
    text = str(value)
    if text != text.strip() or text.startswith(("[", "{", "\"", "'")) or ": " in text:
        return '"' + text.replace('"', '\\"') + '"'
    return text


def parse(source: str) -> Document:
    lines = source.splitlines()
    if not lines or lines[0].strip() != DELIMITER:
        return Document(front={}, body=source)
    end = next((i for i, line in enumerate(lines[1:], start=1) if line.strip() == DELIMITER), None)
    if end is None:
        return Document(front={}, body=source)

    front: dict[str, Value] = {}
    current: str | None = None
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        nested = NESTED.match(line)
        if nested and current is not None:
            block = front[current]
            if isinstance(block, dict):
                block[nested["key"]] = _parse_scalar(nested["value"])
            continue
        scalar = SCALAR.match(line)
        if not scalar:
            continue
        key, value = scalar["key"], scalar["value"]
        if value.strip() == "" and key in ("sync",):
            front[key] = {}
            current = key
            continue
        front[key] = _parse_scalar(value)
        current = key

    body = "\n".join(lines[end + 1 :]).lstrip("\n")
    if source.endswith("\n") and not body.endswith("\n"):
        body += "\n"
    return Document(front=front, body=body)


def dump(document: Document) -> str:
    lines = [DELIMITER]
    for key, value in document.front.items():
        if isinstance(value, dict):
            lines.append(f"{key}:")
            for nested_key, nested_value in value.items():
                lines.append(f"  {nested_key}: {_dump_scalar(nested_value)}")
            continue
        rendered = _dump_scalar(value)
        lines.append(f"{key}:" if rendered == "" else f"{key}: {rendered}")
    lines.append(DELIMITER)
    return "\n".join(lines) + "\n\n" + document.body.lstrip("\n")
