# Upgrade

## Backup files

Backup the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file to save your settings. For example, create a copy of the file using the following command:

```console
sudo cp /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml.old
```

## Upgrade the Wazuh dashboard

- RPM-based operating system:

```console
sudo yum upgrade wazuh-dashboard|WAZUH_DASHBOARD_RPM_PKG_INSTALL|
```

- Debian-based operating system:

```console
sudo apt-get install wazuh-dashboard|WAZUH_DASHBOARD_DEB_PKG_INSTALL|
```

> Note: When prompted, choose to replace the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file with the updated version.

Manually reapply any configuration changes to the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file. Ensure that the values of `server.ssl.key` and `server.ssl.certificate` match the files located in `/etc/wazuh-dashboard/certs/`.

Ensure the value of `uiSettings.overrides.defaultRoute` in the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file is set to `/app/wz-home` as shown below:

```yaml
uiSettings.overrides.defaultRoute: /app/wz-home
```

Restart the Wazuh dashboard:

- **Systemd**:

```console
sudo systemctl daemon-reload
sudo systemctl enable wazuh-dashboard
sudo systemctl start wazuh-dashboard
```

- **SysV init** in RPM-based operating system:

```console
sudo chkconfig --add wazuh-dashboard
sudo service wazuh-dashboard start
```

- **SysV init** in Debian-based operating system:

```console
sudo update-rc.d wazuh-dashboard defaults 95 10
sudo service wazuh-dashboard start
```

You can now access the Wazuh dashboard via: `https://<DASHBOARD_IP_ADDRESS>/app/wz-home`.

> Note that the upgrade process doesn't update plugins installed manually. Outdated plugins might cause the upgrade to fail.

Run the following command on the Wazuh dashboard server to list installed plugins and identify those that require an update:

```console
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin list
```

In the output, plugins that require an update will be labeled as "outdated".

Remove the outdated plugins and reinstall the latest version replacing `<PLUGIN_NAME>` with the name of the plugin:

```console
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin remove <PLUGIN_NAME>
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin install <PLUGIN_NAME>
```

## Verify the installed version

The Wazuh server, indexer, and dashboard are now successfully upgraded. You can verify the versions by running the following commands on the node(s) where the central components are installed:

- RPM-based operating system:

```console
sudo yum list installed wazuh-dashboard
```

- Debian-based operating system:

```console
sudo apt list --installed wazuh-dashboard
```
