from __future__ import annotations

from pathlib import Path

import pytest

from board import frontmatter, status
from board.sync import Sync
from tests.conftest import FakeBoard, FakeGitHub, make_item

SPECS = Path("docs") / "specs"


def read_card(repo: Path) -> frontmatter.Document:
    return frontmatter.parse((repo / SPECS / "M9-test" / "M9-01.md").read_text(encoding="utf-8"))


def test_dry_run_lists_the_card_to_create_and_writes_nothing(repo: Path) -> None:
    report = Sync(repo, FakeGitHub(), FakeBoard(), dry_run=True).run()

    assert [entry["id"] for entry in report.created] == ["M9-01"]
    assert report.created[0]["status"] == status.SPECIFIED
    assert read_card(repo).front["issue"] is None


def test_creating_a_card_writes_the_issue_number_and_hash_into_the_frontmatter(repo: Path) -> None:
    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()

    front = read_card(repo).front
    assert front["issue"] == 100
    assert isinstance(front["sync"], dict)
    assert front["sync"]["hash"]
    assert front["sync"]["status"] == status.SPECIFIED


def test_running_again_creates_no_duplicate_issue(repo: Path) -> None:
    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()
    created_first = len([call for call in github.calls if call[1] == "POST"])

    board = FakeBoard([make_item(100, status.SPECIFIED)])
    report = Sync(repo, github, board).run()

    assert created_first == 1
    assert report.created == []
    assert len([call for call in github.calls if call[1] == "POST"]) == 1


def test_the_sync_never_demotes_a_more_advanced_status(repo: Path) -> None:
    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()

    board = FakeBoard([make_item(100, status.IN_PROGRESS)])
    Sync(repo, github, board).run()

    assert (("ITEM100", "Status", status.SPECIFIED)) not in board.applied


def test_a_card_a_human_moved_to_backlog_is_not_brought_back(repo: Path) -> None:
    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()

    board = FakeBoard([make_item(100, status.BACKLOG)])
    report = Sync(repo, github, board).run()

    assert [entry["to"] for entry in report.moved_by_human] == [status.BACKLOG]
    assert [call for call in board.applied if call[1] == "Status"] == []


def test_a_card_parked_in_blocked_is_left_alone(repo: Path) -> None:
    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()

    board = FakeBoard([make_item(100, status.BLOCKED)])
    Sync(repo, github, board).run()

    assert [call for call in board.applied if call[1] == "Status"] == []


def test_an_incomplete_spec_stays_in_backlog(repo: Path) -> None:
    path = repo / SPECS / "M9-test" / "M9-01.md"
    path.write_text(path.read_text(encoding="utf-8").replace("- the work.", ""), encoding="utf-8")

    report = Sync(repo, FakeGitHub(), FakeBoard(), dry_run=True).run()

    assert report.created[0]["status"] == status.BACKLOG


def test_an_issue_without_a_spec_becomes_a_skeleton(repo: Path) -> None:
    github = FakeGitHub(
        [
            {
                "number": 55,
                "node_id": "NODE55",
                "title": "M9-02 · Something asked by hand",
                "body": "please do this",
                "labels": [],
                "milestone": {"number": 9, "title": "M9 · Test"},
                "state": "open",
            }
        ]
    )

    report = Sync(repo, github, FakeBoard()).run()

    assert [entry["id"] for entry in report.skeletons] == ["M9-02"]
    skeleton = repo / SPECS / "M9-test" / "M9-02.md"
    assert skeleton.exists()
    document = frontmatter.parse(skeleton.read_text(encoding="utf-8"))
    assert document.front["issue"] == 55
    assert "please do this" in document.body


def test_an_idea_issue_does_not_become_a_skeleton(repo: Path) -> None:
    github = FakeGitHub(
        [
            {
                "number": 56,
                "node_id": "NODE56",
                "title": "a product idea",
                "body": "wouldn't it be nice",
                "labels": [{"name": "idea"}],
                "milestone": None,
                "state": "open",
            }
        ]
    )

    report = Sync(repo, github, FakeBoard()).run()

    assert report.skeletons == []


def test_the_card_ends_up_on_the_board_with_priority_and_listening(repo: Path) -> None:
    board = FakeBoard()
    Sync(repo, FakeGitHub(), board).run()

    assert ("ITEM-NODE100", "Priority", "P1") in board.applied
    assert ("ITEM-NODE100", "Listening", "no") in board.applied


def test_an_issue_edited_on_github_is_pulled_into_the_spec(
    repo: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import board.sync as sync_module

    github = FakeGitHub()
    Sync(repo, github, FakeBoard()).run()

    issue = github.issues[0]
    issue["body"] = "## Context\n\nThe owner rewrote this.\n"
    issue["title"] = "M9-01 · A card the owner renamed"

    opened: list[int] = []
    monkeypatch.setattr(
        sync_module, "open_sync_pull_request", lambda root, card, number: opened.append(number)
    )

    board = FakeBoard([make_item(100, status.SPECIFIED)])
    report = Sync(repo, github, board).run()

    document = read_card(repo)
    assert [entry["issue"] for entry in report.pulled] == [100]
    assert opened == [100]
    assert document.front["title"] == "A card the owner renamed"
    assert "The owner rewrote this." in document.body
