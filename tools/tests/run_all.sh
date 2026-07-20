#!/bin/bash
# Runs all the local unit tests for the tools/ scripts.
# Usage: bash run_all.sh
DIR="$(cd "$(dirname "$0")" && pwd)"

rm -rf "$DIR/tmp"

overall=0
for test_file in test_changelog_bump.sh test_repository_bumper.sh; do
  bash "$DIR/$test_file" || overall=1
  echo ""
done

if [[ $overall -eq 0 ]]; then
  echo "ALL TESTS PASSED"
  rm -rf "$DIR/tmp"
else
  echo "SOME TESTS FAILED (fixtures kept in $DIR/tmp for debugging)"
fi
exit $overall
