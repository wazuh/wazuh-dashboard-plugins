---
name: develop-issue
description: Take a GitHub issue of a Wazuh Dashboard repo end-to-end — pick it (or list the team Backlog), claim it on the Dashboard team project board, create the branch, sanity-check and analyze it, comment the approach, implement with colocated tests, validate with check-standards, add the CHANGELOG entry, open the Draft PR linked to the issue, set the board status and comment the implementation. Use when the user provides an issue to develop, implement, work on or take, or asks to pick one from the team backlog. Args - [issue URL | owner/repo#N | N] [--auto | --confirm-each] [--dry-run] [--finish <pr>]
---

# Develop an issue (backlog → branch → code → tests → Draft PR → board)

Entry point for feature/bug work. Drives one issue through the Dashboard team
board (the Dashboard team project of the `wazuh` org) from start to finish, chaining the `check-standards`
and `create-pr` skills.

```
Backlog ──claim──▶ In progress ──analyze + implement──▶ Draft PR opened
                                                        ├─▶ Pending review (PR ready)
                                                        └─▶ Blocked (comment explains why)
```

## 0. Parse arguments and choose the mode

| Arg                                    | Meaning                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| issue URL, `owner/repo#N`, `#N` or `N` | The issue to work on. Omitted → list the Backlog and ask (step 1).                                                                                                                                                                                                                        |
| _(none)_ — **checkpoint** (default)    | Local work runs freely. Before the **first outward action after claiming** (analysis comment, push, PR, status change) show the drafts and wait for one "go". After it, continue to the end without asking again unless something new comes up (blocker, no-change verdict, UI evidence). |
| `--auto`                               | No confirmations. Stop only for genuinely unclear issues or decisions only the user can make (including the step 4 sanity-check findings).                                                                                                                                                |
| `--confirm-each`                       | Ask before **every** comment, status change, assignment, push, PR create/ready.                                                                                                                                                                                                           |
| `--dry-run`                            | Write nothing to GitHub (no assign, comment, status, push, PR). Local analysis is fine; print every action that would run with its full text.                                                                                                                                             |
| `--finish <pr>`                        | Resume a PR left as Draft for UI evidence: jump to step 9 for that PR (then 9b CI watch).                                                                                                                                                                                                 |

"Outward action" = anything visible to others: issue assignment/comments, project
status, `git push`, `gh pr create/ready/edit`. State the active mode to the user at
the start.

## Project board (resolved at runtime)

The board is the **Dashboard team project** of the `wazuh` GitHub organization
(titled like "XDR+SIEM/Dashboard team"). Don't hard-code its number or ids: resolve
them once at the start and reuse the values.

**Local file first (optional).** If the file written by the `setup-local-secrets` skill
exists (`${WZSS_FILE:-$HOME/.config/wzss/secrets.env}`, mode `600`), read the
`WZSS_DASHBOARD_PROJECT_*` variables from it in the same shell command that uses them
(`PROJECT_NUMBER` = `WZSS_DASHBOARD_PROJECT_NUMBER`, `PROJECT_ID` =
`WZSS_DASHBOARD_PROJECT_ID`, `STATUS_FIELD_ID` = `WZSS_DASHBOARD_PROJECT_STATUS_FIELD_ID`,
`STARTDATE_FIELD_ID` = `WZSS_DASHBOARD_PROJECT_STARTDATE_FIELD_ID`, and each Status option
id = `WZSS_DASHBOARD_PROJECT_STATUS_<NAME>_ID`, e.g. `…_IN_PROGRESS_ID`). Never print the
values. If the file or a variable is missing, offer to run `/setup-local-secrets`, or
resolve them as below.

```bash
# 1) The project whose title mentions "Dashboard team" (several or none → ask the user)
gh project list --owner wazuh --limit 200 --format json \
  -q '.projects[] | select(.title | test("Dashboard team")) | {number, id, title}'
# 2) Its fields: ids of "Status" (with its options) and "Start date"
gh project field-list <PROJECT_NUMBER> --owner wazuh --format json \
  -q '.fields[] | select(.name=="Status" or .name=="Start date") | {id, name, options}'
```

Keep `PROJECT_NUMBER`, `PROJECT_ID`, `STATUS_FIELD_ID`, `STARTDATE_FIELD_ID` and the
Status option ids by **name** (Triage, Backlog, In progress, On hold, Blocked, Pending
review, In review, Pending final review, In final review, Done). A missing field or
option → stop and tell the user the board changed; never guess ids.

Status changes always use
`gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> --field-id <STATUS_FIELD_ID> --single-select-option-id <option id of the status>`.

Priority order: Urgent > Very high > High > Medium > Low > Very low > (none)

## Workflow

Copy this checklist and track progress:

```
- [ ] 0b. Resolve the project board ids (see Project board)
- [ ] 1. Select the issue (list Backlog and ask if not given/unclear)
- [ ] 2. Claim it: assign @me + Status → In progress + Start date
- [ ] 3. Check the workspace (current checkout = target repo) and create the branch
- [ ] 4. Sanity check the request (nonsensical / cross-team?) — ask the user if anything is found
- [ ] 5. Analyze; comment findings + approach on the issue
- [ ] 6. Implement, with colocated tests
- [ ] 7. Validate with check-standards; add the CHANGELOG entry
- [ ] 8. Push + open the Draft PR linked to the issue
- [ ] 9. Finish: PR ready + Status → Pending review + implementation comment
- [ ] 9b. PR ready → watch its GHA jobs until done → report the result
- [ ] B. (any step) Blocked path: comment + Status → Blocked
- [ ] 10. Report to the user
```

### 1. Select the issue

**No issue given** → list Backlog items (paginate with `after:` while
`hasNextPage`):

```bash
gh api graphql -F project=<PROJECT_NUMBER> -f q='status:Backlog' -f query='
query($project:Int!,$q:String!,$after:String){organization(login:"wazuh"){projectV2(number:$project){
  items(first:100, query:$q, after:$after){pageInfo{hasNextPage endCursor}
    nodes{id
      priority:fieldValueByName(name:"Priority"){... on ProjectV2ItemFieldSingleSelectValue{name}}
      size:fieldValueByName(name:"Size"){... on ProjectV2ItemFieldSingleSelectValue{name}}
      content{... on Issue{id number title url state repository{nameWithOwner}
        assignees(first:5){nodes{login}} labels(first:10){nodes{name}}}}}}}}}'
```

Show a table sorted by Priority (then Size, smaller first): `#`, repo, title,
priority, size, assignees, labels. Skip closed issues and draft items (no
`content`). Mark items assigned to someone else — don't pick those without the
user saying so. Ask which one to take (the top candidates + "Other"). If the user
asked for something narrower ("my issues", "bugs in plugins"), filter the query
(`assignee:@me`, `label:type/bug`, `repo:…`).

**Issue given** → resolve it and its project item:

```bash
gh api graphql -F owner=wazuh -F repo=<repo> -F number=<n> -f query='
query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){
  issue(number:$number){id url title state
    projectItems(first:20){nodes{id project{number}
      fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}'
```

- Bare number → search the Backlog list for it; several repos match → ask.
- Not on the Dashboard team project → ask whether to add it (`gh project item-add <PROJECT_NUMBER> --owner wazuh --url <issue-url>`),
  then re-resolve the item id.
- Closed, already assigned to someone else, or not in Backlog/Triage → tell the
  user and ask before continuing.

Save `ISSUE_URL`, `ISSUE_REPO`, `ITEM_ID`, `ISSUE_NODE_ID` (the issue's GraphQL
`id`), and whether the issue is **internal**:

- **Internal** — URL is under `github.com/$WZSS_INTERNAL_ISSUES_REPO/`, the internal
  requests repository (read the variable from the local env file, see
  `setup-local-secrets` section 5; not set, or the repo is neither this one nor clearly
  public → ask the user whether the issue is internal and offer to run
  `setup-local-secrets`): the issue link is **not** exposed in the PR
  (`## Description` does not reference it), there is **no CHANGELOG entry**, and the
  PR has no issue reference at all.
- **Public** — any other repo (e.g. `wazuh/wazuh-dashboard-plugins`): link it in the
  PR and add a CHANGELOG entry pointing to the issue.

### 2. Claim

```bash
gh issue edit <ISSUE_URL> --add-assignee @me
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> \
  --field-id <STATUS_FIELD_ID> --single-select-option-id <In progress option id>
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> \
  --field-id <STARTDATE_FIELD_ID> --date "$(date +%F)"                          # Start date = today
```

Claiming is not gated by the checkpoint (it only signals the issue is taken);
`--confirm-each` asks first, `--dry-run` only prints it.

### 3. Workspace (current checkout)

Work happens in the checkout the session runs in — do not create worktrees or
`cd` into other repos.

1. Target repo = `ISSUE_REPO`, except for **internal** issues: infer it from the
   issue body/labels/links (mentions of `wazuh-dashboard-plugins`, a plugin path,
   the security plugin…). Unclear → ask.
2. `gh repo view --json nameWithOwner -q .nameWithOwner` must equal the target
   repo (forks: compare `git remote -v` upstream). Mismatch → stop, tell the user
   to re-run from a clone of the target repo, and leave the card in "In progress"
   (or move it back to Backlog if the user prefers).
3. `git status --porcelain` — uncommitted changes unrelated to this issue → stop
   and ask; never stash, discard, or commit someone else's work.
4. Pick the base version branch from the issue's milestone/labels (e.g. `5.0.0`; see
   `create-pr` step 1) — ask if ambiguous, never assume `main`. Then
   `git fetch origin <base>` and
   `git switch -c <type>/<issue#>-<kebab-desc> origin/<base>`
   (`<type>` ∈ `fix`, `bug`, `enhancement`, `feat`, `change`, `doc`). If a branch for
   this issue already exists locally/remotely, reuse it and ask if unsure.

