from __future__ import annotations

from pathlib import Path

from board.check import dead_mocks, report
from board.deliver import comments_gate, commit_messages_gate, rebase_only, review_gate
from board.review import round_done
from board.stale import missing_commands, missing_paths
from tests.helpers import commit, repo_with_commit, run

AGENTS = "## Commands\n\n| Command | Does |\n|---|---|\n| `pnpm ghost` | nothing |\n"


def test_stale_docs_flags_a_backticked_path_that_does_not_exist(tmp_path: Path) -> None:
    (tmp_path / "docs").mkdir()
    note = tmp_path / "docs" / "note.md"
    note.write_text("see `packages/ghost/index.ts`\n", encoding="utf-8")

    stale = missing_paths(tmp_path)

    assert [entry["stale"] for entry in stale] == ["`packages/ghost/index.ts` does not exist"]


def test_stale_docs_accepts_a_path_that_exists(tmp_path: Path) -> None:
    (tmp_path / "docs").mkdir()
    (tmp_path / "packages" / "score").mkdir(parents=True)
    (tmp_path / "packages" / "score" / "index.ts").write_text("", encoding="utf-8")
    (tmp_path / "docs" / "note.md").write_text("see `packages/score/index.ts`\n", encoding="utf-8")

    assert missing_paths(tmp_path) == []


def test_stale_docs_does_not_police_a_spec_that_describes_the_future(tmp_path: Path) -> None:
    folder = tmp_path / "docs" / "specs" / "M1-sound"
    folder.mkdir(parents=True)
    (folder / "M1-01.md").write_text("it will live in `packages/ghost/x.ts`\n", encoding="utf-8")

    assert missing_paths(tmp_path) == []


def test_stale_docs_flags_a_command_missing_from_package_json(tmp_path: Path) -> None:
    (tmp_path / "package.json").write_text('{"scripts": {"check": "node x"}}', encoding="utf-8")
    (tmp_path / "AGENTS.md").write_text(AGENTS, encoding="utf-8")

    stale = missing_commands(tmp_path)

    assert "pnpm ghost" in stale[0]["stale"]


def test_stale_docs_accepts_a_command_that_is_a_real_script(tmp_path: Path) -> None:
    (tmp_path / "package.json").write_text('{"scripts": {"ghost": "node x"}}', encoding="utf-8")
    (tmp_path / "AGENTS.md").write_text(AGENTS, encoding="utf-8")

    assert missing_commands(tmp_path) == []


