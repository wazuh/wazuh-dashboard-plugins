# Security Analytics

**Security Analytics** is a core section of the Wazuh Dashboard that provides the tools required to manage the full lifecycle of log normalization and event-based detection. It brings together the configuration of integrations, decoders, key-value databases, and detection rules under a unified interface backed by the Wazuh Engine.

## Modules

- [Normalization](./normalization.md) — Manage integrations, decoders, and KVDBs. Includes the Log test tool for validating decoder output.
- [Detection](./detection.md) — Manage detection rules that generate alerts based on normalized events.

## Spaces

Security Analytics organizes content across four **spaces**. Three of them — Draft, Test, and Custom — are user-managed and represent the stages of the content lifecycle. The fourth, Standard, is read-only and contains the built-in content shipped with Wazuh.

| Space | Managed by | Purpose |
|-------|-----------|---------|
| **Draft** | User | Authoring environment. Integrations, decoders, rules, and KVDBs are created and edited here. Content is not active in the engine. |
| **Test** | User | Validation environment. Content is loaded into the engine and can be tested with real or sample events. |
| **Custom** | User | Production environment. Content is active and applied to all incoming events processed by the engine. |
| **Standard** | Wazuh | Read-only space containing the built-in integrations, decoders, and rules shipped with Wazuh. Cannot be modified by the user. |

User-managed content is promoted sequentially from Draft to Test, and from Test to Custom, after passing the required validation steps.
