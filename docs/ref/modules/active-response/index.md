# Active Response

The **Active Response** module automates remediation actions on Wazuh agents when an alert meets a condition. Typical use cases include blocking an offending IP, isolating a compromised host, killing a suspicious process, or running a custom containment action.

The feature is fully integrated with the Wazuh Dashboard: each active response is defined from the **Active Responses** view (under **Explore**), invoked from an **Alerting** monitor trigger, and audited from **Discover**.

This module exposes the following views:

- **Active responses** — Lists the active responses available, with filters by status, location, and type.
- **Create / Edit active response** — Form used to define an active response (executable, type, location, timeout).
- **Active response details** — Per-entry view that shows the configuration in read-only mode, the current status (`Active` / `Muted`), a **Mute active response** / **Unmute active response** button, and an **Actions** menu with **Edit** and **Delete**.
- **Alerting integration** — The **Add active response** action inside a Per document monitor trigger.

## How it fits together

Active Response combines three areas of the Wazuh Dashboard:

| Area                      | Role in Active Response                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Responses view** | Manage active responses from the Wazuh Dashboard (under **Explore → Active Responses**). Each entry defines the executable, type, timeout, and target location of a remediation. |
| **Alerting**              | Per document monitors expose an **Add active response** action that invokes one when the trigger condition is met.                                                               |
| **Discover**              | The `wazuh-active-responses*` index pattern keeps an auditable record of every execution, retained for 3 days by default.                                                        |

An active response never runs on its own: it must be attached to a Per document monitor trigger. When the trigger fires, an execution record is stored in **Discover**, the manager picks it up within about one minute, and the target agent carries out the action.

## Use cases

- [Create an active response](./create.md) — Define an executable, type, timeout, and target location from the Active Responses view.
- [Attach to an Alerting trigger](./alerting-integration.md) — Connect an active response to a Per document monitor.
- [Monitor executions](./monitor-executions.md) — Audit fired actions from Discover and on the agent.
- [Troubleshooting](./troubleshooting.md) — Common symptoms and FAQ.

---

## Concepts

### Active responses

An **active response** is an entry in the Active Responses view that describes a remediation: **what** to run, **how** to run it, and **where**. It is kept strictly separate from generic notifications (Slack, Email, Webhook): Alerting triggers expose two distinct selectors — one for notifications and one for active responses — and an entry never crosses over.

Each active response has the following fields:

| Field                | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Name**             | Visible identifier. Required, must not be empty.                                       |
| **Description**      | Free-form description. Optional.                                                       |
| **Executable**       | Name or path of the executable to run on the target agent. Required.                   |
| **Extra arguments**  | Free-form string passed to the executable. Optional.                                   |
| **Type**             | `Stateless` (run once) or `Stateful` (run and revert after a timeout).                 |
| **Stateful timeout** | Integer in seconds. Only applies when `Type = Stateful`. Must be `> 0`. Default `180`. |
| **Location**         | `All`, `Defined agent`, or `Local`. Default `Local`.                                   |
| **Agent ID**         | Numeric agent identifier. Only applies when `Location = Defined agent`.                |

### Stateful vs stateless

A **stateless** active response runs the action once and does not revert anything. A **stateful** active response runs the action, waits `Stateful timeout` seconds, and then asks the agent to **revert** it (for example, unblocking an IP that had been blocked).

| Mode          | When to use it                                                              | Main risk                                                                  |
| ------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Stateless** | Definitive or idempotent actions (kill process, notify, restart).           | If fired on a false positive, there is no automatic reversal.              |
| **Stateful**  | Temporary enforcement with automatic reversal (block an IP for 10 minutes). | Works only if the action itself supports reversal; ask your administrator. |

> **Important:** `Stateful timeout` is expressed in **seconds**. Ask your administrator to verify, in a non-production environment, that the chosen executable can be both applied and reverted before enabling it in production.

### Location and targeting

The **Location** field controls where the command is executed:

- **All** — Every agent in the environment must run the script. Use this option with caution. Incorrect configuration can cause problems in your environment.
- **Defined agent** — The command is always executed on the agent whose numeric ID is set in the **Agent ID** field.
- **Local** — The command is executed on the agent that generated the event.

### About the executable

The Active Responses view only references the executable by name; the executable itself is managed on the agent side, outside the dashboard. If you are not sure whether a given executable is available on the target agent, check with your administrator before using it in production.

### Alerting integration

An active response does not run on its own. It is invoked from a **trigger** inside an Alerting monitor. The monitor type **must** be _Per document_; no other monitor type exposes the **Add active response** button.

When the trigger fires, the active response action does the following:

1. A record of the execution is written to the `wazuh-active-responses*` index, which you can inspect from **Discover**.
2. The manager picks it up within about one minute and forwards the command to the target agent.
3. The target agent carries out the action.

Execution records are retained for **3 days** by default. For longer forensic retention, ask your administrator to adjust the retention policy or export the records to another index.
