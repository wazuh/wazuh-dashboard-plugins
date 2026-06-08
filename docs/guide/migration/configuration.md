# Configuration migration

In Wazuh 4.x, the Wazuh dashboard plugin stored its settings in a dedicated file:

```
/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml
```

This file is **no longer available in Wazuh 5.x**. All plugin settings have been consolidated into the configuration file:

```
/etc/wazuh-dashboard/opensearch_dashboards.yml
```

Some settings have been removed entirely; others have been relocated to the **Advanced Settings** section of the dashboard UI or to new keys in `opensearch_dashboards.yml`.

### Where each setting belongs in 5.x

| Location                                              | Settings                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `opensearch_dashboards.yml`                           | `wazuh_core.hosts`, `healthcheck.*`, `opensearchDashboards.branding.*`       |
| **☰ Menu > Dashboard Management > Advanced Settings** | `timeout`, `enrollment.dns`, `reports.csv.maxRows`, `wazuh.updates.disabled` |

By default, these settings are tenant-level preferences managed through the UI (or the saved objects API). They can also be forced globally for all tenants using `uiSettings.overrides` in `opensearch_dashboards.yml`.

---

## Wazuh server host configuration

The most critical setting to migrate is the Wazuh server API connection.

### 4.x format (`wazuh.yml`)

```yaml
hosts:
  - default:
      url: https://wazuh-manager
      port: 55000
      username: wazuh-wui
      password: <YOUR_PASSWORD>
      run_as: true
```

### 5.x format (`opensearch_dashboards.yml`)

```yaml
wazuh_core.hosts:
  default:
    url: https://wazuh-manager
    port: 55000
    username: wazuh-wui
    password: <YOUR_PASSWORD>
    run_as: true
```

The key differences are:

- The top-level key changes from `hosts` to `wazuh_core.hosts`.
- The host entries are now a flat map keyed by the host name, instead of a list of single-key objects.
- The host name (previously the `id` field inside each entry) becomes the map key directly.

### Available host properties in 5.x

| Property   | Description                                            | Required | Default |
| ---------- | ------------------------------------------------------ | -------- | ------- |
| `url`      | URL of the Wazuh server API                            | Yes      | —       |
| `port`     | TCP port of the Wazuh server API                       | Yes      | —       |
| `username` | API user                                               | Yes      | —       |
| `password` | API user password                                      | Yes      | —       |
| `run_as`   | Use the logged-in user context to retrieve permissions | No       | `true`  |
| `key`      | Path to an SSL/TLS client private key file             | No       | —       |
| `cert`     | Path to an SSL/TLS client certificate file             | No       | —       |
| `ca`       | Path to a CA certificate file for server verification  | No       | —       |

For full details on these properties, see the [Configuration reference](../../ref/configuration.md).

---

## Complete settings migration reference

The table below maps every 4.x `wazuh.yml` setting to its 5.x equivalent.

### Host configuration

| 4.x setting        | 5.x location                | 5.x key / action                   |
| ------------------ | --------------------------- | ---------------------------------- |
| `hosts[].url`      | `opensearch_dashboards.yml` | `wazuh_core.hosts.<name>.url`      |
| `hosts[].port`     | `opensearch_dashboards.yml` | `wazuh_core.hosts.<name>.port`     |
| `hosts[].username` | `opensearch_dashboards.yml` | `wazuh_core.hosts.<name>.username` |
| `hosts[].password` | `opensearch_dashboards.yml` | `wazuh_core.hosts.<name>.password` |
| `hosts[].run_as`   | `opensearch_dashboards.yml` | `wazuh_core.hosts.<name>.run_as`   |

### General settings

The following settings have a direct equivalent in 5.x:

