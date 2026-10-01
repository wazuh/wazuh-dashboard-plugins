# Compatibility

## Supported operating systems

Even though we aim to support as many operating systems as [OpenSearch Dashboards](https://docs.opensearch.org/3.6/install-and-configure/install-dashboards/index/) does and Wazuh dashboard should work on many Linux distributions, we only test a handful of Linux distributions. The following table lists the operating system versions that we currently support.

We support the operating system versions and architectures included in the table below.

| Name         | Version      | Architecture    |
| ------------ | ------------ | --------------- |
| Red Hat      | 9, 10        | x86_64, aarch64 |
| Ubuntu       | 22.04, 24.04 | x86_64, aarch64 |
| Amazon Linux | 2023         | x86_64, aarch64 |

For the hardware requirements, see [Requirements](getting-started/requirements.md#hardware-requirements).

## Version compatibility

| Wazuh dashboard | OpenSearch Dashboards | Wazuh indexer (OpenSearch) | Wazuh manager                     |
| --------------- | --------------------- | -------------------------- | --------------------------------- |
| 4.3.x           | 1.2.0                 | 1.x                        | 4.3.x                             |
| 4.4.x – 4.14.x  | 2.x                   | 2.x                        | 4.y.x (same 4.y as the dashboard) |
| 5.0.x           | 3.6.0                 | 3.6.0                      | 5.0.x                             |

- The OpenSearch Dashboards version is the `pluginPlatform.version` value in
  `plugins/wazuh-core/package.json`.
- The indexer version is the `opensearch` value in `buildSrc/version.properties` at the
  `wazuh-indexer` repository.
- The Wazuh dashboard and the Wazuh manager must run the same major.minor version: the
  `server-api:connection-compatibility` health check fails otherwise (for example, a 5.0 dashboard
  against a 5.1 manager).
- The Wazuh indexer must run the same major version as OpenSearch Dashboards, and the same or a
  later minor version: OpenSearch Dashboards reports the indexer nodes as incompatible otherwise.
- Wazuh 4.0–4.2 had no Wazuh dashboard: the Wazuh app ran as a Kibana plugin. Wazuh 4.3 shipped
  both the Kibana app and the first Wazuh dashboard (OpenSearch Dashboards 1.2.0).
- Mixed-version deployments are not supported. A 4.x deployment cannot be upgraded in place: see
  the [migration guide](../guide/migration/README.md).
