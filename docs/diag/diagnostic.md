# Diagnostic Guide

## Errors

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

### No index pattern selected for alerts. Make sure a compatible index pattern exists and select it. This wasn’t applied correctly or needs to be re‑selected.

This error indicates the index pattern related to alerts is not selected. It is usually caused because there is no a compatible index pattern or there is a problem in the selection.

Try to re-select the index pattern using the alerts index pattern selector.

The alerts index pattern is stored in the `currentPattern` cookie that stores the ID in the browser. If this cookie is not present or this has a falsy value, the error is thrown.

1. Select the alerts index pattern in the dashboard header.
2. Ensure compatible index patterns exist with required fields (timestamp, rule.groups, manager.name and agent.id).
3. If no compatible index patterns exist, create one if matching indices are available.
4. Verify the `currentPattern` cookie is set with the index pattern ID.

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
