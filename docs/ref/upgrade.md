## Preparing the upgrade

It is recommended to export customizations from the Wazuh dashboard. This step helps to preserve visualizations, dashboards, and other saved objects in case there are any issues during the upgrade process.

1.  Navigate to **Dashboard management** > **Dashboards Management** > **Saved objects** on the Wazuh dashboard.
2.  Select which objects to export and click **Export**, or click **Export all objects** to export everything.

#. Stop the Wazuh dashboard service:

**Systemd**

```bash
systemctl stop wazuh-dashboard
```

**SysV init**

```bash
service wazuh-dashboard stop
```

## Upgrading the Wazuh dashboard

Backup the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file to save your settings. For example, create a copy of the file using the following command:

```bash
cp /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml.old
```

1. Upgrade the Wazuh dashboard.

   **Yum**

```bash
yum upgrade wazuh-dashboard-5.0.0-1
```

**APT**

```bash
apt-get install wazuh-dashboard=5.0.0-1
```

> **Note:** When prompted, choose to replace the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file with the updated version.

2. Manually reapply any configuration changes to the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file. Ensure that the values of `server.ssl.key` and `server.ssl.certificate` match the files located in `/etc/wazuh-dashboard/certs/`.

3. Ensure the value of `uiSettings.overrides.defaultRoute` in the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file is set to `/app/wz-home` as shown below:

```yaml
uiSettings.overrides.defaultRoute: /app/wz-home
```

4. Restart the Wazuh dashboard:

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

You can now access the Wazuh dashboard via: `https://<DASHBOARD_IP_ADDRESS>/app/wz-home`.

1. Import the saved customizations exported while preparing the upgrade.

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
> 2. Remove the outdated plugins and reinstall the latest version replacing `<PLUGIN_NAME>` with the name of the plugin:
>
>    ```bash
>    sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin remove <PLUGIN_NAME>
>    sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin install <PLUGIN_NAME>
>    ```
