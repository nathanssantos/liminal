import io

from analyzer.worker import VERSION, handle, run


def test_ping_answers_ok_with_the_version() -> None:
    assert handle({"cmd": "ping"}) == {"ok": True, "version": VERSION}


def test_unknown_command_returns_an_error() -> None:
    assert "error" in handle({"cmd": "dance"})


def test_worker_keeps_running_after_unknown_command() -> None:
    stdin = io.StringIO('{"cmd":"dance"}\n{"cmd":"ping"}\n')
    stdout = io.StringIO()

    run(stdin, stdout)

    answers = [line for line in stdout.getvalue().splitlines() if line]
    assert len(answers) == 2
    assert "error" in answers[0]
    assert '"ok": true' in answers[1]


def test_invalid_json_does_not_kill_the_worker() -> None:
    stdin = io.StringIO('not json\n{"cmd":"ping"}\n')
    stdout = io.StringIO()

    run(stdin, stdout)

    answers = [line for line in stdout.getvalue().splitlines() if line]
    assert len(answers) == 2
    assert "invalid json" in answers[0]