| 4.x setting              | Default | 5.x location      | 5.x key / action                                            |
| ------------------------ | ------- | ----------------- | ----------------------------------------------------------- |
| `timeout`                | `20000` | Advanced Settings | `timeout` (milliseconds)                                    |
| `enrollment.dns`         | `''`    | Advanced Settings | `enrollment.dns`                                            |
| `reports.csv.maxRows`    | `10000` | Advanced Settings | `reports.csv.maxRows`                                       |
| `wazuh.updates.disabled` | `false` | Advanced Settings | `wazuh.updates.disabled` (default changed to `true` in 5.x) |

> **Note**: The default value of `wazuh.updates.disabled` changed from `false` in 4.x to `true` in 5.x. If update notifications were enabled in your 4.x deployment (setting set to `false`), reconfigure the same behavior in Advanced Settings after migration.

The following settings have no equivalent in 5.x and must not be carried over to `opensearch_dashboards.yml`:

| 4.x setting                     | Default          | Action in 5.x                                                                      |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `pattern`                       | `wazuh-alerts-*` | Removed; default index pattern is `wazuh-events-v5*` (provisioned by health check) |
| `ip.selector`                   | `true`           | Removed                                                                            |
| `ip.ignore`                     | `[]`             | Removed                                                                            |
| `hideManagerAlerts`             | `false`          | Removed                                                                            |
| `configuration.ui_api_editable` | `true`           | Removed                                                                            |
| `alerts.sample.prefix`          | (sample prefix)  | Removed                                                                            |

### Health check settings

In 4.x, individual health check steps could be enabled or disabled using separate boolean settings (`checks.*`). In 5.x, these are replaced by the `healthcheck.checks_enabled` setting in `opensearch_dashboards.yml`, which accepts a regular expression or list of regular expressions matching the **5.x check names** to enable.

The 4.x boolean settings do not map one-to-one to 5.x check names. For example, the old `checks.pattern` toggle covered a single index-pattern validation, whereas 5.x registers separate checks such as `index-pattern:alerts`, `index-pattern:events-security`, and dozens of others. See the [Health check reference](../../ref/modules/healthcheck.md) for the full list of 5.x check names.

| 4.x setting         | Default | 5.x equivalent                                                                                                                        |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `checks.api`        | `true`  | Controlled by `healthcheck.checks_enabled` (matches checks such as `server-api:connection-compatibility`)                             |
| `checks.fields`     | `true`  | Removed health check task.                                                                                                            |
| `checks.maxBuckets` | `true`  | Removed health check task.                                                                                                            |
| `checks.metaFields` | `true`  | Removed health check task. Changed default value in the dashboard configuration. Managed in Dashboard Management > Advanced settings. |
| `checks.pattern`    | `true`  | Controlled by `healthcheck.checks_enabled` (matches checks such as `index-pattern:*`)                                                 |
| `checks.setup`      | `true`  | Controlled by `healthcheck.checks_enabled` (matches checks such as `server-api:connection-compatibility`)                             |
| `checks.template`   | `true`  | Removed health check task.                                                                                                            |
| `checks.timeFilter` | `true`  | Removed health check task. Changed default value in the dashboard configuration. Managed in Dashboard Management > Advanced settings. |

To disable a specific check in 5.x, set `healthcheck.checks_enabled` to a pattern that does not match it. To enable all checks (the default), set the value to `.*` or leave it unset.

Example — disable a specific check:

```yaml
# Enable all checks except 'saved-objects:dashboards'
healthcheck.checks_enabled:
  - '^(?!saved-objects:dashboards$).*'
```

### Statistics and monitoring settings

The periodic data collection features from 4.x are removed in 5.x:

- **`cron.*` settings** — The statistics collection tasks that wrote agent state data to `wazuh-statistics-*` indices no longer exist. Remove all `cron.*` entries from your configuration. The `wazuh-statistics-*` indices are not created in 5.x.
- **`wazuh.monitoring.*` settings** — The agent monitoring feature that periodically created `wazuh-monitoring-*` index snapshots no longer exists. Remove all `wazuh.monitoring.*` entries. Agent status is now queried on demand from the Wazuh manager API.

