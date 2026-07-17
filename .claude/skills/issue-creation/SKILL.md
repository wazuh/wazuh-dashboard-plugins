---
name: issue-creation
description: Create a well-formed GitHub issue in a Wazuh Dashboard repo — pick the right issue template, run an issue-first duplicate check, and produce a ready-to-file body with the template's default labels. Use when the user asks to create, open, file, or draft an issue.
---

# Create a Wazuh Dashboard issue

Pick the right issue template, check for duplicates first, then fill the
template verbatim and hand off a ready-to-file body.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Classify intent → choose issue template (ask only if ambiguous)
- [ ] 2. Issue-first check: search existing issues for duplicates
- [ ] 3. Fill the chosen .github/ISSUE_TEMPLATE/*.md verbatim
- [ ] 4. Apply the real Wazuh label for the intent (`type/bug` / `type/enhancement` / `level/task`) + `untriaged`; ignore stale frontmatter labels
- [ ] 5. Emit the ready-to-file body + report (default stop; gh issue create only if asked)
```

### 1. Classify intent → choose template

Map the user's intent to a template. Ask the user only when genuinely
ambiguous between two rows.

| Intent | Template | Labels (from template frontmatter) |
|--------|----------|--------|
| Bug / defect report | `bug_report.md` | `bug` |
| New feature / enhancement request | `feature_request.md` | `enhancement` |
| OpenSearch platform compatibility check | `compatibility_request.md` | `request/operational, level/task, type/maintenance` |
| Wazuh release tracking (wazuh-team only) | `new_release.md` | `enhancement` |
| Objective documentation & evidence gathering | `objective_delivery.md` | `level/task, type/test` |
| Release-candidate UI regression testing | `regression_testing.md` | `level/task, type/test` |
| Engineering task / improvement (not bug, feature, or docs gap) | `task_template.md` | `level/task` |

### 2. Issue-first duplicate check

Before drafting, search for an existing issue covering the same problem:

```bash
gh issue list --search "<keywords>"
gh search issues "<keywords>" --repo wazuh/wazuh-dashboard-plugins
```

On a likely match, surface it to the user and ask whether to proceed with a
new issue or comment on the existing one instead.

### 3. Fill the template

Reference the chosen file under
[`.github/ISSUE_TEMPLATE`](../../../.github/ISSUE_TEMPLATE) — read it first and
fill it verbatim; do not inline template bodies in this skill.

> **repo-specific (wazuh-dashboard-plugins):** label frontmatter is stale for
> `bug_report.md` and `feature_request.md` (bare `bug` / `enhancement` don't
> exist here — see step 4 for the real labels to apply). `new_release.md`
> also declares bare `enhancement`, same caveat.
> `compatibility_request.md`, `objective_delivery.md`, `regression_testing.md`,
> and `task_template.md` all reference labels that **do** exist as declared
> (`request/operational`, `level/task`, `type/maintenance`, `type/test`).
> There is also a **`revision-manual_test.md`** file in
> [`.github/ISSUE_TEMPLATE`](../../../.github/ISSUE_TEMPLATE) with **no YAML
> frontmatter at all** — it won't appear in GitHub's template chooser and has
> no default labels; only use it if the user explicitly points to it (e.g. a
> Python/footprint test report), and copy its body manually.
> There is **no [`config.yml`](../../../.github/ISSUE_TEMPLATE/config.yml)** in
> this repo, so there is no `blank_issues_enabled` override and no
> `contact_links` — blank issues are allowed by default and there are no extra
> support links to surface.
> No workflow in [`.github/workflows`](../../../.github/workflows) auto-labels
> new issues (e.g. no `untriaged`-on-open action) — unlike some sibling repos,
> whatever labels you apply here are the only labels the issue gets; there is
> no auto-added triage label to account for.

### 4. Labels

Several issue templates in this repo were inherited from the upstream
OpenSearch Dashboards fork and still declare stale labels in their
frontmatter (bare `bug`, `enhancement`) that don't exist as real labels here
— GitHub silently drops any label that doesn't exist instead of erroring, so
filing the template as-is can result in no type label at all. Standardize on
the real Wazuh label set instead of trusting the frontmatter verbatim:

| Intent | Real label to apply |
|--------|--------|
| Bug / defect | `type/bug` |
| Feature / enhancement | `type/enhancement` |
| Engineering task / chore | `level/task` |
| Every issue | `untriaged` — no auto-label workflow exists in this repo (unlike sibling repos), add it manually if you want every new issue triaged this way |

Do not invent labels beyond this set, and do not invent an approval workflow.

### 5. Emit the ready-to-file body + report

**Default deliverable — stop here.** Output the filled issue body plus a short
report for the human to review:

```
Issue pre-flight
- Template: <file>
- Labels: <label list>
- Duplicate check: no matches found / possible match: <issue-url>
- Command to open it: gh issue create --template <file> --label "<labels>"
```

Only run `gh issue create` when the user explicitly asks you to open the
issue.
