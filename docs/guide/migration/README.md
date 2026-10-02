# Migration guide: Wazuh dashboard 4.x to 5.x

Wazuh 5.0 does not provide an automatic upgrade path from 4.x. This guide describes all migration tasks that must be performed manually when moving the Wazuh dashboard from version 4.x to 5.x.

> **Important**: No automatic migration tooling is provided. Each section below must be completed manually and in the recommended order.

## Platform compatibility

All Wazuh stack components (indexer, manager, dashboard) must be upgraded to 5.x together. The dashboard and the manager must run the same major.minor version (5.0.x). Mixed-version deployments are not supported. See the [Compatibility](../../ref/compatibility.md#version-compatibility) matrix for the platform versions of each release, and [Requirements](../../ref/getting-started/requirements.md) for the 5.x system requirements. TLS certificates must be valid for OpenSearch 3.x.

For the full list of changes, see the [Release notes](../../ref/release-notes.md#breaking-changes) and the `CHANGELOG.md` file at the repository root: note the removed settings, renamed configuration keys, removed features you may be using, and new required configuration.

## Overview of changes

The following areas of the Wazuh dashboard have changed significantly between 4.x and 5.x:

| Area                                            | 4.x                                                                               | 5.x                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plugin structure                                | `wazuh` + `wazuh-core` + `wazuh-check-updates` (split introduced in 4.x)          | `wazuh` (main) + `wazuh-core` + `wazuh-check-updates` + `wazuh-ai-assistant`                                                                                                   |
| Plugin configuration file                       | `wazuh.yml`                                                                       | `opensearch_dashboards.yml`                                                                                                                                                    |
| Wazuh server host setting key                   | `hosts[].<name>` (the host name is the YAML key, not an `id` field)               | `wazuh_core.hosts.<name>`                                                                                                                                                      |
| Default index pattern                           | `wazuh-alerts-*`                                                                  | `wazuh-events-v5*`                                                                                                                                                             |
| Health check individual toggles (`checks.*`)    | Individual boolean settings per check                                             | Single `healthcheck.checks_enabled` regex/list                                                                                                                                 |
| Statistics indices (`wazuh-statistics-*`)       | Collected automatically via `cron.*` tasks                                        | Removed; data model replaced by `wazuh-metrics-comms-v4` and `wazuh-metrics-normalization` indices                                                                             |
| Agent monitoring indices (`wazuh-monitoring-*`) | Collected automatically via `wazuh.monitoring.*`                                  | Removed; agent status queried on demand from API; per-agent metrics now available in `wazuh-metrics-agents`                                                                    |
| Custom report branding (logo, header, footer)   | Configurable via `customization.logo.reports`, `customization.reports.*`          | Removed; not available in 5.x                                                                                                                                                  |
| Custom dashboard and app branding               | `customization.*` in `wazuh.yml`                                                  | `opensearchDashboards.branding.*` in `opensearch_dashboards.yml`                                                                                                               |
| Index pattern selector                          | Configurable via `ip.selector` / `ip.ignore`                                      | Removed                                                                                                                                                                        |
| Custom dashboards and visualizations            | Saved objects in OpenSearch (custom objects only)                                 | Saved objects in OpenSearch — export and re-import custom objects only; default Wazuh objects are auto-provisioned                                                             |
| Plugin reporting feature                        | Built-in; PDFs stored at `<path.data>/wazuh/downloads/reports/<hashed_username>/` | **Deprecated**; replaced by the OpenSearch Dashboards Reporting plugin                                                                                                         |
| Multiple Wazuh manager APIs                     | Supported via UI API selector                                                     | One active manager by default; multiple `wazuh_core.hosts` entries require [Cross-Cluster Search](./multi-manager.md#option-d-cross-cluster-search-with-multiple-manager-apis) |
| Navigation — home                               | `/app/wazuh#/overview`                                                            | `/app/wz-home`                                                                                                                                                                 |
| Navigation — settings                           | `/app/wazuh#/settings`                                                            | **☰ Menu > Dashboard management > Dashboards Management > Advanced settings**                                                                                                  |
| Navigation — health check                       | `/app/wazuh#/health-check`                                                        | **☰ Menu > Dashboard management > Health Check**                                                                                                                               |
| Update check API route                          | `/api/wazuh-check-updates/updates`                                                | Unchanged: `/api/wazuh-check-updates/updates`                                                                                                                                  |

## Migration topics

Follow each topic in order. The first two require the 4.x dashboard to still be reachable, so
complete them **before** decommissioning it; the rest apply once the 5.x dashboard is installed:

1. [Reports](./reports.md) — Preserve existing PDF reports generated by the 4.x plugin while it is still accessible.
2. [Custom dashboards and visualizations](./dashboards.md) — Export saved objects from the 4.x dashboard, then re-import them once 5.x is installed.
3. [Configuration migration](./configuration.md) — Translate `wazuh.yml` settings to `opensearch_dashboards.yml` on the new 5.x installation.
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

sudo cp -a /etc/wazuh-dashboard/certs/ "$BACKUP_DIR/certs/"

# List the custom settings of opensearch_dashboards.yml (non-comment, non-empty lines)
sudo grep -v "^#" /etc/wazuh-dashboard/opensearch_dashboards.yml | grep -v "^$" \
  > "$BACKUP_DIR/custom-settings.txt"
```

This copies the plugin configuration (`wazuh/config/wazuh.yml`) and the generated PDF reports (`wazuh/downloads/reports/`), both located under the `path.data` directory defined in `opensearch_dashboards.yml` (default: `/usr/share/wazuh-dashboard/data`). It also copies `opensearch_dashboards.yml` and the dashboard TLS certificates from `/etc/wazuh-dashboard/`, and saves the custom settings of `opensearch_dashboards.yml` to `custom-settings.txt`.

> **Note**: The `wazuh/downloads/reports/` directory is owned by the `wazuh-dashboard` system user. Run the command with `sudo` or as a user with sufficient permissions to read the directory.

See [Reports](./reports.md) for details on what can and cannot be migrated.

### Export custom saved objects

Export only the dashboards and visualizations you created or modified. Default Wazuh objects are re-provisioned automatically in 5.x and must not be re-imported.

1. In the Wazuh dashboard, navigate to **☰ Menu > Dashboard management > Dashboards Management > Saved objects**.
2. Select the checkboxes next to each custom dashboard, visualization and saved search, and next to each custom index pattern they use. Do not select the 4.x default Wazuh index patterns (`wazuh-alerts-*`, `wazuh-monitoring-*`, `wazuh-statistics-*` and the `wazuh-states-*-*` patterns): 5.x replaces them (see [Resolve index pattern conflicts](./dashboards.md#step-4-resolve-index-pattern-conflicts)).
3. Click **Export**, disable **Include related objects** (it would add the referenced 4.x default index patterns back), and save the resulting `.ndjson` file to a secure location.

If you export all objects as a fallback, remove the 4.x default Wazuh index patterns from the file with the `jq` command below, and use the **Check for existing objects** conflict strategy when importing into 5.x. See [Custom dashboards and visualizations](./dashboards.md) for details.

Alternatively, use the API. Run the following command from **any machine with network access to the 4.x dashboard**, replacing `<DASHBOARD_HOST>` with the 4.x dashboard hostname or IP, `<DASHBOARD_PORT>` with the dashboard port, and `<PASSWORD>` with the admin password. The output file is saved in the current working directory:

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_export" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -u admin:<PASSWORD> \
  -k \
  -d '{"type": ["dashboard", "visualization", "search", "index-pattern"], "includeReferencesDeep": false}' \
  -o saved-objects-export.ndjson

# Drop the 4.x default Wazuh index patterns, keep the custom ones
jq -c 'select(.type != "index-pattern" or (.attributes.title | test("^wazuh-(alerts|monitoring|statistics|states-.+)-\\*$") | not))' \
  saved-objects-export.ndjson > saved-objects-backup-$(date +%Y%m%d).ndjson
```

## After the migration: validate the 5.x deployment

Keep the 4.x deployment running until these checks pass. There is no package downgrade or rollback: if 5.x needs to be abandoned, keep using the 4.x deployment and remove the 5.x installation.

### Dashboard functionality

- The dashboard loads at `/app/wz-home`.
- The Wazuh logo and branding appear correctly.
- The navigation menu displays all modules.
- The agents list loads.
- Events are displayed in Threat Hunting.

### Health check

Navigate to **☰ Menu > Dashboard management > Health Check** and verify that the registered checks pass:

- `server-api:connection-compatibility`
- `server-api:run-as`
- `server-api:certificate-validity`
- `saved-objects:dashboards`
- `saved-objects:index-patterns`
- `integrations:default-notifications-channels` (when the Notifications plugin is available)

### Server API connection

Run the following commands from the dashboard server, with `WAZUH_MANAGER_WUI_PASSWORD` set to the password of the `wazuh-wui` account:

```bash
TOKEN=$(curl -sk -u wazuh-wui:$WAZUH_MANAGER_WUI_PASSWORD -X POST "https://localhost:55000/security/user/authenticate?raw=true")
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:55000/
```

Expected response:

```json
{
  "data": {
    "title": "Wazuh API REST",
    "api_version": "5.0.0",
    "revision": "rc1",
    "license_name": "GPL 2.0",
    "license_url": "<LICENSE_URL>",
    "hostname": "wazuh-manager",
    "timestamp": "2026-02-24T10:00:00Z"
  }
}
```

If the authentication request returns an error instead of a token, the `wazuh-wui` credentials are wrong: make sure the password matches the one of the `wazuh-wui` account on the Server API, and see [Credentials](../../ref/getting-started/credentials.md) for where the dashboard reads it from.

### Index patterns

Navigate to **☰ Menu > Dashboard management > Dashboards Management > Index patterns** and verify that the default pattern `wazuh-events-v5*` exists, its time field is `@timestamp`, and its field mappings are loaded.

### Notifications and alerting

If you use external integrations:

1. Navigate to **☰ Menu > Explore > Notifications > Channels**.
2. Verify that the channels exist and are enabled, and send a test message to each one.
3. Navigate to **☰ Menu > Explore > Alerting > Monitors** and verify that the monitors are active.

See [External integrations](../../ref/external-integrations.md) to reconfigure them if needed.

### Agent enrollment

A 5.x agent registers with an enrollment token only: the 4.x registration variables, such as `WAZUH_MANAGER_ENDPOINT` or `WAZUH_REGISTRATION_PASSWORD`, are ignored by the 5.x installer. Obtain the command from the **Deploy new agent** wizard, or replace `<enrollment-token>` below with a token minted on the manager. See [Agent deploy one-liner](../../ref/agent-deploy-one-liner.md#enrollment-token).

```bash
curl -so wazuh-agent-5.0.0-1.deb \
  https://packages.wazuh.com/production/5.x/apt/pool/main/w/wazuh-agent/wazuh-agent_5.0.0-1_amd64.deb \
  && sudo WAZUH_ENROLLMENT_TOKEN='<enrollment-token>' dpkg -i ./wazuh-agent-5.0.0-1.deb

sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent
```

Verify that the agent appears in the dashboard under **Agents**.

## Troubleshooting

### The dashboard fails to start

If the service does not start at all and the journal shows `resolve-credentials: MISSING ...`, supply the named password in `/etc/wazuh/credentials.env`. See [When the dashboard does not start](../../ref/getting-started/credentials.md#when-the-dashboard-does-not-start).

If the logs show `[error][savedobjects-service] Unable to connect to OpenSearch`:

1. Verify that the indexer is running:

   ```bash
   sudo systemctl status wazuh-indexer
   curl -k -u admin:$WAZUH_INDEXER_ADMIN_PASSWORD https://localhost:9200/
   ```

2. Check the certificate paths:

   ```bash
   ls -la /etc/wazuh-dashboard/certs/
   ```

3. Test the indexer connectivity:

   ```bash
   openssl s_client -connect localhost:9200 -CAfile /etc/wazuh-dashboard/certs/root-ca.pem
   ```

4. Review the logs:

   ```bash
   sudo journalctl -u wazuh-dashboard -n 100 --no-pager
   ```

### Server API connection errors

If the dashboard reports `Wazuh API is not reachable`:

1. Verify the `wazuh_core.hosts` block in `opensearch_dashboards.yml`:

   ```bash
   grep -A 10 "wazuh_core.hosts:" /etc/wazuh-dashboard/opensearch_dashboards.yml
   ```

2. Test the API manually as described in [Server API connection](#server-api-connection).

3. Check the manager firewall:

   ```bash
   sudo firewall-cmd --list-all  # RHEL/CentOS
   sudo ufw status  # Ubuntu
   ```

### Missing saved objects

If dashboards or visualizations don't appear after the migration:

1. Re-import the saved objects as described in [Custom dashboards and visualizations](./dashboards.md#step-3-import-saved-objects-into-wazuh-5x).

2. If the default index pattern is missing, create it manually, replacing `<DASHBOARD_HOST>` with the 5.x dashboard hostname or IP and `<DASHBOARD_PORT>` with the dashboard port (`server.port`, `443` by default):

   ```bash
   curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/index-pattern/wazuh-events-v5*" \
     -H "osd-xsrf: true" \
     -H "Content-Type: application/json" \
     -u admin:$WAZUH_INDEXER_ADMIN_PASSWORD \
     -k \
     -d '{
       "attributes": {
         "title": "wazuh-events-v5*",
         "timeFieldName": "@timestamp"
       }
     }'
   ```

3. To recreate the missing default index patterns and dashboards, restart the dashboard service: the `saved-objects:index-patterns` and `saved-objects:dashboards` health checks run again on startup and provision them. Check the result in **☰ Menu > Dashboard management > Health Check**.

### Custom branding not working

The 4.x `customization.*` settings are not read in 5.x. Migrate them to `opensearchDashboards.branding.*` in `opensearch_dashboards.yml`, as described in [Customization settings](./configuration.md#customization-settings).

### Plugins not loading

If the logs show `[error][plugins] Failed to load plugin wazuhCore`:

1. List the installed plugins. They are installed with the package:

   ```bash
   sudo /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin list
   ```

2. Verify the plugin compatibility:

   ```bash
   cat /usr/share/wazuh-dashboard/plugins/wazuh/package.json | grep -A 2 "pluginPlatform"
   ```

### Performance degradation

If the dashboard is slow or unresponsive after the migration:

1. Clear the browser cache and cookies.

2. Optimize the indexer indices that are no longer written to. Force-merge only rolled-over (read-only) backing indices, never the current write index of a data stream. Replace `<ROLLED_OVER_INDEX>` with the name of such an index:

   ```bash
   curl -X POST "https://localhost:9200/<ROLLED_OVER_INDEX>/_forcemerge?max_num_segments=1" \
     -u admin:$WAZUH_INDEXER_ADMIN_PASSWORD -k
   ```

3. Review the resource allocation:

   ```bash
   # Check memory usage
   free -h
   # Check disk space
   df -h
   ```

4. Tune the dashboard settings in `opensearch_dashboards.yml`:

   ```yaml
   ops.interval: 10000 # Increase monitoring interval
   opensearch.requestTimeout: 60000 # Increase timeout
   ```

5. See the [Performance](../../ref/performance.md) guide.

## Support

For migration assistance:

- Community forum: https://groups.google.com/g/wazuh
- GitHub issues: https://github.com/wazuh/wazuh-dashboard-plugins/issues
