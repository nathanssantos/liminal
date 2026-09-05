from __future__ import annotations

BACKLOG = "Backlog"
SPECIFIED = "Specified"
READY = "Ready"
IN_PROGRESS = "In progress"
IN_REVIEW = "In review"
DONE = "Done"
BLOCKED = "Blocked"
DECISION_NEEDED = "Decision needed"

LADDER = (BACKLOG, SPECIFIED, READY, IN_PROGRESS, IN_REVIEW, DONE)
PARKING = (BLOCKED, DECISION_NEEDED)
ALL = (*PARKING, *LADDER)


def rank(status: str | None) -> int:
    if status is None:
        return -1
    for index, name in enumerate(LADDER):
        if name.lower() == status.lower():
            return index
    return -1


def is_parking(status: str | None) -> bool:
    return status is not None and any(name.lower() == status.lower() for name in PARKING)


def advances(current: str | None, target: str) -> bool:
    if is_parking(current):
        return False
    return rank(target) > rank(current)
