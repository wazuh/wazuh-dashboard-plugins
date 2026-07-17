---
name: issue-creation
description: Create a well-formed GitHub issue in a Wazuh Dashboard repo — pick the right issue template, run an issue-first duplicate check, and produce a ready-to-file body with the template's default labels. Use when the user asks to create, open, file, or draft an issue.
---

# Create a wazuh-dashboard-plugins issue

Pick the right issue template, check for duplicates first, then fill the
template verbatim and hand off a ready-to-file body.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Classify intent → choose issue template (ask only if ambiguous)
- [ ] 2. Issue-first check: search existing issues for duplicates
- [ ] 3. Fill the chosen .github/ISSUE_TEMPLATE/*.md verbatim
- [ ] 4. Keep the template's default labels; add a triage label only if named
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

> **repo-specific (wazuh-dashboard-plugins):** label frontmatter is stale, do
> not repeat it verbatim without checking — `bug_report.md` and
> `feature_request.md` declare bare `bug` / `enhancement` labels, but this
> repo's actual label set has no such labels — only the prefixed
> `type/bug` / `type/enhancement` (confirmed via
> `gh label list --repo wazuh/wazuh-dashboard-plugins`). GitHub only applies a
> template's `labels:` frontmatter if that exact label already exists in the
> repo, so filing `bug_report.md` or `feature_request.md` as-is **silently
> applies no label at all**. Tell the user this and offer to add `type/bug` /
> `type/enhancement` manually instead of the template default.
> `compatibility_request.md`, `new_release.md` (via `enhancement`, same caveat
> as `feature_request.md`), `objective_delivery.md`, `regression_testing.md`,
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

Keep the template's default labels as-is; add an extra triage label only if
the user explicitly names one. Do not invent labels or an approval workflow.

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