### 4. Sanity check the request

Before investigating the code, check that the request holds up:

- **Makes no sense:** contradictory or impossible requirements, no clear goal,
  already the intended behavior, wrong product/version.
- **Needs other teams' apps:** requirements that need changes outside the
  Dashboard team's code — `wazuh-indexer`, manager/server, agent, other repos than
  the target, shared infrastructure — instead of (or besides) the target repo.

Nothing found → continue silently. Something found → **stop and report it to the
user** (what is asked, why it doesn't make sense or which app/team owns it, with
evidence) and ask for the decision. Options: proceed with only the Dashboard-owned
part · proceed as written · Blocked path (B) · no change needed / ask the author
for clarification. Never decide this alone.

This applies in **every mode**, including `--auto` and `--dry-run` (it is
read-only). It is not part of the checkpoint "go": it happens first, and the answer
feeds the verdict and the analysis comment.

### 5. Analyze and comment

Read everything before deciding:

```bash
gh issue view <ISSUE_URL> --comments
gh issue view <ISSUE_URL> --json closedByPullRequestsReferences,labels,milestone
gh pr list --repo <target> --search "<issue#> in:body" --state all
```

Restate the issue's goal and acceptance criteria in your own words and identify the
affected **plugin(s)** and **layer(s)** — `public` (browser/React), `server`
(Node/routes/controllers), `common` (shared). Investigate the code (search, read,
reproduce if cheap), then reach one verdict (the step 4 decision steers it):

