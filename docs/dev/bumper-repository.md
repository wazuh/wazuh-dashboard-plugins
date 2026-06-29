# Repository bumper

This guide documents the **repository bumper**: the mechanism used to bump the
version, stage and revision across this repository in a single, consistent
operation.

It has two parts:

- **`tools/repository_bumper.sh`** — the shell script that performs all file
  edits. It is the engine and can be run locally.
- **`.github/workflows/*_bumper_repository.yml`** — the GitHub Actions workflows
  that run the script in CI, then create and merge a pull request with the
  result.

> **Note**: This document describes the files as they exist in **`wazuh-dashboard-plugins`**.
> The same workflow exists in the other Wazuh dashboard repositories
> (`wazuh-dashboard`, `wazuh-security-dashboards-plugin`, `wazuh-dashboard-reporting`,
> `wazuh-dashboard-security-analytics`, `wazuh-dashboard-alerting`,
> `wazuh-dashboard-notifications`) and its contents may differ per repository,
> because each repository tracks a different set of files.

## Workflow files in this repository

This repository keeps several **generations** of each CI workflow, distinguished
by a numeric prefix. For the bumper there are three files:

| File | Relationship |
| --- | --- |
| `.github/workflows/4_bumper_repository.yml` | Base version. |
| `.github/workflows/5_bumper_repository.yml` | Extended version (adds `set_as_main`, `bump-issue-link` and `revert`). |
| `.github/workflows/6_bumper_repository.yml` | Byte-for-byte identical to `4_bumper_repository.yml`. |

