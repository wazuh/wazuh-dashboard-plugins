# Troubleshooting and FAQ

## Troubleshooting

| Symptom                                                                          | Likely cause                                                                    | Action                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The active response is not listed in the trigger selector                        | The monitor is not _Per document_, or the active response is muted              | Recreate the monitor as _Per document_; unmute the active response from its details page |
| No execution record shows up in **Discover**                                     | The indexer notifications or alerting plugins are missing                       | Ask your administrator to verify the plugin installation                                 |
| The execution record is present but the action does not take effect on the agent | The manager did not deliver the command, or the agent is disconnected           | Check the manager service and the agent connection                                       |
| The target agent reports that the executable is missing                          | The executable is not available on that agent                                   | Ask your administrator to make it available on the target agent                          |
| A stateful active response does not revert after the timeout                     | Timeout too large, or the executable does not support reversal                  | Confirm the timeout value; ask your administrator to verify reversal support             |
| The `wazuh-active-responses*` index pattern is missing from Discover             | The dashboard did not create it on startup                                      | Ask your administrator to inspect the dashboard logs and restart                         |
| Execution records disappear after 3 days                                         | Expected — default retention                                                    | Ask your administrator to extend retention or export records to another index            |
| The active response runs on an unexpected agent                                  | `Location = All` with an overly broad monitor query, or an incorrect `Agent ID` | Narrow the monitor query; review the `Agent ID`                                          |

---

## FAQ

**How do I change the 3-day retention?**
Ask your administrator to adjust the retention policy on the indexer side.

**Why are there two separate buttons, _Add notification_ and _Add active response_?**
Because notifications and active responses have different lifecycles, permissions, and traceability. Each selector only lists entries of its own type.

**Can I chain multiple active responses in the same trigger?**
Yes. Each **Add active response** action runs independently and produces its own execution record in **Discover**.

**What happens if I change the _Executable_ of an active response that is already in use?**
The change applies to future executions only. Past executions keep the previous value in their records.

**The _Add active response_ button does not appear in my monitor — is this a bug?**
No. It is only shown when **Monitor type = Per document monitor**. Change the monitor type.

**How do I manually revert a stateful active response that should have expired but is still active?**
Ask your administrator to revert the action directly on the target agent — the dashboard cannot trigger a manual reversal.

---

## Related Sections

- [Detection](../security-analytics/detection.md) — Detection rules that produce the alerts consumed by active response triggers.
- [Normalization](../security-analytics/normalization.md) — Decoders and integrations that prepare the events upstream.