- **Needs code change** → continue to step 6.
- **No change needed** (already fixed, works as designed, duplicate) → comment the
  evidence (commit/PR/file:line), then **ask the user** which status to set — never
  move to Done or close the issue yourself.
- **Blocked** → Blocked path (B).

Post the **analysis comment** (write it to a temp file outside the repo and use
`gh issue comment <ISSUE_URL> --body-file <file>`):

```markdown
## Analysis

**Summary:** <1–3 sentences: what is wrong / what is asked>

**Findings**

- <root cause or current behavior, with `path/file.ts:line` references>
- <related code, previous PRs/issues>

**Proposed approach**

- <what will change, in which plugin/layer (public/server/common)>
- <tests to add>

**Alternatives considered:** <option — why not chosen> (omit if none)

**Open questions / risks:** <anything that could change the approach; cross-team dependencies or scope reductions agreed in step 4> (omit if none)
```

In checkpoint mode this comment is part of the single "go" bundle: show it together
with the planned branch/base and the expected final status. Ask the user only if
genuinely blocked; otherwise proceed with reasonable defaults.

### 6. Implement and test

Keep the change scoped to the issue. Respect the architecture and conventions in
[`CLAUDE.md`](../../../CLAUDE.md):

- Never import `server/` from `public/` or vice versa; put shared code in
  `common/`. Cross-plugin: `public → other/public`, `server → other/server`,
  preferably via `setup()`/`start()` contracts.
