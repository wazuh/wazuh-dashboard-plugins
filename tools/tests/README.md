# Tools unit tests

Unit tests for the repository bump scripts:

- [`tools/changelog_bump.sh`](../changelog_bump.sh)
- [`tools/repository_bumper.sh`](../repository_bumper.sh)

The suite is plain Bash (no external test framework) and runs fully **offline
and isolated**: it never modifies this repository and never touches the
network.

## Running

```bash
# Whole suite
bash tools/tests/run_all.sh

# A single file
bash tools/tests/test_changelog_bump.sh
bash tools/tests/test_repository_bumper.sh
```

Each assertion prints `ok:`/`FAIL:` and every file ends with a
`== N passed, M failed ==` summary. `run_all.sh` exits non-zero if anything
failed.

## How it works

`test_helpers.sh` builds a **throwaway fixture git repository** under
`tools/tests/tmp/` for every test case, with the minimal structure the
scripts expect (`VERSION.json`, `plugins/*/package.json`,
`opensearch_dashboards.json`, `CHANGELOG.md`, GitHub workflow files,
`docker/imposter/wazuh-config.yml`, `endpoints.json`). The scripts under test
are **copied into the fixture** and executed there, so log files and every
edit land inside the fixture, never in the real repository.

Two tricks keep everything deterministic and offline:

- The fixture lives in a path containing `github.com/wazuh/test-repo` and its
  `origin` remote points to that same local path. This makes
  `git ls-remote --tags origin` (tag discovery) and `get_repo_path()` (link
  generation) work without network access. The fixture ships a known set of
  tags — `4.9.x`, `4.10.x`, `v4.10.1`, `5.0.0`, plus invalid ones like
  `not-a-version` — so the "Prior versions" output is fully predictable.
- A stub `yarn` executable that always fails is prepended to `PATH`, forcing
  `update_endpoints_json` down its deterministic `sed` fallback instead of
  running the real `yarn generate:api-data`.

On success `run_all.sh` removes `tmp/`; on failure the fixtures are kept
there for debugging (the directory is git-ignored).

## Coverage

`test_changelog_bump.sh`:

- Argument validation (`--help`, missing/extra args, malformed `x.y.z`
  versions) and that failures leave `CHANGELOG.md` untouched.
- Version bump: changelog reset to the new `## [vX.Y.Z]` entry with empty
  sections and the `- Support for Wazuh X.Y.Z` line; "Prior versions" rebuilt
  with the two most recent minors below the new version, every patch of each,
  newest first; non-version tags filtered out; `v`-prefixed tags normalized.
- Stage-only bump (same version) and `--tag`: entries preserved, only the
  "Prior versions" section resynced.
- Sync when the "Prior versions" section is missing (appended) and when
  `CHANGELOG.md` does not exist (error).

`test_repository_bumper.sh`:

- Argument validation (`--version`/`--stage` requirements, formats, unknown
  options) and that failures leave the fixture untouched.
- Full bump: `VERSION.json`, every plugin `package.json` (version + revision
  reset to `00`, nested `pluginPlatform.version` untouched),
  `opensearch_dashboards.json` combined `version-revision`, changelog reset,
  docs URLs in `endpoints.json` (sed fallback), workflow `default:` branch
  refs in the three quoting styles, and the imposter `specFile` URL.
- Revision handling: same version + new stage increments it, same version +
  same stage keeps it, version increase resets it to `00`.
- Downgrade rejected with an error.
- `--tag` with and without `--stage` (refs become `vX.Y.Z[-stage]`, changelog
  only resynced).
- `--set-as-main` bumps versions but leaves branch/URL references alone.

## Adding tests

1. Pick the matching `test_*.sh` file (or create a new one and add it to the
   loop in `run_all.sh`).
2. Start a case with `test_case "description"`, call `setup_fixture` to get a fresh
   repo (its path is `$WORK`), tweak fixture files if needed, and execute the
   script with `run_tool <script-name> [args...]` — the exit code lands in
   `$STATUS` and combined output in `$OUTPUT`.
3. Assert with `assert_eq`, `assert_contains`, `assert_not_contains`,
   `assert_file_contains`, `assert_file_not_contains`; end the file with
   `summary`.

By default the scripts under test are taken from the parent `tools/`
directory; point `REAL_TOOLS_DIR` elsewhere to test another copy.
