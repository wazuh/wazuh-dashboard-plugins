# Available updates

## Overview

The Wazuh dashboard notifies users when a newer Wazuh version is available. It checks the
Wazuh indexer for the latest published version and presents the result in two places:

- The update notification shown at the bottom of the interface.
- The **Updates status** of each API connection in **Dashboard management > Server API**: a field
  of the connection details, or a column of the connections table in Cross-Cluster Search mode.

The check is disabled by default (`wazuh.updates.disabled: true`): neither place is rendered until
you set `wazuh.updates.disabled` to `false` in
**Dashboard management > Dashboards Management > Advanced settings** (see
[Tenant configuration](../configuration.md#tenant-configuration)).

The result of the check is stored in a single saved object that is shared by every
user of the deployment, so all sessions display the same status.

## How it works

- **Source**: the check queries the Wazuh indexer content-manager endpoint
  `GET /_plugins/_content_manager/version/check`.
- **Execution context**: the check runs under the **dashboard internal user** (the
  account configured in `opensearch.username`, `kibanaserver` by default), not under
  the user of the browser session. Available updates are a global result shared by all
  users and stored in a single saved object, so the check is performed with a
  consistent identity that does not depend on the permissions of the logged-in user.
- **Storage**: the outcome of a successful check is written once to the shared saved
  object and served to every session on subsequent reads. A failed check is returned
  only to the session that triggered it and does not replace the last successful
  result. As a result, the date shown to other sessions is the date of the last
  _successful_ check, even if later checks fail (for example, in an air-gapped
  deployment where the CTI service is unreachable).

## Required indexer permission

Because the check runs as the dashboard internal user, that user must be authorized to
run the following cluster action on the Wazuh indexer:

| Permission                                      | Type    | Why                                       |
| ----------------------------------------------- | ------- | ----------------------------------------- |
| `cluster:monitor/content_manager/version/check` | cluster | Query the latest available Wazuh version. |

In the packaged Wazuh indexer configuration, the `kibanaserver` internal user holds this
permission through the built-in OpenSearch security role `kibana_server`, which is mapped
to `kibanaserver`. That role includes the `cluster_monitor` action group
(`cluster:monitor/*`), which covers the version-check action.

No additional indexer configuration is required for a default deployment.

> **Note:** If you change the dashboard internal user, use a custom indexer security
> configuration, or remove the `kibana_server` role mapping, grant
> `cluster:monitor/content_manager/version/check` (directly or through the
> `plugin:content_manager/version/check` action group) to a role mapped to that user.
> When the internal user lacks this permission, the indexer responds with `403` and the
> **Updates status** is reported as an error.

## Verification

Confirm that the internal user can run the check against the indexer. Replace
`<KIBANASERVER_PASSWORD>` and `<INDEXER_HOST>` with the values for your deployment; a
successful response returns HTTP `200`:

```bash
curl -sk -u kibanaserver:<KIBANASERVER_PASSWORD> \
  https://<INDEXER_HOST>:9200/_plugins/_content_manager/version/check \
  -o /dev/null -w '%{http_code}\n'
```

For the `kibanaserver` password, see [Credentials](../getting-started/credentials.md).
For an overview of the Wazuh dashboard security model, see [Security](../security.md).

## Disabling the notification per user

The update notification shown at the bottom of the interface has a **Disable updates
notifications** checkbox. Unlike the shared available-updates result, this preference is stored
per user, in the hidden `wazuh-check-updates-user-preferences` saved object
(`hide_update_notifications` field) — enabling it only hides the notification for the user who set
it, not for the rest of the deployment. See [Persistence](../architecture.md#persistence).
