from board import frontmatter


def test_reads_the_scalars_lists_and_empty_fields_of_a_card() -> None:
    document = frontmatter.parse(
        '---\nid: M0-03\ntitle: "Analyzer: Python skeleton"\ndepends_on: [M0-01, M0-02]\n'
        "listening: false\nissue:\n---\n\n## Context\n\ntext\n"
    )

    assert document.front["id"] == "M0-03"
    assert document.front["title"] == "Analyzer: Python skeleton"
    assert document.front["depends_on"] == ["M0-01", "M0-02"]
    assert document.front["listening"] is False
    assert document.front["issue"] is None
    assert document.body.startswith("## Context")


def test_reads_the_nested_sync_block() -> None:
    document = frontmatter.parse(
        "---\nid: M0-03\nsync:\n  hash: abc\n  statusBy: human\n---\nbody\n"
    )

    assert document.front["sync"] == {"hash": "abc", "statusBy": "human"}


def test_a_document_survives_a_round_trip() -> None:
    source = (
        "---\nid: M0-03\ntitle: Repo and monorepo\nmilestone: M0\ndepends_on: [M0-01]\n"
        "listening: true\nissue: 12\nsync:\n  hash: abc\n---\n\n## Context\n\ntext\n"
    )

    assert frontmatter.dump(frontmatter.parse(source)) == source


def test_a_file_without_frontmatter_is_all_body() -> None:
    document = frontmatter.parse("# just markdown\n")

    assert document.front == {}
    assert document.body == "# just markdown\n"
