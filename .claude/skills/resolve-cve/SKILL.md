---
name: resolve-cve
description: Resolve a dependency CVE in the Wazuh Dashboard plugins — confirm the vulnerable package is actually present and reachable, apply the least-invasive remediation (direct bump, lockfile dedupe, or scoped resolution), verify build/tests/audit, and hand off a prepared PR. Use when the user asks to fix or resolve a CVE / dependency vulnerability, or provides a CVE id or CVE issue URL.
---

# Resolve a dependency CVE

Remediation flow for a dependency vulnerability. Pairs with **analyze-dashboard-vuln**
(triage/verdict + issue drafting) — use that first if it's not yet confirmed the
repo is affected. This skill assumes remediation is wanted.

Optional input: a `CVE-XXXX-XXXXX` id or a CVE issue URL. Without one, look up open
CVE issues and ask which to resolve.

> **repo-specific (wazuh-dashboard-plugins):** this repo has **three independent
> plugins**, each with its own `package.json` + `yarn.lock`: `plugins/main`,
> `plugins/wazuh-core`, `plugins/wazuh-check-updates`. There is **no
> `yarn osd bootstrap`** here (that's the `wazuh-dashboard` platform). Existing
> forced versions live in each plugin's `resolutions` block (e.g.
> `plugins/main/package.json`). Install/build/test run **inside the Docker dev
> container** (see [`CLAUDE.md`](../../../CLAUDE.md)).

## Workflow

```
- [ ] 1. Identify the CVE (package, vulnerable range, safe version, severity)
- [ ] 2. Verify presence + reachability across the plugins
- [ ] 3. Remediate with the least-invasive strategy that works
- [ ] 4. Verify (install + tests + audit; vulnerable version gone)
- [ ] 5. Write a report to tmp/ and deliver via create-pr (prepare mode)
```

### 1. Identify

Read the CVE. If given an issue URL: `gh issue view <url>`. Extract: affected
package, vulnerable version range, recommended safe version, severity, and the
GHSA if present. If you cannot confirm whether the repo is truly affected, run
**analyze-dashboard-vuln** to get the reachability verdict before changing code.

### 2. Verify presence + reachability

For each plugin, check the package is really installed and why:

```bash
for p in plugins/main plugins/wazuh-core plugins/wazuh-check-updates; do
  echo "== $p =="
  grep -n '"<package>"' "$p/package.json" 2>/dev/null       # declared?
  grep -n '<package>@' "$p/yarn.lock" | head               # resolved versions
done
# dependency chain (run in the plugin dir, inside the container):
cd plugins/<plugin> && yarn why <package>
```

If **every** path is a `devDependency` / build-test tool (cypress, jest, etc.) or
a non-runtime transitive, the repo is effectively **not affected** — prefer
documenting that (via analyze-dashboard-vuln) over forcing a change. Remediate
plugins where a **runtime** path pulls the vulnerable version.

### 3. Remediate (least invasive first)

Back up first: `cp <plugin>/package.json <plugin>/package.json.bak` and the same
for `yarn.lock`. Work **per affected plugin**. Try strategies in order:

- **A — Direct bump.** If the package is declared in that plugin's `package.json`,
  set it to the safe version and re-run `yarn` in the plugin dir.
- **B — Lockfile dedupe.** If it's transitive, remove its entries from that
  plugin's `yarn.lock` and re-run `yarn` so it regenerates to a patched version.
- **C — Parent bump.** If a peer/parent constraint pins the old version, bump the
  parent dependency, then retry B.
- **D — Scoped resolution (last resort).** Add to that plugin's `resolutions`
  using the **narrowest** path (`"**/<parent>/<package>": "<safe>"`), never a
  global override. Document why and which chain required it.

Only change versions; never remove a required dependency; follow semver; never
leave the repo in a broken state (restore the `.bak` files on failure).

### 4. Verify

> **repo-specific:** run inside the Docker dev container. For each changed plugin:
>
> ```bash
> cd plugins/<plugin> && yarn && yarn test:jest --runInBand
> ```
>
> Then confirm the vulnerable version is gone (`yarn why <package>` / grep the
> lockfile) and check for new advisories (`yarn npm audit` / `yarn audit`).

If any source code was touched, also run the **check-standards** skill. Remove the
`.bak` files once verification passes.

### 5. Report + deliver

Write a short report to `tmp/cve-<id>.md` (strategy used, per-plugin changes,
dependency chain evidence, verification results — or, on failure, strategies tried
and recommended manual steps).

> **repo-specific:** ensure `tmp/` is git-ignored before writing there.

Then invoke **create-pr** in its default prepare-and-hand-off mode. It applies the
shared rules automatically:

- Base = the version branch the work started from (not always `main`).
- CVE issues usually live in **`internal-devel-requests`** → "Issues Resolved"
  left empty and **no CHANGELOG entry**. If the CVE issue is public, use `closes`
  and add a CHANGELOG entry (under `Fixed`/`Changed`) linking the **issue**.
- Commits DCO-signed.

Suggested PR title: `Fix <CVE-id>: bump <package> to <safe-version>`.

## Success criteria

1. No runtime path resolves the vulnerable version anymore.
2. `yarn` install and `yarn test:jest` pass for each changed plugin (in-container).
3. No new advisories introduced for the resolved package.
4. Report in `tmp/`, and a prepared PR (via create-pr) following repo conventions.
