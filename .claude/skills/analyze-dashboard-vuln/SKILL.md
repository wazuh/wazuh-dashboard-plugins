---
name: analyze-dashboard-vuln
description: Analyze a Wazuh dashboard vulnerability row, decide whether the affected library is reachable in production, fill the sheet's CVSS-Overall→Notes columns, and draft a GitHub issue body. User-invoked. Use when triaging Artifactory CVE rows across the Wazuh dashboard repos, before remediation.
---

Analyze an Artifactory vulnerability against the Wazuh dashboard repos (and their upstream OpenSearch forks), then produce two things: the **sheet row fragment** (`CVSS Overall Score → Notes`) the user pastes back, and a **GitHub issue body** `.md` the user creates manually.

The whole analysis turns on one **verdict**: is the affected library **reachable in the production runtime**, or only a dev/test/transitive dependency? That verdict is binary and drives every filled column.

Run in **two beats**: investigate and present findings for confirmation (Beat 1), then — only on the user's "go" — write the artifacts (Beat 2). Never create the GitHub issue yourself; you only write its body to a file and print its title.

Once a row is confirmed **affected** and the user wants it fixed, hand off to the **resolve-cve** skill for remediation.

> **repo-specific (local environment):** the Wazuh dashboard repos sit side by side under the workspace root (the parent directory that contains the sibling dashboard checkouts). Write scratch files and issue drafts to a git-ignored dir such as `tmp/vuln-issues/`.

## Input

The user pastes one or more tab-separated rows copied from the Artifactory vulnerabilities sheet. Columns through **CVSS Base Severity** are filled; `Tentative release` reads `Not evaluated` or blank, `CVSS Overall Score`/`Severity` are blank.

**There is a separate sheet per shipped Wazuh version** (e.g. a 4.10.4 sheet, a 4.14.5 sheet). That version is the **scanned ref** — what to inspect to confirm presence. If the user hasn't said which sheet, **ask** before investigating. The same CVE often recurs across version sheets as separate rows.

Relevant fields per row: **CVE ID**, **GHSA ID**, **Affected library**, **Path** (e.g. `/usr/share/wazuh-dashboard/plugins/securityDashboards/yarn.lock`), **Affected library version**, **CVSS Vector**, **CVSS Base Score**, **CVSS Base Severity**.

Group rows by **CVE** — one CVE produces **one** consolidated issue covering every affected repo, plus one row fragment per input row.

## Beat 1 — Investigate and report

