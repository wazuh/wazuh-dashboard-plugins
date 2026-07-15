# CLAUDE.md

Wazuh-owned AI context for **`wazuh-dashboard-plugins`**. Keep it short: this file
points to the source-of-truth docs instead of duplicating them. Read the linked
doc before doing non-trivial work.

## What this repo is

A set of **OpenSearch Dashboards (OSD) plugins** that make up the Wazuh UI. It is
_not_ the platform — the platform is the sibling repo `wazuh-dashboard` (an OSD
fork), into which these plugins are installed under its `plugins/` directory.

- Node: see [`.nvmrc`](.nvmrc) (currently 22.22.0). Package manager: Yarn v1.
- Versioning: `plugins/*/opensearch_dashboards.json` (e.g. `5.0.0-04`); platform
  version in each plugin's `package.json` → `pluginPlatform.version`.
- Default branch `main`; work happens on version branches (`5.0.0`, `6.0.0`, …).

## Architecture — read this before importing anything

Three plugins under `plugins/`, in dependency order:

| Plugin folder                 | OSD id              | Role                                                                                      |
| ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `plugins/wazuh-core`          | `wazuhCore`         | Base services: config, API hosts, Server API client, security. Depended on by the others. |
| `plugins/wazuh-check-updates` | `wazuhCheckUpdates` | Update notifications + CTI registration. Depends on `wazuhCore`.                          |
| `plugins/main`                | `wazuh`             | Main app (alerts, agents, modules, Dev Tools…). Depends on both above.                    |

Each plugin is **self-contained**: its own `package.json`, `yarn.lock`,
`eslint.config.mjs`, `knip.json`, and Jest config.

### `public/` vs `server/` vs `common/` (the #1 source of import mistakes)

Every plugin splits into three layers that are bundled **separately**:

- **`public/`** — runs in the **browser** (React, Redux, client services). Uses
  DOM/`window`, OSD `core.http`, EUI.
- **`server/`** — runs in **Node.js** (Hapi routes, controllers, background
  jobs, Wazuh Server API proxying). Uses `fs`, server context, secrets.
- **`common/`** — **isomorphic** code shared by both: constants, types, pure
  services. No DOM and no Node-only APIs.

**Import rules (strict):**

1. `public/` must **never** import from `server/`, and `server/` must **never**
   import from `public/`. Putting Node code in a browser bundle (or vice-versa)
   breaks the build/runtime.
2. Both `public/` and `server/` may import from `common/`. Put anything shared in
   `common/`.
3. Cross-plugin imports go **layer-to-layer**: `public → other/public`,
   `server → other/server`. Prefer the contracts returned by a plugin's
   `setup()`/`start()` (wired via `requiredPlugins` in
   `opensearch_dashboards.json`) over reaching into deep internal paths.

### How `public/` and `server/` communicate

They do **not** import each other — they talk over HTTP:

- `server/routes/*` register endpoints (`/api/...`, validated with `schema`) that
  delegate to `server/controllers/*`, which call the Wazuh Server API through
  `context.wazuh_core` (provided by `wazuh-core`).
- `public/` calls those routes. `main` uses `WzRequest` →
  `public/services/request-handler.js` (axios); newer plugins use OSD
  `core.http`. Wazuh API calls funnel through `POST /api/request`.

### Tests are colocated

Unit tests live **next to the code** as `*.test.ts` / `*.test.tsx` inside
`public/`, `server/`, and `common/`. The `plugins/*/test/` folder is **not** unit
tests — it holds Jest config, `__mocks__`, Cypress (`test/cypress`), and
functional tests. When you add a source file, add its test beside it.

## Commands — run inside the Docker dev container

The canonical dev/test environment is Docker (`docker/osd-dev`). Host runs fail
because Jest needs OSD's `setup_node_env`. See
[`docs/dev/run-sources.md`](docs/dev/run-sources.md) and
[`docs/dev/run-tests.md`](docs/dev/run-tests.md).