If your deployment had dashboards or alerts that depended on either index, those will need to be rebuilt against the new data model (`wazuh-metrics-comms` and `wazuh-metrics-agents` indices).

### Customization settings

The settings `customization.logo.app`, `customization.enabled`, `customization.logo.healthcheck`, `customization.logo.reports`, `customization.reports.header`, and `customization.reports.footer` have no equivalent in 5.x and must be removed. The dedicated health check view that used `customization.logo.healthcheck` was removed in 5.x. PDF report branding is not configurable because report generation is now handled by the Reporting plugin.

For a full branding migration example, see [Custom Branding](../../ref/custom-branding/custom-branding.md).

---

## Step-by-step migration

### 1. Open the 4.x configuration file

Run the following command **on the 4.x dashboard server**:

```bash
sudo cat /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml
```

> **Note**: The file is owned by the `wazuh-dashboard` system user. Run the command with `sudo` or as a user with sufficient permissions to read it.

Take note of every value that differs from the defaults listed in the tables above.

### 2. Edit the 5.x configuration file

Run the following command **on the 5.x dashboard server**:

```bash
sudo nano /etc/wazuh-dashboard/opensearch_dashboards.yml
```

### 3. Add the Wazuh server host block

Append the following block to `opensearch_dashboards.yml`, replacing the placeholder values with those from your 4.x `wazuh.yml`:

```yaml
wazuh_core.hosts:
  default:
    url: https://<WAZUH_MANAGER_IP_OR_HOSTNAME>
    port: <PORT>
    username: <USERNAME>
    password: <PASSWORD>
    run_as: <RUN_AS>
```

Replace `<WAZUH_MANAGER_IP_OR_HOSTNAME>`, `<PORT>`, `<USERNAME>`, `<PASSWORD>`, and `<RUN_AS>` with the values from your 4.x configuration.

> **Note**: If you previously configured multiple hosts in `wazuh.yml`, review the [Multi-manager environments](./multi-manager.md) guide before adding more than one entry.

### 4. Set the default route

Verify that the default route is set correctly in `opensearch_dashboards.yml`:

```yaml
uiSettings.overrides.defaultRoute: /app/wz-home
```

### 5. Migrate Advanced Settings

Reconfigure the following settings after the 5.x installation is complete. Use the dashboard UI, or force them globally for all tenants via `uiSettings.overrides` in `opensearch_dashboards.yml`:

1. Navigate to **☰ Menu > Dashboard Management > Advanced Settings**.
2. Locate and update the following settings if they were customized in your 4.x deployment:

   | Setting                  | Description                                              |
   | ------------------------ | -------------------------------------------------------- |
   | `timeout`                | Request timeout in milliseconds (default: `20000`)       |
   | `enrollment.dns`         | Wazuh server DNS name used in the agent deployment guide |
   | `reports.csv.maxRows`    | Maximum rows in exported CSV tables (default: `10000`)   |
   | `wazuh.updates.disabled` | Disable the update check notification (default: `true`)  |

### 6. Remove deprecated settings

The following key groups are not recognized in 5.x. Do not include them in `opensearch_dashboards.yml`; remove any matching lines if they were copied from a previous installation:

- `customization.*` — replace `customization.logo.app` as shown above; remove the rest.
- `wazuh.monitoring.*` — entirely removed.
- `cron.*` — entirely removed.

---

## Verification

After completing the migration and starting the Wazuh dashboard 5.x service, verify the configuration is applied correctly:

1. Navigate to **☰ Menu > Dashboard management > Health Check**.
2. Confirm that the **Server API connection and compatibility** check passes.
3. Navigate to **☰ Menu > Dashboard Management > Advanced Settings** and confirm that any previously customized tenant-level settings are present.

If the API connection check fails, review the `wazuh_core.hosts` block in `opensearch_dashboards.yml` and ensure the URL, port, and credentials are correct. For further troubleshooting, refer to the [Migration guide overview](./README.md).
