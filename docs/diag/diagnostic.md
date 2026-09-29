# Diagnostic Guide

## Errors

### The Wazuh dashboard service does not start

Before the dashboard starts, the service runs `resolve-credentials --prestart`, which resolves the
`kibanaserver` and `wazuh-wui` passwords into the keystore. If a password is missing or invalid, the
service refuses to start and the journal names the key:

```
resolve-credentials: MISSING WAZUH_MANAGER_WUI_PASSWORD (the manager's wazuh-wui account)
resolve-credentials:         set it in /etc/wazuh/credentials.env, or install wazuh-manager on this host first
```

1. Read the journal:

```
journalctl -u wazuh-dashboard -n 50
```

2. Set the missing key in `/etc/wazuh/credentials.env` (`WAZUH_INDEXER_KIBANASERVER_PASSWORD` or
   `WAZUH_MANAGER_WUI_PASSWORD`), or correct the value reported as `INVALID`.
3. If the journal reports `REFUSED /etc/wazuh/credentials.env`, fix its ownership and mode: the file
   must be `root:root 0600`, and `/etc/wazuh` must not be group- or world-writable.
4. Start the service again. If systemd reports that the start limit was hit, run
   `systemctl reset-failed wazuh-dashboard` first.

If the service does not start because a certificate file is missing, check that
`/etc/wazuh-dashboard/certs/` holds `dashboard.pem`, `dashboard-key.pem` and `root-ca.pem`.
Certificates are issued only on a fresh install; the installation output says why they could not be
issued.

If the journal shows
`EACCES: permission denied, open '/etc/wazuh-dashboard/certs/dashboard-key.pem'`, the certificate
files are not owned by the service user. This happens with a pair copied into `certs/` as `root`
after the package was installed, or with an older package that did not give `certs/` to the service
user. Give them to the service user and start the service again:

```bash
chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
```

See [Credentials](../ref/getting-started/credentials.md#when-the-dashboard-does-not-start).

### Authentication errors (401) with the indexer or the server API

The start check validates that the passwords are present and well formed, not that they are
correct. A password that is present but wrong fails at runtime with a `401`. This happens when the
password of `kibanaserver` or `wazuh-wui` changed after the dashboard stored it in its keystore:
editing `/etc/wazuh/credentials.env` afterwards has no effect, because the keystore entry takes
precedence.

Update the keystore entry (`opensearch.password` or `wazuh_core.hosts.default.password`) and restart
the dashboard, as described in [Rotation](../ref/getting-started/credentials.md#rotation).

### Filter could not be created because no server API is selected. Make sure a server API is available and choose one in the selector.

This means the filter related to the selected server API (`cluster.name` in the alerts case or `wazuh.cluster.name` in the inventories data) can not be created due to the required information is not available because this could not be obtained in some dashboard or inventory view. The required data to create the filter is stored in the `clusterInfo` cookie in the client browser.

The cookie is set when getting the cluster information after the server API is selected through the selector or automatically when enters to some apps of Wazuh dashboard if possible.

1. Verify a server API is selected in the selector of the dashboard header.
2. Ensure the server API is online and reachable (use `ping` or `cURL` to test connectivity).
3. Check the server API configuration in `wazuh.yml` (URL, user, port, credentials).
4. Confirm the `clusterInfo` cookie is set in the browser.

### Index pattern [id: index_pattern_id] not found.

This means the expected index pattern used as data source for a view or panel could not be found.

This is usually caused because the expected index pattern does not exist. Go to Dashboard Management to create the expected index pattern if there are matching indices else it could indicate the data collection is disabled or there is a problem.

In some cases, it searches by index pattern ID, and in others, this could be the ID or title. This requirement is specified in the error depending on the view or panel.

1. Check if the specified index pattern exists in Dashboard Management > Index Patterns.
2. If missing, create the index pattern if matching indices are available.
3. If no matching indices exist:

- Verify data collection is enabled.
- Check server and indexer logs for data collection/ingestion issues.

### The server API is not available. Check the connection, ensure the service is running, and verify the API host configuration.

This means the dashboard can not connect with the server API host.

This could be caused by:

- Server API host is not reachable from the Wazuh dashboard host.
  - Network problem (e.g. termporal issue, firewall).
- Server API is down/stopped.
- Wrong server API host configuration (URL, port or credentials)

1. Ensure the server API is running

```
systemctl status wazuh-manager
```

2. Ensure the server API host is reachable from the Wazuh dashboard host.

Use the `ping` command or `cURL` to try the communication using the configuration for the server API host in the Wazuh dashboard.

3. Review the server API host configuration in the Wazuh dashboard side (URL, port and credentials)

### No server API selected. Please choose one from the server API selector.

This means the server API host is not selected.

The selection of the server API host is set in the `currentApi` cookie in the browser. If this is not set or has a falsy value, the error is displayed.

This can be caused because the server API host is not selected or this could be set when entering to some apps in Wazuh dashboard.

1. Select a server API host in the dashboard header.
2. Ensure the server API is online and reachable.
3. Verify the server API configuration (URL, port, credentials).
4. Confirm the `currentApi` cookie is set in the browser.
