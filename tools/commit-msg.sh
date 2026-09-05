#!/bin/sh
set -eu

message_file="$1"
subject=$(head -n 1 "$message_file")

case "$subject" in
  "Merge "*|"Revert "*|"fixup!"*|"squash!"*) exit 0 ;;
esac

length=$(printf '%s' "$subject" | wc -c | tr -d ' ')
if [ "$length" -gt 72 ]; then
  echo "commit-msg: the first line has $length characters; the limit is 72" >&2
  echo "  $subject" >&2
  exit 1
fi

types='feat|fix|docs|chore|ci|refactor|test|perf|build|style|revert'
if ! printf '%s' "$subject" | grep -Eq "^($types)(\([a-z0-9-]+\))?!?: .+"; then
  echo "commit-msg: the first line is not a Conventional Commit" >&2
  echo "  expected <type>(<scope>)?: <description in the imperative>" >&2
  echo "  types: feat fix docs chore ci refactor test perf build style revert" >&2
  echo "  got: $subject" >&2
  exit 1
fi

description=$(printf '%s' "$subject" | sed -E "s/^($types)(\([a-z0-9-]+\))?!?: //")
not_imperative='^(added|adds|adding|updated|updates|updating|fixed|fixes|fixing|removed|removes|removing|changed|changes|changing|created|creates|creating|improved|improves|improving)\b'
if printf '%s' "$description" | grep -Eiq "$not_imperative"; then
  echo "commit-msg: the description is not in the imperative" >&2
  echo "  write \"add the gate\", not \"$description\"" >&2
  exit 1
fi
