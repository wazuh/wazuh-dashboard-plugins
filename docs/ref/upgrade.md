# Upgrade

This section guides you through the upgrade process of the Wazuh dashboard.

## Pre-Upgrade Requirements

Before upgrading, ensure you:

1. Review release notes for breaking changes and new features
2. Verify system meets requirements for the new version
3. Create a backup following the [backup procedures](./backup-restore.md)

## Upgrading the Wazuh dashboard

1. Stop the Wazuh dashboard service:

**Systemd**

```bash
systemctl stop wazuh-dashboard
```

**SysV init**

```bash
service wazuh-dashboard stop
```

2. Backup

It is recommended to take a backup before proceeding with the upgrade. See [backup](./backup-restore.md).

Backup the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file to save your settings at least, this could be required to redefine the configuration changes. Create a copy of the file using the following command:

```bash
cp /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml.old
```

3. Download the new package and install it.

See the [Package Download](getting-started/packages.md#download-packages) section for available repositories and download instructions.

**Debian-based:**

```bash
dpkg -i wazuh-dashboard_<VERSION>-<REVISION>_<ARCHITECTURE>.deb
```

**RHEL/CentOS-based:**

```bash
yum localinstall wazuh-dashboard-<VERSION>-<REVISION>.<ARCHITECTURE>.rpm
```

**RHEL/CentOS-based (DNF):**

```bash
dnf localinstall wazuh-dashboard-<VERSION>-<REVISION>.<ARCHITECTURE>.rpm
```

> **Note:** `dpkg` prompts interactively for a modified conffile — choose to replace
> `/etc/wazuh-dashboard/opensearch_dashboards.yml` with the updated version. RPM's `%config(noreplace)`
> directive means `rpm`/`yum`/`dnf` never prompt and never overwrite a modified file: the package's new
> version is instead written alongside it as `opensearch_dashboards.yml.rpmnew`, which you must diff
> and merge manually.

4. Reapply the configuration changes.

If the configuration file was replaced when the package was installed, follow the next steps:

4.1. Manually reapply any configuration changes to the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file. Ensure that the values of `server.ssl.key` and `server.ssl.certificate` match the files located in `/etc/wazuh-dashboard/certs/`.

4.2. The packaged `opensearch_dashboards.yml` no longer sets `wazuh_core.hosts.default.password`: the package stores that password in the keystore. If you replaced the file and the keystore has no `wazuh_core.hosts.default.password` entry, add `WAZUH_MANAGER_WUI_PASSWORD` to `/etc/wazuh/credentials.env` before starting the service, or keep the setting in your file. Otherwise the service refuses to start and names the missing key. See [Credentials](getting-started/credentials.md#upgrades-and-removal).

4.3. Ensure the value of `uiSettings.overrides.defaultRoute` in the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file is set to `/app/wz-home` as shown below:

```yaml
uiSettings.overrides.defaultRoute: /app/wz-home
```

The upgrade keeps the keystore entries, the AI Assistant encryption key and the TLS certificates as
they are. It does not issue certificates or generate new secrets.

5. Restart the Wazuh dashboard:

   **Systemd:**

   ```bash
   systemctl daemon-reload
   systemctl enable wazuh-dashboard
   systemctl start wazuh-dashboard
   ```

   **SysV init:**
   Choose one option according to your operating system:

   - RPM-based operating system:

   ```bash
   chkconfig --add wazuh-dashboard
   service wazuh-dashboard start
   ```

   - Debian-based operating system:

   ```bash
   update-rc.d wazuh-dashboard defaults 95 10
   service wazuh-dashboard start
   ```

You can now access the Wazuh dashboard via: `https://<DASHBOARD_IP_ADDRESS>`.

6. Import the saved objects customizations exported as part of the
   [backup](./backup-restore.md#creating-a-backup) taken in
   [Pre-Upgrade Requirements](#pre-upgrade-requirements) above, if required — this guide has no
   separate export step of its own.

- Navigate to **Dashboard management** > **Dashboards Management** > **Saved objects** on the Wazuh dashboard.
- Click **Import**, add the ndjson file and click **Import**.

> **Note:**
> Note that the upgrade process doesn't update plugins installed manually. Outdated plugins might cause the upgrade to fail.
>
> - Run the following command on the Wazuh dashboard server to list installed plugins and their versions:
>
>   ```bash
>   sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin list
>   ```
>
>   The output is a plain `<plugin_id>@<version>` line per plugin — there is no "outdated" label.
>   Compare each manually installed plugin's version against the new OpenSearch Dashboards version
>   (`opensearch-dashboards --version`) to identify which ones need updating; a mismatched plugin
>   also typically fails to load, with an incompatibility error in the dashboard's logs.
>
> - Remove the outdated plugins and reinstall the latest version replacing `<PLUGIN_NAME>` with the name of the plugin. Run these commands as root: the plugin directory is owned by `root`, so the `wazuh-dashboard` user cannot write to it.
>
>   ```bash
>   sudo /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin remove <PLUGIN_NAME>
>   sudo /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin install <PLUGIN_NAME>
>   ```

7. Check the upgrade status

**Systemd:**

```
systemctl status wazuh-dashboard
```

**SysV init:**

```
service wazuh-dashboard status
```

## Migrating from 4.x to 5.x

The procedure above only applies to same-major-version upgrades (for example 5.0.0 to 5.1.0).
There is no upgrade path from 4.x: a 4.x deployment cannot apply the package upgrade above and
must instead do a fresh 5.x installation alongside it. Follow the
[migration guide](../guide/migration/README.md) for the full manual migration procedure (data,
configuration, and dashboards).
