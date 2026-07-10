# Pull Requests, Workflows and Actions

This documentation assumes basic knowledge of certain tools and technologies, such as Docker, Bash (Linux) or Git.

Before you start coding, read the sections below: they cover how to open good pull requests and how our GitHub Actions behave when you do. Getting this right up front saves CI minutes and review cycles for everyone.

## Pull Requests

These are the standard procedures for creating, updating, and reviewing Pull Requests across the Wazuh Dashboard repositories.

### Lifecycle

```
┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌───────┐
│  Draft   │───▶│ Local review │───▶│ Ready for       │───▶│ Merge │
│  PR      │    │ & test       │    │ review (CI runs)│    │       │
└──────────┘    └──────────────┘    └─────────────────┘    └───────┘
```

Every Pull Request **must** start in **Draft** status. Workflows do not run on Draft PRs — this is enforced across all repositories to avoid wasting GitHub Actions minutes on work in progress — so use Draft status freely while iterating on your changes.

Before marking the PR as ready, **review** the changes and **run the tests and checks (prettier, linter...)** locally to verify they pass and [Run Tests](run-tests.md). This prevents avoidable CI failures that waste runner time and delay reviews. Once everything is complete and locally validated, click **"Ready for review"** and move the linked issue to **Pending review**. This is the moment workflows are triggered for the first time.

To address review feedback, push new commits on top of the branch and re-request review once you have resolved all comments. Avoid amending or rebasing published commits during review, and if CI fails after pushing, investigate and fix it before requesting re-review. When the PR is approved and CI passes, it can be merged. Use **squash merge** for single-purpose PRs to keep a clean history.

### Body template

Use the following template when creating a Pull Request:

```markdown
### Description

<!-- Describe what this change achieves -->

### Issues Resolved

<!-- List any issues this PR will resolve. Prefix the issue with the keyword closes, fixes, fix -->
<!-- Example: closes #1234 or fixes <Issue_URL> -->

### Evidence

<!-- Attach any evidence. Any change to the UI requires an attached screenshot in the PR Description -->

### Testing the changes

<!--
  Please provide detailed steps for validating your changes. This could involve specific commands to run,
  pages to visit, scenarios to try or any other information that would help reviewers verify
  the functionality of your change
-->

### Check List

...
```

Always link the related issue in **Issues Resolved** with a closing keyword (`closes`, `fixes`, `fix`) so it auto closes on merge, and describe **why** rather than just **what**, the diff already shows what changed, so the description should explain the motivation. Any change to the UI **must** include a screenshot or video as evidence.

### Reviewing a PR

Start from the linked issue to understand the context and acceptance criteria, then read the description and checklist before reading the code. Focus your feedback on correctness, clarity, and maintainability. Approve only when you are confident the changes are correct and complete.

### Changelog

Every PR is expected to include an entry in `CHANGELOG.md`, under the `Added`, `Changed`, `Fixed` or `Removed` section for the upcoming version. This is enforced by the **Changelog Verifier** workflow (`5_changelog_verifier.yml`).

**When an entry is required**: whenever the change affects the published package, the UI, or any other user-facing behavior.

**Exceptions**: PRs that only touch internal development tooling or process, with no impact on the published package, don't need one. Common cases:

- CI/CD pipeline changes (GitHub Actions, workflows, build scripts)
- Documentation-only changes
- Linting, formatting, or pre-commit hook configuration
- Dev container / local development tooling changes
- Test-only changes (no behavior change)
- Repository configuration (`.gitignore`, editor configs, issue/PR templates)
- Dependency bumps that don't affect the public API or behavior (e.g. devDependencies)
- Merge, version bump, or bump-revert PRs
- Internal refactoring with no observable change to consumers of the project

If you're unsure whether your PR qualifies, default to adding an entry, or ask a maintainer for guidance in the PR description.

**Grouping entries**: if a PR continues or refines a previously merged feature (e.g. another PR for the same module), append to that entry instead of adding a new one, as long as it still matches the entry's description, don't attach unrelated changes to it just because they touch the same module. Existing entries can also be edited later if a subsequent PR changes or removes what they introduced.

**Skipping the changelog check**: A GitHub Action automatically validates that every PR includes an update to `CHANGELOG.md`. If your PR qualifies for the exception above, add the `no changelog` label to the PR — the workflow detects this label and skips the validation step, allowing the PR to pass checks without a changelog entry.

### Best practices

- **Keep PRs small and focused.** One issue per PR whenever possible.
- **Write descriptive commit messages.** They should explain _why_, not just _what_.
- **Sign your commits** per the DCO using `--signoff`.
- **Do not trigger CI unnecessarily.** Keep PRs in Draft until ready, and validate locally first.

## Workflows and Actions

This section defines the naming conventions and operational rules for the GitHub Actions and Workflows used across the Wazuh Dashboard repositories.

### Naming convention

Both Actions and Workflows follow the same pattern:

```
<major>_<prefix>_<target>
```

| Component  | Description                                                             |
| ---------- | ----------------------------------------------------------------------- |
| **Major**  | Product major version (e.g. `4`, `5`, `6`).                             |
| **Prefix** | Category prefix from the use cases below.                               |
| **Target** | The action target: a component, module, subsystem, tool, language, etc. |

The prefix is drawn from the following set of use cases:

| Use case                                            | Prefix               | Target             | Example                                     |
| --------------------------------------------------- | -------------------- | ------------------ | ------------------------------------------- |
| Code analysis (static/dynamic)                      | `codeanalysis`       | Code analysis tool | `4_codeanalysis_coverity`                   |
| Linter / auto-docs                                  | `codelinter`         | Linter             | `5_codelinter_prettier`                     |
| Code quality (groups `codeanalysis` + `codelinter`) | `codequality`        | Repository         | `5_codequality_changelog`                   |
| Unit tests                                          | `testunit`           | Module             | `5_testunit_jest`                           |
| Component tests                                     | `testcomponent`      | Component/module   | `5_testcomponent_main`                      |
| Integration tests                                   | `testintegration`    | Module             | `4_testintegration_cluster`                 |
| Package builder                                     | `builderpackage`     | Subsystem          | `5_builderpackage_plugins`                  |
| Precompiled object builder                          | `builderprecompiled` | Subsystem          | `5_builderprecompiled_base-dev-environment` |
| Version bumping                                     | `bumper`             | Repository         | `5_bumper_repository`                       |

When composing jobs from Actions, a single job step **cannot** mix Actions with different prefixes, and steps **must** use matrices whenever possible.

### Runners

Two types of runners are available:

| Runner        | Type          | Usage                                                                         |
| ------------- | ------------- | ----------------------------------------------------------------------------- |
| **Default**   | GitHub-hosted | All workflows unless there is a justified reason to use the dedicated runner. |
| **Dedicated** | Self-hosted   | Reserved for resource-intensive workflows only.                               |

**Always prefer the default runner.** The dedicated runner is a shared, limited resource, use it only when the workflow genuinely requires the extra capacity (e.g. a full product builder).

### Draft PR enforcement

All PR workflows **must** be configured to skip Draft PRs, so that no CI minutes are consumed on work-in-progress PRs. This is enforced by adding the following condition to every PR-triggered workflow:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  <job_name>:
    if: ${{ !github.event.pull_request.draft }}
```

### Concurrency

All PR-triggered workflows **must** define a concurrency group scoped to the branch/PR, with `cancel-in-progress` enabled. Without it, pushing several commits in a row queues a run per push, and older, now-outdated runs keep consuming runner time after a newer commit has already superseded them. Add the following to every PR-triggered workflow:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