1. **Parse & group.** Split rows by tab, group by CVE ID. For each row, map its `Path` plugin dir to a local repo via [the repo map](#repo-map).

2. **Pick the refs.** Two refs matter and they are different things:

   - **Scanned ref** = the sheet's Wazuh version. Inspect the release **tag `v<version>`** (e.g. `v4.10.4`); fall back to `origin/<version>`. **Never read the bare local branch** — local branches drift from origin and will silently disagree with the scan (a stale `4.10.4` showed 0 handlebars while `v4.10.4` had it). Always `git fetch` first if unsure.
   - **Resolution refs** = where the finding gets fixed/removed: check `origin/5.0.0` and the `5.0.0`/`main` tags to find the release that resolves it (drives `Tentative release`).

3. **Locate + classify (the verdict).** On the scanned ref:

   - Read the repo's `yarn.lock` via `git show <ref>:yarn.lock`, confirm the library and version match the row.
   - Trace why it is pulled in (`yarn why <lib>` in the repo, or follow the dependency chain in the lockfile). If **every** path to it is a `devDependency` (cypress, mocha, mochawesome, build tooling, etc.) → **not affected**. If **any** production dependency pulls it in → **affected**.
   - Record the dependency chain as evidence.

4. **Sweep for extras.** `grep -rl "<lib>" */**/yarn.lock` (or per-repo) across all local dashboard repos to find any repo carrying the library that the pasted rows did **not** include. Report extras so the user can decide whether to add sheet rows; the issue Description lists the union.

5. **Upstream fix status (only if affected).** Our repos are forks of `opensearch-project/*` ([map](#repo-map)). Read upstream via GitHub (don't clone): check tags/branches and the lockfile at a tag (`gh api` or raw `yarn.lock`) to find whether a patched version exists and which OpenSearch release carries it. For dependencies that come straight from upstream's lockfile, link the exact upstream lockfile line as evidence.

6. **Propose + pause.** Present a per-row table: library@version on the scanned ref, prod/dev chain, **verdict**, the resolution ref, proposed **Overall Score/Severity** ([scoring](#scoring)), proposed **Tentative release** with reasoning ([release rules](#tentative-release) — flag the version-mapping guess explicitly), and proposed **Notes**. List any swept extras. **Stop and ask the user to confirm** before Beat 2. (Skip this pause only if the user passed `--yolo`.)

## Beat 2 — Produce artifacts (on confirmation)

7. **Draft the issue body.** First dedup: `gh issue list --repo wazuh/internal-devel-requests --search "<CVE> in:title" --state all`. If one already exists, reuse its URL and skip drafting. Otherwise write the [full template](#issue-template) to a git-ignored scratch file `tmp/vuln-issues/<CVE>.md`, reasoning each impact section for this CVE in Wazuh's context and enumerating all affected repos in the Description.

8. **Print the issue title + labels** for manual creation: title per [convention](#title-convention); labels `level/task`, `type/vulnerability`.

9. **Emit row fragments.** One tab-separated line per input row, in input order, containing exactly `Overall Score → Notes`: `<score>\t<severity>\t<tentative>\t<ISSUE_URL>\t<notes>`. Leave the literal `<ISSUE_URL>` placeholder. Leave the `Origin` column untouched.

## Scoring

Binary, no intermediate environmental score:

- **affected** → `Overall Score = Base Score`, `Overall Severity = Base Severity`.
- **not affected** → `Overall Score = 0`, `Overall Severity = None`.

## Tentative release

This column tracks **the Wazuh release that resolves the finding** (the library is patched or removed) — it is **independent of the exploitability verdict**. A not-affected, dev-only finding still gets the resolving version if the library is bumped/removed there (e.g. handlebars is a non-exploitable devDependency yet its rows read `5.0.0`, because it's patched to 4.7.9 in 5.0.0).

- **resolved in a known Wazuh release** → that version (e.g. `5.0.0`). Always a **Wazuh** version, never an OpenSearch one (Notes may reference the OpenSearch version).
- **affected and unfixed anywhere upstream** → `No fix available yet`.
- **not affected and nothing tracks a resolution** → `Not affected`.

Version-mapping heuristic (**still firming up — surface the reasoning and let the user confirm**): fix/bump landing in OpenSearch `3.x` → Wazuh `5.0.0`; the `4.14.x` line tracks OpenSearch `~2.19.x`. Confirmed data point: handlebars patched `4.7.9` lands in `5.0.0`.

## Notes

Terse verdict justification, plus an evidence link when one exists. Patterns:

- not affected → `It is a development sub-dependency, therefore it cannot be exploited.`
- no fix → `OpenSearch <ver> still has the <lib> <ver> version, which is vulnerable. <upstream yarn.lock#Lxxxx>`
- fixed → `Fixed in Wazuh <ver>` (or `Fixed in this pr <PR url>`).

## Repo map

Sheet `Path` plugin dir → local repo (under the workspace root) → upstream fork source:

| Plugin dir in Path                               | Local repo                           | Upstream (`opensearch-project/…`)      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| `securityDashboards`                             | `wazuh-security-dashboards-plugin`   | `security-dashboards-plugin`           |
| `alertingDashboards`                             | `wazuh-dashboard-alerting`           | `alerting-dashboards-plugin`           |
| `notificationsDashboards`                        | `wazuh-dashboard-notifications`      | `dashboards-notifications`             |
| `reportsDashboards`                              | `wazuh-dashboard-reporting`          | `dashboards-reporting`                 |
| (security analytics)                             | `wazuh-dashboard-security-analytics` | `security-analytics-dashboards-plugin` |
| `wazuh`, `wazuhCore`, `wazuhCheckUpdates`        | `wazuh-dashboard-plugins`            | — (Wazuh-owned)                        |
| base app / `/usr/share/wazuh-dashboard/...` core | `wazuh-dashboard`                    | `OpenSearch-Dashboards`                |

Other OpenSearch plugin dirs (`customImportMapDashboards`, `ganttChartDashboards`, `indexManagementDashboards`, …) may have no Wazuh fork — note that and treat upstream as the source.

## Title convention

`Artifactory wazuh-dashboard CVE-XXXX-XXXXX` — current issues use the umbrella `wazuh-dashboard` even for a single sub-repo path (matching the sheet's `Vulnerability` column, which is `wazuh-dashboard` for this whole sheet). The specific sub-repo and path go in the issue body, not the title.

## Issue template

Write this verbatim structure, filling each section for the specific CVE:

```markdown
# Description

CVE or steps to reproduce.

# Availability impact

Provide a brief description/explanation of how the vulnerability can be used to cause network outages/downtime or impact emergency services.

# Confidentiality impact

Provide a brief description/explanation of how the vulnerability can be used for unauthorized monitoring/disclosure of proprietary/classified systems/information.

# Integrity impact

Provide a brief description/explanation of how the vulnerability can result in theft, destruction, modification or loss of private/sensitive data.

# Exploitability

Provide a brief description of the potential attack scenario, e.g. - how can the vulnerability be exploited?

# Mitigation/Containment plan

Provide details of any workarounds or containment actions that can be taken.
```

For a **not-affected** CVE, still produce all six sections (each stating no production impact and why), matching the `uuid`/`xmldom` precedent.
