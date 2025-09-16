# Prompts

The plugin uses prompts to display some problems or missing dependencies for the views.

## Data source has an error. The filter related to the server API context can not be created due to the required data was not found. This is usually caused because there is no selected a server API. Ensure the server API is available and select it in the server API selector.

This means the filter related to the selected server API (`cluster.name`/`manager.name` in the alerts case or `wazuh.cluster.name` in the inventories data) can not be created due to the required information is not available in some dashboard or inventory view. The required data to create the filter is stored in the `clusterInfo` cookie in the client browser.

The cookie is set when getting the cluster information after the server API is selected through the selector or automatically when enters to some apps of Wazuh dashboard if possible.

### Troubleshooting

1. Ensure there is an server API selected in the selector (Wazuh dashboard header top right corner)
2. Server API is available and the Wazuh dashboard can communicate with it.
   > Use the `ping` command or try to do a request (`cURL`) from the Wazuh dashboard host to the server API to ensure teh communication using the host configuration in the `wazuh.yml`.
3. Review the server API host configuration (URL, port, user credentials of the Wazuh server) are valid. The internal user should have permissions to retrieve the cluster information data so this can be set in the cookie.
4. Ensure the `clusterInfo` cookie is set in the browser.

## Data source has an error. Index pattern with ID or title [INDEX_PATTERN] not found. Review if you have at least one index pattern with this configuration. You can create the index patterns from Dashboard Management application if there are matching indices. If there are no matching indices, this could indicate the data collection is disabled or there is a problem in the collection or ingestion.

This means the index pattern, that is used in some view or panel where the error is visible, could not be found.

This could be caused because the expected index pattern does not exist. The Wazuh dashboard could try to create the index patterns if this find matching indices, so this could mean there is no matching indices due to the data collection could be disabled or there is a problem in the data collection (server) or ingestion (server and indexer).

In some cases, it searches by index pattern ID, and in others, this could be the ID or title. This requirement is specified in the error depending on the view or panel.

### Troubleshooting

1. Ensure you have an index pattern with the requirements of ID or title that are speficied in the error.
   The available index patterns can be listed in the **Dashboard Management** > **Index patterns**.

In the case the index pattern is not created, you can create in the **Dashboard Management** > **Index patterns** if there are matching indices.

If there is not matching indices, this could indicate:

- the data collection is disabled: in this case the prompt is expected because the related indices do not exist
- the data collection or ingestion has a problem: review the logs of the components (server and indexer) that run these actions for more information

## Data source has an error. There is no selected index pattern for alerts. Ensure there is a compatible index pattern and select it using the index pattern selector. The index pattern selector is only available when there are multiple compatibles index patterns. If there is only a compatible index pattern, the selector is not visible, and it could indicate the index pattern was not selected due to some error or you could need to select it.

This error indicates the index pattern related to alerts is not selected.

The selection of the alerts index pattern is stored in the `currentPattern` cookie that stores the ID in the browser. If this cookie is not present or this has a falsy value, the error is thrown.

Ensure the alerts index pattern is selected if this is available.

### Troubleshooting

1. Ensure the index pattern related to alerts is selected in the selector (Wazuh dashboard header top right corner).
2. Ensure the environment has compatible index patterns with the alerts data. You can list the index patterns in **Dashboard Management** > **Index patterns**. The compatible index patterns are these have the following fields:

- `timestamp`
- `rule.groups`
- `manager.name`
- `agent.id`

If there is not a compatible index pattern, it can be created if there are matching indices in **Dashboard Management** > **Index patterns**.

If there is no matching indices and the alerts generation is enabled, this could indicate a problem in the
data collection (server) or ingestion (server, Filebeat, indexer). Review the components responsibles of these actions.

3. Ensure the `currentPattern` cookie is set in the browser with the ID of the index.

## Server API is not available. The server API is currently not available. Review the connection with the selected server API, the service is running and the API host configuration is valid.

This means the dashboard can not connect with the server API host.

This could be caused by:

- Server API host is not reachable from the Wazuh dashboard host.
  - Network problem (firewall).
- Server API is down/stopped.
- Wrong server API host configuration (URL, port and credentials)

### Troubleshooting

1. Ensure the server API is running

```
systemctl status wazuh-manager
```

2. Ensure the server API host is reachable from the Wazuh dashboard host.

Use the `ping` command or `cURL` to try the communication using the configuration for the server API host in the Wazuh dashboard.

3. Review the server API host configuration in the Wazuh dashboard side (URL, port and credentials)

## Server API is not selected. The server API is not selected. Select it using the server API selector.

This means the server API host is not selected.

The selection of the server API host is set in the `currentApi` cookie in the browser. If this is not set or has a falsy value, the error is displayed.

This can be caused because the server API host is not selected or this could be set when entering to some apps in Wazuh dashboard.

### Troubleshooting

1. Ensure the server API host is selected in the selector (Wazuh dashboard header top right corner).
2. Ensure the server API is available (online).
3. Ensure the server API is reachable by the Wazuh dashboard host and its configuration (URL, port and creandentials) is ok.
