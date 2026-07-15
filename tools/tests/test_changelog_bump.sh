#!/bin/bash
# Unit tests for tools/changelog_bump.sh (fully local, the real repo is
# never touched).
source "$(cd "$(dirname "$0")" && pwd)/test_helpers.sh"

echo "=== changelog_bump.sh ==="

# ------------------------------------------------------- argument validation
test_case "argument validation"
setup_fixture

run_tool changelog_bump.sh
assert_eq 1 "$STATUS" "no arguments exits 1"
assert_contains "$OUTPUT" "Usage:" "no arguments prints usage"

run_tool changelog_bump.sh --help
assert_eq 0 "$STATUS" "--help exits 0"
assert_contains "$OUTPUT" "Usage:" "--help prints usage"

run_tool changelog_bump.sh 5.1.0
assert_eq 1 "$STATUS" "single argument exits 1"

run_tool changelog_bump.sh 5.1 5.0.0
assert_eq 1 "$STATUS" "malformed new_version exits 1"
assert_contains "$OUTPUT" "format x.y.z" "reports format error"

run_tool changelog_bump.sh 5.1.0 5.0
assert_eq 1 "$STATUS" "malformed current_version exits 1"

assert_file_contains "$WORK/CHANGELOG.md" "Some existing feature entry" \
  "CHANGELOG untouched after invalid arguments"

# ------------------------------------------------------------------ full bump
test_case "version bump rewrites the changelog"
setup_fixture
run_tool changelog_bump.sh 5.1.0 5.0.0
assert_eq 0 "$STATUS" "exits 0"
CONTENT=$(cat "$WORK/CHANGELOG.md")
assert_contains "$CONTENT" "## [v5.1.0]" "new version heading"
assert_contains "$CONTENT" "- Support for Wazuh 5.1.0" "Support for Wazuh entry"
assert_contains "$CONTENT" "### Added" "Added section"
assert_contains "$CONTENT" "### Changed" "Changed section"
assert_contains "$CONTENT" "### Removed" "Removed section"
assert_contains "$CONTENT" "### Fixed" "Fixed section"
assert_not_contains "$CONTENT" "Some existing feature entry" "old entries removed"
assert_eq "$(expected_priors 5.0.0 4.10.2 4.10.1 4.10.0)" "$(prior_versions_block)" \
  "Prior versions = last 2 minors (every patch, newest first)"
assert_not_contains "$CONTENT" "4.9" "third minor (4.9.x) is excluded"
assert_not_contains "$CONTENT" "not-a-version" "non-version tags filtered out"

# --------------------------------------------------- same version (sync only)
test_case "stage-only bump (same version) only resyncs Prior versions"
setup_fixture
run_tool changelog_bump.sh 5.0.0 5.0.0
assert_eq 0 "$STATUS" "exits 0"
CONTENT=$(cat "$WORK/CHANGELOG.md")
assert_contains "$CONTENT" "## [v5.0.0]" "heading preserved"
assert_contains "$CONTENT" "Some existing feature entry" "entries preserved"
assert_eq "$(expected_priors 4.10.2 4.10.1 4.10.0 4.9.1 4.9.0)" "$(prior_versions_block)" \
  "Prior versions rebuilt below 5.0.0"

# ------------------------------------------------------------------------ tag
test_case "--tag only resyncs Prior versions"
setup_fixture
run_tool changelog_bump.sh 5.1.0 5.0.0 --tag
assert_eq 0 "$STATUS" "exits 0"
CONTENT=$(cat "$WORK/CHANGELOG.md")
assert_contains "$CONTENT" "Some existing feature entry" "entries preserved with --tag"
assert_not_contains "$CONTENT" "## [v5.1.0]" "--tag does not create a new entry"
assert_eq "$(expected_priors 5.0.0 4.10.2 4.10.1 4.10.0)" "$(prior_versions_block)" \
  "Prior versions rebuilt below 5.1.0"

# -------------------------------------------------- changelog without section
test_case "sync appends the Prior versions section when missing"
setup_fixture
cat >"$WORK/CHANGELOG.md" <<'EOF'
## [v5.0.0]

### Added

- Support for Wazuh 5.0.0
EOF
run_tool changelog_bump.sh 5.0.0 5.0.0
assert_eq 0 "$STATUS" "exits 0"
CONTENT=$(cat "$WORK/CHANGELOG.md")
assert_contains "$CONTENT" "- Support for Wazuh 5.0.0" "entries preserved"
assert_contains "$CONTENT" "## Prior versions" "section appended"
assert_eq "$(expected_priors 4.10.2 4.10.1 4.10.0 4.9.1 4.9.0)" "$(prior_versions_block)" \
  "list built correctly"

# ----------------------------------------------------------- missing changelog
test_case "sync fails when CHANGELOG.md does not exist"
setup_fixture
rm "$WORK/CHANGELOG.md"
run_tool changelog_bump.sh 5.0.0 5.0.0
assert_eq 1 "$STATUS" "exits 1"
assert_contains "$OUTPUT" "CHANGELOG.md not found" "reports missing file"

summary