- `filenames-simple` naming (kebab-case), TypeScript, English everywhere.
- User-facing text you add or touch goes through i18n, following STYLEGUIDE's
  Internationalization section. The i18n gate in `yarn test:jest` rejects bad ids
  and messages.
- Documentation you add or touch never links to another Wazuh repository
  (`github.com/wazuh/<repo>/...`): those URLs point to a specific branch. Write a
  literal reference instead, such as _Wazuh Manager > Getting Started >
  Installation > Options_. See the "References to other Wazuh repositories"
  section of [`docs/AGENTS.md`](../../../docs/AGENTS.md).

Add or update unit tests as `*.test.ts` / `*.test.tsx` **next to** the changed
source files. New functionality must include testing.

> **repo-specific (wazuh-dashboard-plugins):** run Jest inside the Docker dev
> container (`cd docker/osd-dev && ./dev.sh up`, then `docker exec` into the
> `osd-dev-*` container and `cd plugins/<plugin> && yarn test:jest --runInBand`).
> Host runs fail on missing `setup_node_env`.

Commits: Conventional Commits subject, `git commit --signoff`, and the
co-author trailer required by the session. If the implementation departs from the
approach in the analysis comment, note it for the final comment. If something
cannot be resolved (failing unrelated tests, broken env, missing decision) →
Blocked path.

### 7. Validate and CHANGELOG

Run the **check-standards** skill (prettier + eslint + typecheck + tests over the
diff). Fix everything it reports before delivering.

For **public** issues, add an entry under the upcoming version in
[`CHANGELOG.md`](../../../CHANGELOG.md) (`Added` / `Changed` / `Fixed` /
`Removed`), with the link pointing to the **issue** (not the PR). Skip the entry for
**internal** issues and for tooling/docs/test-only changes (use the `no-changelog`
label on the PR).

### 8. Push and open the Draft PR

Run **create-pr** to prepare the body and pre-flight report (this skill is the
explicit ask that lets it run `gh pr create`). Then:

```bash
git push -u origin <branch>
gh pr create --draft --base <base> --assignee @me \
  --title "<Imperative, capitalized subject ≤ 50 chars>" \
  --body-file <temp-dir>/pr-body.md
PR_NODE_ID=$(gh pr view <pr> --json id -q .id)
gh api graphql -f query="mutation { addCloseIssueReferences(input: {issueId: \"$ISSUE_NODE_ID\", pullRequestIds: [\"$PR_NODE_ID\"]}) { clientMutationId } }"
```

- Body = the filled PR template. Public issue → `Closes <#n|url>`. **Internal
  issue → no issue reference in the PR at all.** `### Results and Evidence` stays
  empty for the developer.
- Always run the `addCloseIssueReferences` call right after creating the PR: it
  links the PR in the issue's Development section via node ids, independent of any
  closing keyword, so internal-issue PRs show up there too.
- Add `--label no-changelog` when no CHANGELOG entry is needed.
- Decide if the change is **UI-visible** (anything under `public/` that changes
  what users see).

### 9. Finish

**Non-UI change and check-standards PASS:**

```bash
gh pr ready <pr>
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> \
  --field-id <STATUS_FIELD_ID> --single-select-option-id <Pending review option id>
```

**UI change:** keep the PR in Draft and the card in "In progress". Tell the user to
attach the screenshot/video to `### Results and Evidence` and then run
`/develop-issue --finish <pr>`, which only does: verify evidence is present in the
PR body → `gh pr ready` → Pending review → implementation comment.

**check-standards FAIL** that you could not fix → Blocked path (keep PR Draft).

Then post the **implementation comment** on the issue:

```markdown
## Implementation

**PR:** <url> (<ready for review | draft — waiting for UI evidence>)

**Changes**

- <what changed and why, per file/area>

**Tests:** <tests added/updated; command run and result>

**Notes:** <deviations from the analysis, risks, follow-ups, manual test hints> (omit if none)
```

For an internal issue, reference the PR only from the issue comment, never the
reverse. Request reviewers only if the user asks (`gh pr edit <pr> --add-reviewer …`).

### 9b. Watch CI and report

**Only when the PR was created and marked ready for review** (non-UI path, or
`--finish`). CI skips drafts. Skip for Draft PRs, the Blocked path and `--dry-run`.
The watch is read-only, so it needs no confirmation in any mode.

1. Start it as a **background** shell command (`run_in_background`, timeout 2 h);
   the session is re-invoked when it exits, so don't poll:

   ```bash
   sleep 30; gh pr checks <pr> --repo <target> --watch --interval 60
   ```

   If it reports "no checks reported", retry once after a short wait.

2. When it exits, collect results:

   ```bash
   gh pr checks <pr> --repo <target> --json name,state,bucket,link,workflow
   ```

3. For each check with `bucket` `fail`/`cancel`, take the run id from `link`
   (`…/actions/runs/<run-id>/job/…`) and summarize the error (job, step, first
   meaningful error line):

   ```bash
   gh run view <run-id> --repo <target> --log-failed | tail -n 50
   ```

4. Tell the user the result right away, as the first line of the message:
   - all passed → `✅ <repo>#<pr> CI passed (<n> checks)`
   - failures → `❌ <repo>#<pr> CI failed: <job> — <short error>` (`+N more`)
   - timeout / watch error → `⚠️ <repo>#<pr> CI still running or watch failed — <pr url>`
5. Include the result in the step 10 report. On failure, don't change the board
   status or auto-fix: report the errors and offer to investigate or fix them. A fix
   is a new push, so it follows the active mode.

### B. Blocked path (any step)

Triggers: missing information or a decision only maintainers can make; depends on
another unmerged issue/PR; failing checks or broken environment unrelated to the
change that you cannot fix; missing permissions; target repo cannot be determined.

1. Comment on the issue:

   ```markdown
   ## Blocked

   **Blocker:** <what stops the work>

   **What was done / tried:** <analysis so far, attempts, branch/PR if any>

   **Needed to unblock:** <decision, info, dependency #/URL, access>
   ```

   Mention people only if the user names them.

2. Status → **Blocked** (its option id from the project resolution).
3. If there are useful commits, push the branch (and keep/open the PR as Draft) and
   say so; otherwise leave the work local and report where it is.
4. Report to the user and stop.

In checkpoint mode, a blocker discovered **after** the "go" still needs a quick
confirmation before posting (it's a new decision); `--auto` posts directly.

### 10. Report to the user

```
Develop issue — <repo>#<n> <title>
- Mode: checkpoint | auto | confirm-each | dry-run
- Verdict: code change | no change needed | blocked (<reason>)
- Branch / base: <branch> → <base>
- PR: <url> — ready for review | draft (UI evidence pending) | none
- Board status: <final status>
- CI: passed | failed (<jobs + short error>) | running/timeout | skipped (draft/dry-run/blocked)
- Comments posted: analysis ✅/—, implementation ✅/—, blocked ✅/—
- Left for you: <evidence, reviewers, decisions>
```

End by reminding the developer to sign commits with `--signoff` and, for UI
changes, to add the screenshot before marking the PR ready.

## Guardrails

- Every outward action respects the chosen mode; `--dry-run` writes nothing.
- Never force-push, close issues, merge PRs, or move a card to "Done".
- The CI watch is read-only: never re-run jobs, push fixes, or change the status
  based on CI results without the active mode's confirmation.
- Never expose an internal issue link, or the internal repository's name, in a public
  repo (PR body, commit message, CHANGELOG, public comments).
- All commits DCO-signed; don't touch unrelated uncommitted changes.
- Temp files (comment bodies, PR body) go outside the repo (the session scratch
  directory or the system temp directory), never in the working tree.
- If GitHub returns an error on a status/assign mutation, report it — don't retry in
  a loop or guess other ids.