```bash
# 1) Bring up the environment (from repo root)
cd docker/osd-dev && ./dev.sh up

# 2) Attach to the OSD container
docker ps                          # find the osd-dev-* container
docker exec -it <container> bash

# 3) Inside the container, per plugin (e.g. plugins/main):
yarn start --no-base-path          # dev server → https://0.0.0.0:5601 (admin:admin)
yarn test:jest --runInBand         # unit tests (also: --testPathPattern=<file>)
yarn lint                          # eslint on public/server/common
yarn lint:fix                      # autofix
yarn format                        # prettier
yarn knip                          # unused files/exports
```

Run per-plugin commands from that plugin's folder (`plugins/main`,
`plugins/wazuh-core`, `plugins/wazuh-check-updates`). Fallback host setup:
[`docs/dev/setup.md`](docs/dev/setup.md).

## Code conventions

Enforced by tooling — run the linter/formatter, don't hand-format:

- TypeScript-first; single quotes; semicolons; 2-space indent; max line 100
  ([`eslint.config.mjs`](eslint.config.mjs), [`.prettierrc`](.prettierrc)).
- Filenames follow `filenames-simple` (kebab-case, e.g. `wz-menu.tsx`).
- `camelCase`, `eqeqeq`, `no-var`, `curly`, no duplicate imports, `require-await`.
- English everywhere (code, comments, commits, docs). Full guide:
  [`STYLEGUIDE.md`](STYLEGUIDE.md).

## Git / PR workflow

Full detail in [`docs/dev/pull-requests.md`](docs/dev/pull-requests.md) and
[`CONTRIBUTING.md`](CONTRIBUTING.md). Essentials:

- Branch names: `<type>/<issue#>-<kebab-desc>` (`fix/`, `enhancement/`, `feat/`,
  `bug/`, `change/`, `doc/`). PR base = the target version branch.
- **Sign commits** (DCO `--signoff`). Imperative, capitalized subject ≤ 50 chars.
- Open PRs as **Draft** (CI skips drafts); run lint + tests locally, then "Ready
  for review". Use squash merge for single-purpose PRs.
- Update [`CHANGELOG.md`](CHANGELOG.md) for any user-facing change; the entry
  **links to the issue, not the PR**. Add no entry for `internal-devel-requests`
  issues or tooling/doc/test-only PRs (use the `no changelog` label).
- Issues are shared as URLs and may live in another repo. Issues from
  `internal-devel-requests` are internal: don't expose their link in the PR
  ("Issues Resolved" empty) and add no CHANGELOG entry.
- UI changes require a screenshot/video in the PR.

## Fork coexistence

The upstream OSD `CLAUDE.md` lives in the `wazuh-dashboard` repo and describes
OpenSearch, not Wazuh. This file is Wazuh-owned; on upstream syncs, Wazuh content
wins and relevant upstream notes are folded into the sections above.

## AI working rules

- Before proposing a PR: `yarn lint` + `yarn test:jest` pass for touched plugins.
- Never weaken auth/CSP/security; never commit secrets or credentials.
- Never force-push shared branches; never commit without DCO sign-off.
- Respect the `public`/`server`/`common` import rules above — when in doubt, put
  shared code in `common/`.

## Source-of-truth docs

- [`docs/`](docs/) — mdBook (dev, reference, diagnostics). Entry:
  [`docs/dev/README.md`](docs/dev/README.md).
- [`docs/AGENTS.md`](docs/AGENTS.md) — documentation-writing conventions.
- [`STYLEGUIDE.md`](STYLEGUIDE.md), [`SECURITY.md`](SECURITY.md),
  [`RELEASING.md`](RELEASING.md).
- Per-plugin READMEs: `plugins/main/README.md`, `plugins/wazuh-core/README.md`,
  `plugins/wazuh-check-updates/README.md`.
