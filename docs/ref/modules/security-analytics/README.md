# Security Analytics

**Security Analytics** is a core section of the Wazuh Dashboard that provides the tools required to manage the full lifecycle of log normalization and event-based detection. It brings together the configuration of integrations, decoders, key-value databases, and detection rules under a unified interface backed by the Wazuh Engine.

## Modules

- [Normalization](./normalization.md) — Manage integrations, decoders, and KVDBs. Includes the Log test tool for validating decoder output.
- [Detection](./detection.md) — Manage detection rules that generate alerts based on normalized events.

## Spaces

All content in Security Analytics is organized around three **spaces** that represent different stages of the content lifecycle:

| Space | Purpose |
|-------|---------|
| **Draft** | Authoring environment. Content is created and edited here but is not active in the engine. |
| **Test** | Validation environment. Content is loaded into the engine and can be tested with real or sample events. |
| **Custom** | Production environment. Content is active and applied to all incoming events processed by the engine. |

Content is promoted sequentially from Draft to Test, and from Test to Custom, after passing the required validation steps.
