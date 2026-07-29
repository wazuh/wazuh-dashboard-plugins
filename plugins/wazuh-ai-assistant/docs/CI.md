# CI story — Wazuh AI Assistant plugin

The plugin's automated checks split into two tiers by what they need to run. Both tiers require
the plugin to sit inside a real `wazuh-dashboard` checkout (its imports resolve `../../src/core`).

In this repository, Tier 1 runs through the shared per-plugin CI: the plugin is listed in the
plugin matrix of `.github/workflows/5_builderprecompiled_base-dev-environment.yml`, which mounts
it into the OSD dev container and runs `yarn && <command>` — `yarn test:jest` for the unit-test
workflow, `yarn build` for the package workflow — exactly like `main`, `wazuh-core`, and
`wazuh-check-updates`.

## Tier 1 — gates that need no live stack

No dashboard, Manager or Indexer needed. These are the fast signal.

Only the unit tests are wired into CI today (the per-plugin matrix in
`.github/workflows/5_builderprecompiled_base-dev-environment.yml` runs `yarn test:jest`). Typecheck,
the guardrail lint and ESLint are run locally with the commands below; adding them to the shared
workflow is a follow-up for the dashboard team.

1. **Typecheck** — `tsc --noEmit`, 0 errors required.

   ```bash
   cd plugins/wazuh-ai-assistant && yarn typecheck
   ```

2. **Unit tests** — Jest via the platform runner (`yarn test:jest`, same harness as the sibling
   plugins), colocated beside the modules they test (`common/`, `server/`) rather than in a
   separate directory. This is the one Tier 1 gate CI runs. Coverage lands in
   `target/test-coverage/` and is commented on PRs by the shared workflow.

   ```bash
   yarn test:jest
   ```

   (Covers the pure-logic security surface: AES-GCM cipher, pseudonymizer, guardrail lint/valves,
   schema validator, wire-schema widening, digest extraction, owner-scoping helpers.)

3. **Guardrail DSL lint** — the adversarial corpus (`eval/lint_cases.json`, 28 cases) against the
   compiled guardrails module.

   ```bash
   yarn test:eval:build   # emits plain CommonJS into target/test
   EVAL_GUARDRAILS_JS=target/test/server/tools/guardrails.js node eval/run_lint.js
   ```

4. **ESLint** — flat config (`eslint.config.mjs`) mirroring `plugins/wazuh-core`'s, with three
   documented deviations (snake_case wire-contract properties, hoisted-function
   use-before-define, OSD empty Setup/Start interfaces).

   ```bash
   yarn lint
   ```

## Tier 2 — integration gates (nightly / pre-release; need a live stack)

Require a running Wazuh AIO (Manager + Indexer + Dashboard) with the plugin installed. Driven by
the scripts in `eval/` against `https://localhost`:

- **Plumbing** (44 checks) — `eval/run_plumbing.js` with the zero-token mock provider
  (`eval/mock_provider.js`): tool plumbing, privacy no-leak assertions.
- **Persistence** (9 checks) — `eval/run_persistence.js`: per-user conversation CRUD + owner
  isolation.
- **Tool matrix** (29 tools) — `eval/run_tool_matrix.js` after seeding with
  `eval/seed_uat_dataset.py`: every catalog tool exercised end-to-end; exits non-zero on any
  SUSPECT-BROKEN or ERROR tool.
- **Live sample** — a small `eval/run_live.js` slice against a real model, to catch
  stream/tool-call regressions a mock can't.

Tier 2 needs a live stack, so it is documented here as a manual/nightly job rather than a per-PR
gate.

## Current gate status (5.0 handover baseline)

Tier 1 verified on the 5.0.0-beta3 build tree
(2026-07-26): typecheck 0 errors · unit 362/362 (Jest) · guardrail-lint 28/28 · ESLint 0
problems · Prettier clean. Tier 2 as of 2026-07-26 on a 5.0.0-beta3 AIO VM:
plumbing 44/44 · persistence 9/9 · enc round-trip 4/4 · tool matrix 29/29.
