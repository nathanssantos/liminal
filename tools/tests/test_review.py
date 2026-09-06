from __future__ import annotations

import json
import os
import shutil
from collections.abc import Sequence
from pathlib import Path

from board.review import (
    branch_of,
    card_on_this_branch,
    clean_scratch,
    load_state,
    main,
    prepare,
    record_findings,
    review_blockers,
    round_done,
    scratch,
)
from tests.helpers import repo_with_commit, run


class Recorder:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.calls: list[list[str]] = []

    def __call__(self, command: Sequence[str], cwd: Path) -> int:
        self.calls.append(list(command))
        if command[:3] == ["git", "worktree", "add"]:
            target = Path(command[4])
            target.mkdir(parents=True, exist_ok=True)
            (target / "package.json").write_text("{}\n", encoding="utf-8")
        if command[:3] == ["git", "worktree", "remove"]:
            shutil.rmtree(command[4], ignore_errors=True)
        if command[0] == "pnpm":
            (cwd / "node_modules").mkdir(exist_ok=True)
        return 0

    def installs(self) -> int:
        return len([call for call in self.calls if call[0] == "pnpm"])


def test_a_second_prepare_on_the_same_head_reuses_the_tree_and_skips_the_install(
    tmp_path: Path,
) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)

    first = prepare(root, "M1-02", base=base, runner=runner)
    second = prepare(root, "M1-02", base=base, runner=runner)

    assert first["reviewPath"] == second["reviewPath"]
    assert first["installed"] is True
    assert second["installed"] is False
    assert runner.installs() == 1


