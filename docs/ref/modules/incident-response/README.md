# Incident Response

The **Incident Response** module gives a single place to review the active response actions that
run across the environment. An active response is an automated action on a Wazuh agent, for
example blocking an IP address or isolating a host. The module shows how many actions ran, on which
agents, and of which type, and lets an analyst open each action to see its details and its source
finding.

The module reads the active response records from the `wazuh-active-responses*` indices. It does
not define or trigger the actions. You define the active responses in the
[Active Response](../active-response/index.md) feature and attach them to a trigger. When
a trigger fires an action, a record is written to the `wazuh-active-responses*` indices, and the
record appears in this module.

The module appears in the left navigation as **Incident Response**, in the **Security Operations**
category.

This module exposes the following views:

- **Dashboard**: Visualizations that summarize the active response actions (counts over time, by
  agent, by type, and by result).
- **Responses**: A table of the individual action records. Select a row to open the details. The
  details flyout has a **Source finding** tab that shows the finding that triggered the action.

## How it fits together

Incident Response reads the active response records. Two related features produce and define those
records.

| Area                        | Role in Incident Response                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active response records** | The source data. The module reads the `wazuh-active-responses*` indices. Each record describes one action that ran on an agent.                                                        |
| **Active Response**         | Defines the actions and attaches them to a trigger. See the [Active Response](../active-response/index.md) module for how to create and run an action.                                 |
| **Findings**                | Each action record keeps a reference to the finding that triggered it (the `event.doc_id` field). The **Source finding** tab reads that finding from the `wazuh-findings-v5*` indices. |

## Reference

- [Active Response](../active-response/index.md): How to define an active response, attach it to a trigger, and audit the executions on the agent.
- [Case Management](../case-management/README.md): The manual triage of a finding. Use Case
  Management to record the analysis of a finding, and use Incident Response to review the automated
  actions that the finding triggered.

---

## Concepts

### Active response records

An **active response record** is one entry in the `wazuh-active-responses*` indices. It describes a
single action that ran on an agent. The **Responses** view lists the records, and the **Dashboard**
view summarizes them.

The records are read-only in this module. To change which actions run, edit the active response
definition and its trigger in the [Active Response](../active-response/index.md) feature.

### Source finding

An active response does not run on its own. A trigger fires it when an event meets a
condition. The record of the action keeps the identifier of that event in the `event.doc_id`
field.

The **Source finding** tab in the details flyout uses `event.doc_id` to find the original finding
in the `wazuh-findings-v5*` indices, and then shows the finding fields. If the finding is no longer
available (for example, the index has passed its retention period), the tab shows the message
`Missing source finding`.

### Relationship with Case Management

Incident Response and [Case Management](../case-management/README.md) cover two sides of the same
finding.

- **Case Management** is the manual side. An analyst turns a finding into a case, sets its status
  and severity, and records the triage with comments.
- **Incident Response** is the automated side. It shows the active response actions that a finding
  triggered through a trigger.

Both features start from a finding. Use the **Source finding** tab in Incident Response to open the
finding that an action responded to, and use the **Case** tab on that same finding to record or
review its case.

## Review the active response actions

1. Open **Incident Response** from the **Security Operations** category.
2. Review the **Dashboard** view for the counts and the trend of the actions.
3. Open the **Responses** view to see the individual action records. Adjust the time range to focus
   on a period.
4. Select a row to open the details flyout.
5. Open the **Source finding** tab to see the finding that triggered the action.
