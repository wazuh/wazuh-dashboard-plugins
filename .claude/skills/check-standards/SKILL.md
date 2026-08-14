---
name: check-standards
description: Run the same code-quality checks CI runs (Prettier format, ESLint, typecheck, and unit tests) over the current diff before pushing or marking a PR ready. Use before opening/updating a PR, when the user asks to verify standards, lint, format, or check that CI will pass.
---

# Check standards (mirror CI locally)

Runs, over the **changed files only**, the same gates CI applies on Wazuh Dashboard
PRs, so failures are caught before they burn CI minutes. Fix issues, then re-run
until clean.

The approach is generic; blocks marked **repo-specific** cover this repo's exact
commands (test runner, plugin folders, typecheck).

## Workflow

```
- [ ] 1. Compute changed files vs the base branch
- [ ] 2. Prettier --check (autofix with --write)
- [ ] 3. ESLint (autofix with --fix)
- [ ] 4. Typecheck
- [ ] 5. Unit tests for touched plugins
- [ ] 6. Report pass/fail summary
```

### 1. Compute changed files

Match how CI computes them (diff against the base branch, excluding deletions):

```bash
BASE=<version-branch>            # e.g. 5.0.0 — the PR base
git fetch origin "$BASE"
CHANGED=$(git diff --name-status --diff-filter=d "origin/$BASE"...HEAD | awk '{print $NF}')
CODE=$(echo "$CHANGED" | grep -E '\.[jt]sx?$' || true)   # js/jsx/ts/tsx only
echo "$CHANGED"
```

### 2. Prettier (format)

CI runs `prettier --check --ignore-unknown` on changed files. Same locally:

```bash
npx prettier $CHANGED --check --ignore-unknown --config .prettierrc
# autofix:
npx prettier $CHANGED --write --ignore-unknown --config .prettierrc
```

### 3. ESLint

CI runs `eslint` on changed code files. Same locally:

```bash
npx eslint $CODE
# autofix:
npx eslint $CODE --fix
```

> **repo-specific (wazuh-dashboard-plugins):** ESLint config is per-plugin
> (`plugins/*/eslint.config.mjs`). Run from the repo root (as CI does). Ignored
> paths: `public/utils/codemirror/`, `public/kibana-integrations/`.

### 4. Typecheck

> **repo-specific (wazuh-dashboard-plugins):** there is no `typecheck` script.
> Use the root config (covers `public`, `server`, `common`):
>
> ```bash
> npx tsc --noEmit -p tsconfig.json
> ```

### 5. Unit tests (touched plugins)

> **repo-specific (wazuh-dashboard-plugins):** Jest **must run inside the Docker
> dev container** — host runs fail on missing `setup_node_env`. Bring up the env
> (`cd docker/osd-dev && ./dev.sh up`), then, for each plugin containing changed
> files (`plugins/main`, `plugins/wazuh-core`, `plugins/wazuh-check-updates`,
> `plugins/wazuh-ai-assistant`):
>
> ```bash
> docker exec -it <osd-dev-container> bash -lc 'cd plugins/<plugin> && yarn test:jest --runInBand'
> ```
>
> Scope to changed files with `--testPathPattern=<pattern>` for speed.

Remember: unit tests are **colocated** (`*.test.ts` / `*.test.tsx` next to the
source). New source files should ship with their colocated test.

### 6. Report

Summarize each gate as pass/fail; if anything failed, list the offending files and
either fix them or explain what needs manual attention:

```
Prettier: PASS
ESLint:   FAIL (2 files) → public/components/foo.tsx, server/routes/bar.ts
Typecheck: PASS
Jest (plugins/main): PASS
```

Only report "ready for review" once every applicable gate passes.
