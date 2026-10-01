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

| Wazuh dashboard | OpenSearch Dashboards | Wazuh indexer (OpenSearch) | Wazuh manager |
| --------------- | --------------------- | -------------------------- | ------------- |
| 4.x             | 2.x                   | 2.x                        | 4.x           |
| 5.0.x           | 3.6.0                 | 3.6.0                      | 5.x           |

- The OpenSearch Dashboards version is the `pluginPlatform.version` value in
  `plugins/wazuh-core/package.json`.
- The indexer version is the `opensearch` value in `buildSrc/version.properties` at the
  `wazuh-indexer` repository.
- All Wazuh stack components (indexer, manager, dashboard) must run the same major version.
  Mixed-version deployments are not supported. A 4.x deployment cannot be upgraded in place: see
  the [migration guide](../guide/migration/README.md).
