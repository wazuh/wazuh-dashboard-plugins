# Monitor active response executions

Every time an active response fires, the **Discover** view (under the `wazuh-active-responses*` index pattern) is the authoritative trace: it records every invocation issued by the dashboard and forwarded by the manager. On the target agent, additional traces may be available depending on the script:

- **Lifecycle events** — the agent service logs receipt and dispatch of the command in `/var/ossec/logs/ossec.log`.
- **Script output** — if the executable writes to `/var/ossec/logs/active-responses.log` (most built-in scripts do), you will also see a per-execution line there. Custom scripts decide their own logging destination, so absence from this file is not by itself an error.

---

## Step 1: Inspect the execution record in Discover

Open **Discover** and select the `wazuh-active-responses*` index pattern from the index selector. Before any trigger has fired, the view is empty — that is expected.

![Discover - Active response index pattern selected](images/16-discover-ar-documents.png)

When a monitor trigger fires an active response, a new document appears here within about a minute. Click the caret on the left of a row to open the **Expanded document** panel and inspect the full record. The panel lists every `wazuh.active_response.*` field, so you can confirm exactly what was executed, where, and against which agent.

![Discover - Expanded active response document](images/18-discover-ar-document-expanded.png)

The most useful fields for investigation are:

| Field                                    | Content                                                         |
| ---------------------------------------- | --------------------------------------------------------------- |
| `@timestamp`                             | Time the execution was recorded.                                |
| `wazuh.active_response.name`             | Active response name.                                           |
| `wazuh.active_response.type`             | `stateful` or `stateless`.                                      |
| `wazuh.active_response.executable`       | Executable that was run.                                        |
| `wazuh.active_response.extra_arguments`  | Extra arguments passed to the executable.                       |
| `wazuh.active_response.stateful_timeout` | Timeout in seconds (stateful active responses only).            |
| `wazuh.active_response.location`         | `all`, `defined-agent`, or `local`.                             |
| `wazuh.active_response.agent_id`         | Target agent ID (only when `location = defined-agent`).         |
| `wazuh.agent.id`, `.name`                | Agent that reported the original alert.                         |
| `event.doc_id`, `event.index`            | Original alert that triggered the action (useful for pivoting). |

> **Tip:** to narrow the list to a specific active response, filter by `wazuh.active_response.name: "<your-name>"` and sort by `@timestamp` descending.

---

## Step 2: Verify execution on the agent

On the target agent, two log files are useful, each for a different purpose:

```bash
# Agent service lifecycle (receipt and dispatch of the command)
sudo tail -f /var/ossec/logs/ossec.log

# Script output (only when the executable writes here)
sudo tail -f /var/ossec/logs/active-responses.log
```

`ossec.log` is the reliable source for confirming the agent received and dispatched the command — this is part of the active response lifecycle and does not depend on the script. `active-responses.log` is populated by the executable itself: most built-in scripts write a line with the timestamp and arguments received, but custom scripts may log elsewhere or not at all. Correlate any timestamp you find with `@timestamp` in Discover (expect a delay of up to ~1 minute).

---

## Step 3: Pivot to the source alert

From any execution record, `event.doc_id` and `event.index` point back to the alert that fired the action. Switch the Discover index pattern to the value of `event.index` and filter by `_id == event.doc_id` to open the original alert. This closes the loop between **detection → activation → execution**.

> **Note:** execution records are retained for **3 days** by default. If you need longer forensic retention, ask your administrator to adjust the retention policy or export the records to another index.