def test_the_gate_blocks_on_a_comment_planted_in_the_diff(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    (root / "src.ts").write_text("export const a = 1\n// a planted comment\n", encoding="utf-8")
    commit(root, "feat: add a line")

    gate = comments_gate(root, base="main~1")

    assert gate.passed is False
    assert "// a planted comment" in gate.detail[0]


def test_the_gate_accepts_a_sanctioned_suppression(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    (root / "src.ts").write_text(
        "export const a = 1\n// biome-ignore lint: checked at runtime\n", encoding="utf-8"
    )
    commit(root, "feat: add a line")

    assert comments_gate(root, base="main~1").passed is True


def test_the_gate_reads_a_markdown_heading_as_prose_not_as_a_comment(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "doc.md", "a line\n")
    (root / "doc.md").write_text("a line\n\n# A heading\n", encoding="utf-8")
    commit(root, "docs: add a heading")

    assert comments_gate(root, base="main~1").passed is True


def test_the_gate_still_reads_a_python_comment_as_a_comment(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "script.py", "a = 1\n")
    (root / "script.py").write_text("a = 1\n# a planted comment\n", encoding="utf-8")
    commit(root, "feat: add a line")

    assert comments_gate(root, base="main~1").passed is False


def test_the_gate_rejects_a_commit_message_outside_the_convention(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    (root / "src.ts").write_text("export const a = 2\n", encoding="utf-8")
    commit(root, "update stuff")

    gate = commit_messages_gate(root, base="main~1")

    assert gate.passed is False
    assert gate.detail == ["update stuff"]


def test_the_gate_accepts_a_conventional_commit_message(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    (root / "src.ts").write_text("export const a = 2\n", encoding="utf-8")
    commit(root, "feat(score): raise the value")

    assert commit_messages_gate(root, base="main~1").passed is True


def test_rebase_only_aborts_when_git_silently_drops_a_commit(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    run(root, "switch", "-c", "feature")
    (root / "shared.ts").write_text("export const b = 2\n", encoding="utf-8")
    commit(root, "feat: add b on the branch")
    run(root, "switch", "main")
    (root / "shared.ts").write_text("export const b = 2\n", encoding="utf-8")
    commit(root, "feat: add b on main")
    run(root, "switch", "feature")

    result = rebase_only(root, base="main")

    assert result["verdict"] == "ABORTED"
    assert result["reason"] == "commit count changed 1 -> 0"


def test_rebase_only_aborts_on_a_conflict_instead_of_leaving_it_half_done(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "src.ts", "export const a = 1\n")
    run(root, "switch", "-c", "feature")
    (root / "src.ts").write_text("export const a = 'branch'\n", encoding="utf-8")
    commit(root, "feat: change a on the branch")
    run(root, "switch", "main")
    (root / "src.ts").write_text("export const a = 'main'\n", encoding="utf-8")
    commit(root, "feat: change a on main")
    run(root, "switch", "feature")

    result = rebase_only(root, base="main")

    assert result["verdict"] == "ABORTED"
    assert "rebase" not in (root / ".git").joinpath("HEAD").read_text(encoding="utf-8")


def test_the_mock_scan_ignores_the_board_scripts(tmp_path: Path) -> None:
    (tmp_path / "packages" / "score").mkdir(parents=True)
    (tmp_path / "packages" / "score" / "index.ts").write_text("const a = 1\n", encoding="utf-8")

    assert dead_mocks(tmp_path) == []


def test_the_mock_scan_finds_a_mock_left_in_product_code(tmp_path: Path) -> None:
    (tmp_path / "packages" / "score").mkdir(parents=True)
    source = tmp_path / "packages" / "score" / "index.ts"
    source.write_text("const bpm = 128\nconst key = 'MOCK: not a real key'\n", encoding="utf-8")

    assert dead_mocks(tmp_path) == ["packages/score/index.ts:2"]


def test_check_reports_on_the_tree_it_is_pointed_at(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    (root / "packages" / "score").mkdir(parents=True)
    marked = root / "packages" / "score" / "x.ts"
    marked.write_text("const a = 1 // MOCK: not real\n", encoding="utf-8")

    given = report(root, "packages")

    assert given["root"] == str(root)
    assert given["deadMocks"] == ["packages/score/x.ts:1"]


def test_the_review_gate_lets_a_branch_that_names_no_issue_through(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")

    given = review_gate(root, "docs/craft-book", "head")

    assert given.passed is True


def test_the_review_gate_refuses_a_branch_naming_an_issue_no_spec_claims(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")

    given = review_gate(root, "feat/999-a-card-that-does-not-exist", "head")

    assert given.passed is False
    assert given.detail == (
        "branch feat/999-a-card-that-does-not-exist names issue 999, which no spec claims"
    )


def test_the_review_gate_reads_the_head_it_is_given_not_the_local_one(tmp_path: Path) -> None:
    root = repo_with_commit(tmp_path, "a.txt", "one")
    folder = root / "docs" / "specs" / "M1-sound"
    folder.mkdir(parents=True)
    (folder / "M1-06.md").write_text(
        "---\nid: M1-06\ntitle: t\nmilestone: M1\narea: infra\npriority: P0\n"
        "depends_on: []\nlistening: false\nissue: 55\n---\n\n## Context\n",
        encoding="utf-8",
    )
    round_done(root, "M1-06", "deep", deep=True, measured=["tools/board/review.py"])

    on_the_deep_head = review_gate(root, "feat/55-board-review", "deep")
    on_another_head = review_gate(root, "feat/55-board-review", "somewhere-else")

    assert on_the_deep_head.passed is True
    assert on_another_head.passed is False