The numeric prefix denotes a workflow generation, not strictly a Wazuh major
version: on the `5.0.0` branch the sibling `5_*` and `6_*` build/test workflows
default their `reference` input to `5.0.0`, while the `4_*` workflows default to
`4.14.0`. The bumper script only rewrites branch defaults for the `5_*` and `6_*`
generations on this branch (see [Branch reference updates](#branch-reference-updates)).

This guide documents `4_bumper_repository.yml` and `5_bumper_repository.yml` in
detail; `6_bumper_repository.yml` is byte-identical to `4_bumper_repository.yml`
and is therefore covered by the same description.

---

## The script: `tools/repository_bumper.sh`

A pure-shell script (no `jq`/`yq` dependency for its core edits) that updates
version metadata across the repository. It is compatible with macOS and Linux
(it adapts `sed -i` and `sed -E`/`-r` per platform).

### Parameters

Derived from the script's `usage()` output and `validate_input` (parameter
names and required rules are exact; descriptions are summarized):

| Parameter | Required | Description |
| --- | --- | --- |
| `--version VERSION` | Required unless `--tag` is used | Target version in `x.y.z` form (e.g. `4.6.0`). |
| `--stage STAGE` | Required unless `--tag` is used | Stage in `<letters><number>` form (e.g. `alpha0`, `beta1`, `rc2`). |
| `--tag` | — | Use tag-like references. With `--stage` it produces `v<version>-<stage>`; without it, `v<version>`. When set, `--version` and `--stage` are not required. |
| `--set-as-main` | — | Skip updating branch/URL references (used when bumping `main` itself). Version values are still bumped. |
| `--help` | — | Print usage and exit. |

Input validation (`validate_input`):

- `--version` must match `^[0-9]+\.[0-9]+\.[0-9]+$` (e.g. `5.0.0`).
- `--stage` must match `^[a-zA-Z]+[0-9]+$` (e.g. `alpha0`).
- If `--tag` is not set, both `--version` and `--stage` are required.

### What the script modifies

All paths below were confirmed to exist in this repository. The script targets
plugin files dynamically via `git ls-files`, so the lists reflect the tracked
files at run time.

| File / pattern | Field updated |
| --- | --- |
| `VERSION.json` | `version`, `stage` |
| `plugins/*/package.json` (tracked, excluding `test/cypress/package.json`) | `version`, `revision` |
| `plugins/*/opensearch_dashboards.json` (tracked) | `version` set to `<version>-<revision>` |
| `CHANGELOG.md` | Inserts/updates the `## Wazuh v<version> - OpenSearch Dashboards <platform> - Revision <rev>` entry |
| `plugins/main/common/api-info/endpoints.json` | Documentation URLs `documentation.wazuh.com/<major.minor>` |
| `.github/workflows/*.yml` (selected, see below) | `default:` branch references |
| `docker/imposter/wazuh-config.yml` | `specFile` Git reference in the URL |

In this repository the tracked plugin files currently are:

- `plugins/main/package.json`, `plugins/wazuh-core/package.json`,
  `plugins/wazuh-check-updates/package.json`
- `plugins/main/opensearch_dashboards.json`,
  `plugins/wazuh-core/opensearch_dashboards.json`,
  `plugins/wazuh-check-updates/opensearch_dashboards.json`

> **Note**: For the API info files, the script first tries
> `yarn generate:api-data` (which regenerates `endpoints.json` and
> `security-actions.json`) followed by `yarn prettier --write`. If that command
> fails — for example when dependencies are not installed — it falls back to a
> `sed` rewrite of the `documentation.wazuh.com/<major.minor>` URLs in
> `endpoints.json` only. Either way, the update is **skipped** when the
> major.minor version does not change.

### Revision logic

The revision is computed by comparing the new `--version` against the current
`version` in `VERSION.json`:

- New version **greater** (major, minor or patch increased) → revision reset to
  `00`. A version **lower** than the current one is rejected with an error.
- New version **identical** to the current one → the current revision is read
  from `plugins/main/package.json`:
  - if `--stage` is provided **and differs** from the current stage → revision is
    incremented (e.g. `03` → `04`);
  - otherwise the revision is kept unchanged.

### CHANGELOG behavior

The OpenSearch Dashboards version is read from `pluginPlatform.version` in
`plugins/main/package.json`. If a changelog entry for the same
`v<version>` + platform version already exists, only its revision number is
updated (and only when `--stage` is provided); otherwise a new entry is inserted
near the top of `CHANGELOG.md`.

### Branch reference updates

When `--set-as-main` is **not** used, `update_branch_reference_defaults` rewrites
`default: main` references (bare, single- or double-quoted) to the bump target in
this fixed list of workflows:

```
.github/workflows/5_testunit_jest.yml
.github/workflows/5_builderpackage_plugins.yml
.github/workflows/5_builderprecompiled_base-dev-environment.yml
.github/workflows/6_builderpackage_plugins.yml
.github/workflows/6_builderprecompiled_base-dev-environment.yml
.github/workflows/6_builderprecompiled_playground.yml
.github/workflows/6_testunit_jest.yml
.github/workflows/dev-environment.yml
.github/workflows/manual-build.yml
.github/workflows/playground.yml
.github/workflows/wazuh-build-push-docker-action.yml
```

The replacement value is `v<version>[-<stage>]` when `--tag` is set, otherwise the
plain `<version>`. Files in the list that do not exist are skipped with a
`WARNING` — in this repository `wazuh-build-push-docker-action.yml` is **not
present**, so it is always skipped.

`docker/imposter/wazuh-config.yml` is updated the same way: the
`specFile: https://raw.githubusercontent.com/wazuh/wazuh/<ref>/…` reference is
rewritten to the bump target (skipped when `--set-as-main` is used).

### `--set-as-main`

`--set-as-main` sets the internal `SKIP_URLS=yes` flag, which **skips** both
`update_branch_reference_defaults` and the imposter `specFile` update. Version,
revision, changelog and JSON files are still bumped. It is meant for bumping the
`main` branch, whose references must keep pointing at `main`.

### Logging

Every run writes a timestamped log file `repository_bumper_<timestamp>.log` in the
`tools/` directory (the script's own folder). The script must be run from inside
the git repository.

### Usage examples

```bash
# Version + stage bump
./tools/repository_bumper.sh --version 5.0.0 --stage alpha0

# Tag-like references, with stage  → v5.0.0-alpha1
./tools/repository_bumper.sh --tag --stage alpha1

# Tag-like references, stageless   → v5.0.0
./tools/repository_bumper.sh --tag

# Bump main without rewriting branch/URL references
./tools/repository_bumper.sh --version 5.1.0 --stage alpha0 --set-as-main
```

---

## The workflows

All three bumper workflows share the same shape:

- **Trigger:** `workflow_dispatch` only (manual run from the Actions tab or
  `gh workflow run`).
- **Runner:** an AWS CodeBuild runner
  (`codebuild-github-actions-codebuild-runner-dashboard-amd-…`).
- **Permissions:** `contents: write`, `pull-requests: write`.
- **Environment:** GPG signing key, a bumper token, and
  `BUMP_SCRIPT_PATH=tools/repository_bumper.sh`.

High-level steps:

1. Dump the event payload.
2. Import the GPG key and configure git for signed commits.
3. Checkout the repository (using the bumper token).
4. Build the script parameters and the branch name (`Determine branch name`).
5. Create the bump branch, run the script, commit and push.
6. Create a pull request against the triggering branch and merge it with
   `--admin` (branch checks are intentionally bypassed).
7. Print the branch, PR URL and the bumper log.

### Inputs

#### `4_bumper_repository.yml` (and identical `6_bumper_repository.yml`)

| Input | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `version` | no | string | `''` | Target version (e.g. `1.2.3`). |
| `stage` | no | string | `''` | Version stage (e.g. `alpha0`). |
| `tag` | no | boolean | `false` | Change branch references to tag-like references (e.g. `v4.12.0-alpha7`). |
| `issue-link` | **yes** | string | — | Issue link `https://github.com/wazuh/<REPO>/issues/<NUMBER>`. |
| `id` | no | string | — | Optional identifier shown in the run name. |

#### `5_bumper_repository.yml`

All inputs above, plus:

| Input | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `set_as_main` | no | boolean | `false` | Bump version values only; keep branch references pointing to `main` (maps to `--set-as-main`). |
| `bump-issue-link` | no | string | — | Issue link used in the original bump; needed for revert when it differs from `issue-link`. |
| `revert` | no | boolean | `false` | Revert the bump previously applied for the issue. |

### How inputs map to script parameters

The `Determine branch name` step translates the inputs into script flags:

| Inputs provided | Script call |
| --- | --- |
| `version` **and** `stage`, `tag` = false | `--version <version> --stage <stage>` |
| `stage` only, `tag` = true | `--stage <stage> --tag` |
| neither `version` nor `stage`, `tag` = true | `--tag` |
| (`5_` only) `set_as_main` = true | the above **plus** `--set-as-main` |

> **Important**: any other combination produces **empty** parameters. In
> particular, providing `version` without `stage`, or providing `version`
> together with `tag = true`, yields no parameters and the script then fails its
> own validation. Use either `version` + `stage`, or `tag` (optionally with
> `stage`).

The bump branch is named `enhancement/wqa<issue_number>-bump-<ref_name>`
(the `<issue_number>` is the trailing path segment of `issue-link`). The PR is
opened against the branch the workflow was triggered on (`github.ref_name`).

### Differences between `4_` and `5_`

`5_bumper_repository.yml` extends the base workflow with:

- **`set_as_main` input** → appends `--set-as-main` to the script call.
- **No-op detection** (`Check for changes`): if the script produces no diff, the
  workflow skips commit/PR/merge and reports a no-op instead of failing.
- **Revert support** (`revert` + `bump-issue-link`): when `revert = true` the
  script is **not** run. Instead the workflow finds the original merged bump PR
  (branch `enhancement/wqa<bump_issue>-bump-<ref_name>`), reverts its merge commit
  with `git revert -m 1 --no-commit`, restores `VERSION.json`, `CHANGELOG.md`, the
  plugin `package.json`/`opensearch_dashboards.json` files, and commits only the
  remaining branch-reference reversions. The revert branch is
  `enhancement/wqa<issue_number>-revert-bump-<ref_name>`.
- **`fetch-depth: 0`** on checkout (full history, required to locate and revert the
  original commit).

`4_bumper_repository.yml` (and `6_`) has none of these: it always runs the script,
always commits, and always creates and merges a PR.
