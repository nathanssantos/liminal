from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

from board.review import (
    load_state,
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
        if command[0] == "git" and command[1] == "worktree":
            target = Path(command[4])
            target.mkdir(parents=True, exist_ok=True)
            (target / "package.json").write_text("{}\n", encoding="utf-8")
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


def test_a_scratch_copy_links_node_modules_and_a_revert_in_it_stays_there(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    base = tmp_path / "review"
    runner = Recorder(root)
    prepared = Path(prepare(root, "M1-02", base=base, runner=runner)["reviewPath"])
    (prepared / "source.ts").write_text("the fix\n", encoding="utf-8")

    copy = Path(scratch(root, "M1-02", base=base, runner=runner)["scratchPath"])
    (copy / "source.ts").write_text("the mutant\n", encoding="utf-8")

    assert (copy / "node_modules").is_symlink()
    assert (copy / "node_modules").resolve() == (prepared / "node_modules").resolve()
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
