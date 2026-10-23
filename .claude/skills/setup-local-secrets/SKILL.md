---
name: setup-local-secrets
description: Create or update the local env file with the WZSS_* values that other skills reuse (first set the ids of the Dashboard team project board), so they don't have to look them up on every run. Use when a skill needs those values and the file is missing, when the board changed, or when the user asks to store a local secret or sensitive value.
---

# Set up the local WZSS\_\* values

Keeps values that are specific to one machine or user (board ids today, secrets
later) in **one local env file**, outside every repository. Other skills may read
it **optionally** and fall back to their own lookup when it is missing. This skill
has no scripts: Claude follows the steps below.

## 1. The file

- Path: `${WZSS_FILE:-$HOME/.config/wzss/secrets.env}`. Never inside a repository.
- Directory mode `700`, file mode `600`. If the file already exists with a looser
  mode, run `chmod 600` on it and tell the user.
- Format, one line per value: `export WZSS_<NAME>='<value>'` (single quotes; a value
  containing a single quote is written as `'\''`). Lines starting with `#` are comments.

## 2. Setup flow

1. Create the directory and the file with `umask 077` (`mkdir -p`, then `chmod 700`
   on the directory).
2. Discover the Dashboard team board values with `gh` (needs the `project` scope):

   ```bash
   # The project whose title mentions "Dashboard team" (several or none → ask the user)
   gh project list --owner wazuh --limit 200 --format json \
     -q '.projects[] | select(.title | test("Dashboard team")) | {number, id, title}'
   # Its fields: "Status" (with its options) and "Start date"
   gh project field-list <number> --owner wazuh --format json \
     -q '.fields[] | select(.name=="Status" or .name=="Start date") | {id, name, options}'
   ```

   A transient 5xx/timeout from GitHub → wait a few seconds and retry up to twice. A
   missing project, field or Status option, or more than one matching project → stop and
   ask the user; never guess ids.

3. Show the user the variable **names** that will be written (not the values) and
   whether each one is new or replaces an existing line.
4. Write the file: build the new content in a temporary file in the same directory
   (created under `umask 077`), keep every existing `WZSS_*` line that was not
   rediscovered, then `mv` it over the target. Check the final modes.
5. Report the names written and the file path. Never print the values.

Re-run the flow whenever the board changes (a renamed option, a new field, another
project). It only rewrites the rediscovered names.

## 3. Variables

All the variables of the Dashboard team board have `DASHBOARD_PROJECT` in their name.

| Variable                                                | Meaning                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `WZSS_DASHBOARD_PROJECT_ORG`                            | GitHub organization that owns the project (`wazuh`)       |
| `WZSS_DASHBOARD_PROJECT_NUMBER`                         | Project number, as used by `gh project …`                 |
| `WZSS_DASHBOARD_PROJECT_ID`                             | Project node id (`PVT_…`), used by `gh project item-edit` |
| `WZSS_DASHBOARD_PROJECT_STATUS_FIELD_ID`                | Id of the single-select field "Status"                    |
| `WZSS_DASHBOARD_PROJECT_STARTDATE_FIELD_ID`             | Id of the date field "Start date"                         |
| `WZSS_DASHBOARD_PROJECT_STATUS_TRIAGE_ID`               | Option id of Status "Triage"                              |
| `WZSS_DASHBOARD_PROJECT_STATUS_BACKLOG_ID`              | Option id of Status "Backlog"                             |
| `WZSS_DASHBOARD_PROJECT_STATUS_IN_PROGRESS_ID`          | Option id of Status "In progress"                         |
| `WZSS_DASHBOARD_PROJECT_STATUS_ON_HOLD_ID`              | Option id of Status "On hold"                             |
| `WZSS_DASHBOARD_PROJECT_STATUS_BLOCKED_ID`              | Option id of Status "Blocked"                             |
| `WZSS_DASHBOARD_PROJECT_STATUS_PENDING_REVIEW_ID`       | Option id of Status "Pending review"                      |
| `WZSS_DASHBOARD_PROJECT_STATUS_IN_REVIEW_ID`            | Option id of Status "In review"                           |
| `WZSS_DASHBOARD_PROJECT_STATUS_PENDING_FINAL_REVIEW_ID` | Option id of Status "Pending final review"                |
| `WZSS_DASHBOARD_PROJECT_STATUS_IN_FINAL_REVIEW_ID`      | Option id of Status "In final review"                     |
| `WZSS_DASHBOARD_PROJECT_STATUS_DONE_ID`                 | Option id of Status "Done"                                |

A Status option name becomes `<NAME>` in upper case with spaces replaced by `_`.
Values that don't belong to the board use their own `WZSS_<AREA>_…` prefix. To add
one, add a row here and describe how it is obtained.

## 4. Adding a secret

Never take a secret as a command-line argument or echo it: it would end up in the
transcript and the shell history. Ask the user to add it themselves, either by editing
the file or with the `!` prefix in the prompt, for example
`! read -rs v && printf "export WZSS_<NAME>='%s'\n" "$v" >> "${WZSS_FILE:-$HOME/.config/wzss/secrets.env}"`.
Then add its name and meaning to the table above.

## 5. How other skills use the file (optional)

Read it only if it exists and has mode `600`, in the **same shell command** that needs
the values (shell state does not persist between calls), with tracing off:

```bash
f="${WZSS_FILE:-$HOME/.config/wzss/secrets.env}"
[ "$(stat -c %a "$f" 2>/dev/null)" = 600 ] && { set +x; . "$f"; }
[ -n "${WZSS_DASHBOARD_PROJECT_ID:-}" ] || echo "not set: resolve it another way"
```

Use the variables, and when the file or a variable is missing, fall back to the skill's
own lookup (or offer to run this skill). Never print the values.

## 6. Safety rules

- Never put `WZSS_*` values in issues, PRs, commits, the CHANGELOG, comments or chat
  output. To check the file, list the variable **names** and whether each is set.
- Never write the file, or a copy of it, inside a repository.
- Don't change the mode of other files; only the file and directory above.
