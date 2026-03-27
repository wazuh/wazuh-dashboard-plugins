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

It is recommended to take a backup before proceding the upgrade. See [backup](./backup-restore.md).

Backup the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file to save your settings at least, this could be required to redefine the configuration changes. Create a copy of the file using the following command:

```bash
cp /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml.old
```

3. Download the new package and install it.

See the [Package Download](getting-started/packages.md#package-download) section for available repositories and download instructions.

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

> **Note:** When prompted, choose to replace the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file with the updated version.

4. Reapply the configuration changes.

If the configuration file was replaced when the package was installed, follow the next steps:

4.1. Manually reapply any configuration changes to the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file. Ensure that the values of `server.ssl.key` and `server.ssl.certificate` match the files located in `/etc/wazuh-dashboard/certs/`.

4.2. Ensure the value of `uiSettings.overrides.defaultRoute` in the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file is set to `/app/wz-home` as shown below:

```yaml
uiSettings.overrides.defaultRoute: /app/wz-home
```

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

6. Import the saved objects customizations exported while preparing the upgrade if required.

- Navigate to **Dashboard management** > **Dashboard Management** > **Saved objects** on the Wazuh dashboard.
- Click **Import**, add the ndjson file and click **Import**.

> **Note:**
> Note that the upgrade process doesn't update plugins installed manually. Outdated plugins might cause the upgrade to fail.
>
> - Run the following command on the Wazuh dashboard server to list installed plugins and identify those that require an update:
>
>   ```bash
>   sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin list
>   ```
>
>   In the output, plugins that require an update will be labeled as "outdated".
>
> - Remove the outdated plugins and reinstall the latest version replacing `<PLUGIN_NAME>` with the name of the plugin:
>
>   ```bash
>   sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin remove <PLUGIN_NAME>
>   sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin install <PLUGIN_NAME>
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

If you are moving from 4.x to 5.x, review the migration checklist in
[Migration guide (4.x to 5.x)](migration-4x-5x.md) before applying the upgrade.
