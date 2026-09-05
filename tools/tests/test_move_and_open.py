from __future__ import annotations

from pathlib import Path

from board import status
from board.move import plan, set_by_human
from board.open import barriers, slug
from board.specs import Card, load_cards
from tests.conftest import make_item

SPECS = Path("docs") / "specs"


def card_of(repo: Path) -> Card:
    return load_cards(repo / SPECS)[0]


def test_move_refuses_to_park_a_card_without_a_reason(repo: Path) -> None:
    item = make_item(100, status.SPECIFIED)

    assert "error" in plan(card_of(repo), item, status.BLOCKED, None, False)


def test_move_parks_a_card_when_a_reason_is_given(repo: Path) -> None:
    item = make_item(100, status.SPECIFIED)

    result = plan(card_of(repo), item, status.BLOCKED, "it waits on an answer", False)

    assert result["to"] == status.BLOCKED


def test_move_refuses_to_demote_a_status_a_human_set(repo: Path) -> None:
    card = card_of(repo)
    card.document.front["sync"] = {"statusBy": "human", "status": status.IN_REVIEW}
    item = make_item(100, status.IN_REVIEW)

    assert set_by_human(card, item) is True
    assert "error" in plan(card, item, status.READY, None, False)


def test_move_detects_a_human_move_the_loop_did_not_write(repo: Path) -> None:
    card = card_of(repo)
    card.document.front["sync"] = {"status": status.READY}
    item = make_item(100, status.DONE)

    assert set_by_human(card, item) is True


def test_unblock_returns_the_card_to_where_it_came_from(repo: Path) -> None:
    card = card_of(repo)
    card.document.front["sync"] = {"previousStatus": status.IN_PROGRESS, "status": status.BLOCKED}
    item = make_item(100, status.BLOCKED)

    assert plan(card, item, "", None, True)["to"] == status.IN_PROGRESS


def test_move_rejects_a_status_that_is_not_a_column(repo: Path) -> None:
    item = make_item(100, status.READY)

    assert "error" in plan(card_of(repo), item, "Almost done", None, False)


def test_open_reports_a_dependency_that_is_not_done(repo: Path) -> None:
    card = card_of(repo)
    card.document.front["depends_on"] = ["M9-00"]
    item = make_item(100, status.READY)

    assert barriers(card, item, set()) == ["dependencies not done: M9-00"]


def test_open_names_an_open_question_as_a_barrier(repo: Path) -> None:
    item = make_item(100, status.READY)
    item.labels = ["question"]

    assert barriers(card_of(repo), item, {"M9-00"}) == ["an open question on the issue"]


def test_open_clears_a_card_whose_dependencies_are_done(repo: Path) -> None:
    card = card_of(repo)
    card.document.front["depends_on"] = ["M9-00"]
    item = make_item(100, status.READY)

    assert barriers(card, item, {"M9-00"}) == []


def test_the_suggested_branch_slug_is_lowercase_and_dashed() -> None:
    assert slug("The score: schema, invariants") == "the-score-schema-invariants"