def test_prepare_reports_the_round_and_the_head_the_last_round_reviewed(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    first = prepare(root, "M1-02", base=base, runner=runner)
    round_done(root, "M1-02", first["head"])

    (root / "b.txt").write_text("two", encoding="utf-8")
    run(root, "add", "-A")
    run(root, "commit", "-m", "chore: second")
    second = prepare(root, "M1-02", base=base, runner=runner)

    assert first["round"] == 1
    assert second["round"] == 2
    assert second["reviewedHead"] == first["head"]
    assert second["reviewPath"] != first["reviewPath"]


def test_a_scratch_is_its_own_worktree_and_a_revert_in_it_stays_there(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    prepared = Path(prepare(root, "M1-02", base=base, runner=runner)["reviewPath"])
    (prepared / "source.ts").write_text("the fix\n", encoding="utf-8")

    copy = Path(scratch(root, "M1-02", base=base, runner=runner)["scratchPath"])
    (copy / "source.ts").write_text("the mutant\n", encoding="utf-8")

    worktrees = [call for call in runner.calls if call[:3] == ["git", "worktree", "add"]]
    assert [Path(call[4]) for call in worktrees] == [prepared, copy]
    assert (copy / "node_modules").is_dir()
    assert not (copy / "node_modules").is_symlink()
    assert (prepared / "source.ts").read_text(encoding="utf-8") == "the fix\n"


def test_review_state_carries_findings_from_open_to_fixed_and_records_the_deep_pass(
    tmp_path: Path,
) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    head = "deadbeef"
    record_findings(
        root,
        "M1-02",
        [
            {
                "agent": "engine-reviewer",
                "severity": "blocking",
                "file": "packages/engine/src/engine.ts",
                "line": 1,
                "summary": "the transport stops inside the tick",
                "status": "open",
                "round": 1,
            }
        ],
    )

    assert [finding["status"] for finding in load_state(root, "M1-02")["findings"]] == ["open"]

    fixed = load_state(root, "M1-02")["findings"]
    fixed[0]["status"] = "fixed"
    record_findings(root, "M1-02", fixed)
    round_done(root, "M1-02", head, deep=True, measured=["packages/engine/src/engine.ts"])

    state = load_state(root, "M1-02")
    assert [finding["status"] for finding in state["findings"]] == ["fixed"]
    assert state["deepPassHead"] == head
    assert state["measured"] == ["packages/engine/src/engine.ts"]


def test_finishing_a_round_moves_the_head_the_state_reports(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    prepare(root, "M1-02", base=base, runner=runner)

    round_done(root, "M1-02", "later")

    state = load_state(root, "M1-02")
    assert state["head"] == "later"
    assert state["reviewedHead"] == "later"


def test_the_merge_gate_refuses_while_a_blocking_finding_is_open(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    record_findings(
        root,
        "M1-02",
        [{"severity": "blocking", "status": "open", "summary": "voices dropped at the end"}],
    )
    round_done(root, "M1-02", "head", deep=True, measured=[])

    assert review_blockers(root, "M1-02", "head", []) == [
        "blocking finding still open: voices dropped at the end"
    ]


def test_the_merge_gate_refuses_without_a_deep_pass(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    round_done(root, "M1-02", "head")

    assert review_blockers(root, "M1-02", "head", []) == ["no deep pass recorded"]


def test_the_merge_gate_passes_when_the_diff_since_the_deep_pass_is_all_unmeasured(
    tmp_path: Path,
) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    round_done(root, "M1-02", "deep", deep=True, measured=["packages/engine/src/engine.ts"])

    assert review_blockers(root, "M1-02", "later", ["docs/journal.md"]) == []
    assert review_blockers(root, "M1-02", "later", ["packages/engine/src/engine.ts"]) == [
        "the deep pass was not run on later, and it measured packages/engine/src/engine.ts"
    ]


def test_cleaning_the_scratch_room_unregisters_every_worktree_it_made(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    first = Path(scratch(root, "M1-02", base=base, runner=runner)["scratchPath"])
    second = Path(scratch(root, "M1-02", base=base, runner=runner)["scratchPath"])

    result = clean_scratch(root, "M1-02", base=base, runner=runner)

    assert result["removed"] == sorted([str(first), str(second)])
    removals = [call[4] for call in runner.calls if call[:3] == ["git", "worktree", "remove"]]
    assert removals == sorted([str(first), str(second)])
    assert ["git", "worktree", "prune"] in runner.calls
    assert not first.exists()


def test_preparing_a_new_head_drops_the_trees_of_the_older_ones(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    first = Path(prepare(root, "M1-02", base=base, runner=runner)["reviewPath"])
    stale_scratch = Path(scratch(root, "M1-02", base=base, runner=runner)["scratchPath"])

    (root / "b.txt").write_text("two", encoding="utf-8")
    run(root, "add", "-A")
    run(root, "commit", "-m", "chore: second")
    second = prepare(root, "M1-02", base=base, runner=runner)

    assert not first.exists()
    assert not stale_scratch.exists()
    assert Path(second["reviewPath"]).exists()
    assert str(first) in second["dropped"]


def test_a_detached_head_gets_a_room_of_its_own_rather_than_one_called_head(
    tmp_path: Path,
) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    run(root, "checkout", "--detach")

    assert branch_of(root) == "detached"


def test_the_card_comes_from_the_branch_when_no_card_is_given(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    folder = root / "docs" / "specs" / "M1-sound"
    folder.mkdir(parents=True)
    (folder / "M1-06.md").write_text(
        "---\nid: M1-06\ntitle: t\nmilestone: M1\narea: infra\npriority: P0\n"
        "depends_on: []\nlistening: false\nissue: 55\n---\n\n## Context\n",
        encoding="utf-8",
    )
    run(root, "checkout", "-b", "feat/55-board-review")

    assert card_on_this_branch(root) == "M1-06"


def test_no_card_when_the_branch_names_no_issue(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    run(root, "checkout", "-b", "docs/whatever")

    assert card_on_this_branch(root) is None


def test_a_measured_directory_covers_the_files_under_it(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    round_done(root, "M1-02", "deep", deep=True, measured=["packages/engine"])

    assert review_blockers(root, "M1-02", "later", ["docs/journal.md"]) == []
    assert review_blockers(root, "M1-02", "later", ["packages/engine/src/engine.ts"]) == [
        "the deep pass was not run on later, and it measured packages/engine/src/engine.ts"
    ]


def test_findings_are_written_through_the_command_line(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    given = root / "findings.json"
    given.write_text(
        json.dumps([{"severity": "blocking", "status": "open", "summary": "the tail rewinds"}]),
        encoding="utf-8",
    )
    here = Path.cwd()
    try:
        os.chdir(root)
        main(["--card", "M1-02", "--findings", str(given)])
    finally:
        os.chdir(here)

    assert [f["summary"] for f in load_state(root, "M1-02")["findings"]] == ["the tail rewinds"]
