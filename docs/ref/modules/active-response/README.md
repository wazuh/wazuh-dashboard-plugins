# Active Response

**Active Response** is the Wazuh Dashboard capability that automates remediation actions on agents when an alert meets a condition — for example, blocking an IP address, isolating a host, killing a process, or running a custom containment action. Active responses are defined, triggered, and audited entirely from the dashboard.

## Modules

- [Active Response](./active-response.md) — Create and manage active responses, attach them to Alerting monitors, and review their executions.

## How it fits together

Active Response combines three areas of the Wazuh Dashboard:

| Area                     | Role in Active Response                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Active Responses view** | Manage active responses from the Wazuh Dashboard (under **Explore → Active Responses**). Each entry defines the executable, type, timeout, and target location of a remediation. |
| **Alerting**             | Per document monitors expose an **Add active response** action that invokes one when the trigger condition is met.           |
| **Discover**             | The `wazuh-active-responses-*` index pattern keeps an auditable record of every execution, retained for 3 days by default.  |

An active response never runs on its own: it must be attached to a Per document monitor trigger. When the trigger fires, an execution record is stored in **Discover**, the manager picks it up within about one minute, and the target agent carries out the action.
