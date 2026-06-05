# Migration guide: Wazuh dashboard 4.x to 5.x

Wazuh 5.0 does not provide an automatic upgrade path from 4.x. This guide describes all migration tasks that must be performed manually when moving the Wazuh dashboard from version 4.x to 5.x.

> **Important**: No automatic migration tooling is provided. Each section below must be completed manually and in the recommended order.

## Platform compatibility

| Component          | 4.x                       | 5.x                       |
| ------------------ | ------------------------- | ------------------------- |
| Dashboard platform | OpenSearch Dashboards 2.x | OpenSearch Dashboards 3.x |
| Indexer            | OpenSearch 2.x            | OpenSearch 3.x            |
| Manager            | Wazuh 4.x                 | Wazuh 5.x                 |

> All Wazuh stack components (indexer, manager, dashboard) must be upgraded to 5.x together. Mixed-version deployments are not supported.

## Overview of changes

The following areas of the Wazuh dashboard have changed significantly between 4.x and 5.x:

| Area                                            | 4.x                                                                               | 5.x                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plugin structure                                | `wazuh` + `wazuh-core` + `wazuh-check-updates` (split introduced in 4.x)          | `wazuh` (main) + `wazuh-core` + `wazuh-check-updates`                                                                                                                          |
| Plugin configuration file                       | `wazuh.yml`                                                                       | `opensearch_dashboards.yml`                                                                                                                                                    |
| Wazuh server host setting key                   | `hosts[].id`                                                                      | `wazuh_core.hosts.<name>`                                                                                                                                                      |
| Default index pattern                           | `wazuh-alerts-*`                                                                  | `wazuh-events-v5*`                                                                                                                                                             |
| Health check individual toggles (`checks.*`)    | Individual boolean settings per check                                             | Single `healthcheck.checks_enabled` regex/list                                                                                                                                 |
| Statistics indices (`wazuh-statistics-*`)       | Collected automatically via `cron.*` tasks                                        | Removed; data model replaced by `wazuh-metrics-comms` and `wazuh-metrics-normalization` indices                                                                                |
| Agent monitoring indices (`wazuh-monitoring-*`) | Collected automatically via `wazuh.monitoring.*`                                  | Removed; agent status queried on demand from API; per-agent metrics now available in `wazuh-metrics-agents`                                                                    |
| Custom report branding (logo, header, footer)   | Configurable via `customization.logo.reports`, `customization.reports.*`          | Removed; not available in 5.x                                                                                                                                                  |
| Custom dashboard and app branding               | `customization.*` in `wazuh.yml`                                                  | `opensearchDashboards.branding.*` in `opensearch_dashboards.yml`                                                                                                               |
| Index pattern selector                          | Configurable via `ip.selector` / `ip.ignore`                                      | Removed                                                                                                                                                                        |
| Custom dashboards and visualizations            | Saved objects in OpenSearch (custom objects only)                                 | Saved objects in OpenSearch — export and re-import custom objects only; default Wazuh objects are auto-provisioned                                                             |
| Plugin reporting feature                        | Built-in; PDFs stored at `<path.data>/wazuh/downloads/reports/<hashed_username>/` | **Deprecated**; replaced by the OpenSearch Dashboards Reporting plugin                                                                                                         |
| Multiple Wazuh manager APIs                     | Supported via UI API selector                                                     | One active manager by default; multiple `wazuh_core.hosts` entries require [Cross-Cluster Search](./multi-manager.md#option-d-cross-cluster-search-with-multiple-manager-apis) |
| Navigation — home                               | `/app/wazuh#/overview`                                                            | `/app/wz-home`                                                                                                                                                                 |
| Navigation — settings                           | `/app/wazuh#/settings`                                                            | **☰ Menu > Dashboard Management > Advanced Settings**                                                                                                                          |
| Navigation — health check                       | `/app/wazuh#/health-check`                                                        | **☰ Menu > Dashboard management > Health Check**                                                                                                                               |

## Migration topics

Follow each topic in order before starting the Wazuh 5.x installation:

1. [Configuration migration](./configuration.md) — Translate `wazuh.yml` settings to `opensearch_dashboards.yml`.
2. [Custom dashboards and visualizations](./dashboards.md) — Export and re-import saved objects.
3. [Reports](./reports.md) — Preserve existing PDF reports generated by the 4.x plugin.
4. [Multi-manager environments](./multi-manager.md) — Adapt environments previously configured with multiple Wazuh manager API connections.

## Before you begin

Complete the following steps before performing any migration task:

### Back up dashboard files

Create a dated backup directory and copy the 4.x dashboard files into it. Run the following commands **on the 4.x dashboard server**:

```bash
BACKUP_DIR=~/wazuh-migration-backup-$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"

sudo cp -r /usr/share/wazuh-dashboard/data/wazuh/ \
   "$BACKUP_DIR/wazuh/"

sudo cp /etc/wazuh-dashboard/opensearch_dashboards.yml \
   "$BACKUP_DIR/opensearch_dashboards.yml"
```

This copies the plugin configuration (`wazuh/config/wazuh.yml`) and generated PDF reports (`wazuh/downloads/reports/`). Both are located under the `path.data` directory defined in `opensearch_dashboards.yml` (default: `/usr/share/wazuh-dashboard/data`).

> **Note**: The `wazuh/downloads/reports/` directory is owned by the `wazuh-dashboard` system user. Run the command with `sudo` or as a user with sufficient permissions to read the directory.

See [Reports](./reports.md) for details on what can and cannot be migrated.

### Export custom saved objects

Export only the dashboards and visualizations you created or modified. Default Wazuh objects are re-provisioned automatically in 5.x and must not be re-imported.

1. In the Wazuh dashboard, navigate to **☰ Menu > Dashboard Management > Saved objects**.
2. Select the checkboxes next to each custom dashboard or visualization and click **Export**.
3. Enable **Include related objects** and save the resulting `.ndjson` file to a secure location.

If you export all objects as a fallback, use the **Check for existing objects** conflict strategy when importing into 5.x. See [Custom dashboards and visualizations](./dashboards.md) for details.

Alternatively, use the API. Run the following command from **any machine with network access to the 4.x dashboard**, replacing `<DASHBOARD_HOST>` with the 4.x dashboard hostname or IP, `<DASHBOARD_PORT>` with the dashboard port (default: `5601`), and `<PASSWORD>` with the admin password. The output file is saved in the current working directory:

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_export" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -u admin:<PASSWORD> \
  -k \
  -d '{"type": ["dashboard", "visualization", "search", "index-pattern"], "includeReferencesDeep": true}' \
  -o saved-objects-backup-$(date +%Y%m%d).ndjson
```
