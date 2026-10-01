# Glossary

- **Wazuh dashboard**: Web UI built on OpenSearch Dashboards for exploring Wazuh data.
- **Wazuh indexer**: OpenSearch-based storage and search engine for Wazuh events.
- **Wazuh manager**: Core Wazuh server that processes events and exposes the API.
- **Wazuh agent**: Endpoint component that collects and forwards security data.
- **Saved object**: Dashboard artifacts such as visualizations, dashboards, and index patterns.
- **Index pattern**: A pattern that groups indices for searching and visualization.
- **Tenant**: A logical space for saved objects and permissions in OpenSearch Dashboards.
- **Health check**: Built-in verification tasks that validate configuration and integrations.
- **Notifications channel**: Destination configuration for alerting (Slack, PagerDuty, etc).
- **Event**: A normalized, raw telemetry record from an agent, stored in `wazuh-events-v5-*`,
  whether or not it matched a detection rule.
- **Finding**: An event that matched a detection rule, stored in `wazuh-findings-v5-*`. The 5.x
  equivalent of a 4.x "alert".
- **Data stream**: An OpenSearch abstraction for append-only, time-series indices (used by the
  `wazuh-events-v5-*`/`wazuh-findings-v5-*`/`wazuh-metrics-*` families).
- **Active response**: An automated remediation action (for example blocking an IP) that a Wazuh
  manager runs on an agent when an Alerting trigger fires. See
  [Active Response](modules/active-response/README.md).
- **Enrollment token**: The credential a 5.x agent presents to register with a manager, replacing
  the 4.x registration password/variables. See
  [Enrollment Tokens](modules/enrollment-tokens/README.md).
- **RBAC**: Role-based access control — the indexer's and the manager's own permission systems,
  which the dashboard enforces by running user-facing queries as the logged-in user
  (`asCurrentUser`). Background tasks are the exception: the Health Check and the update check
  (`wazuh-check-updates`) run as the internal user (`asInternalUser`).
- **CTI**: Cyber Threat Intelligence — the Wazuh-curated threat-intelligence content (indicators,
  rules, decoders) distributed to the indexer's content manager.
