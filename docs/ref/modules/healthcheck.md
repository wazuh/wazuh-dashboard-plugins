# Health check

The health check provides a mechanism to add and run checks that are needed for the different modules of the application.

The details of the overall status or checks can be seen through the **Dashboard management** > **Health Check** app.

The plugins can register task to be checked. These uses the context of the internal user of the dashboard, so this means the tasks related to saved objects such as index patterns are only checked in the `Global` tenant.

# Lifecycle

This defines a service that is integrated with the core lifecycle of the application.

## Server

1. Setup the health check using the provided or default configuration.
2. The plugins register the tasks to run
3. If the health check is enabled and there are some enabled checks (configurable with the `healthcheck.checks_enabled` setting), this runs an initial check. If some check fails, the enabled checks are retried if this is configured.
4. Once the health check pass, if this is enabled, this sets a scheduled task using the specified interval (configurable with the `healthcheck.interval` setting) to run and update the status of the enabled checks. This can be seen in the dashboard logs as:

```log
  server    log   [10:04:59.857] [info][healthcheck] Checks are ok
  server    log   [10:04:59.857] [info][healthcheck] Set scheduled checks each 300000ms
```

5. If some enabled and critical check fails in the initial check, this will avoid the application can correctly initialize until this is solved. In this case, the Wazuh dashboard server is not ready yet view should display information about the failing critical checks.

# Checks

The checks represents the unit to check and some could do some write actions such as creating index patterns.

## List

| Name                                          | Description                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `saved-objects:index-patterns`                | Validate (create if possible) the existence of the compatible index patterns used by the different modules (alerts, events, findings, metrics, states, active responses, etc.)                                                                                                  |
| `server-api:connection-compatibility`         | Validate the connection and compatibility with the server API hosts                                                                                                                                                                                                             |
| `server-api:run-as`                           | Validate that the the `run_as` setting is enabled in each host and is allowed to use by the configured user.                                                                                                                                                                    |
| `integrations:default-notifications-channels` | Validate the existence of the default Notifications channels (provisioned by `wazuh-indexer-notifications`) and create the sample Alerting monitors when missing (monitors are only created if their corresponding channels exist). See Notifications and Alerting for details. |
| `saved-objects:dashboards`                    | Provision saved visualizations and dashboards from the bundled NDJSON definitions so the UI can rely on saved-object references. See Saved Objects for Dashboards and Visualizations for details.                                                                               |
| `server-api:certificate-validity`             | Report the validity of the TLS certificates of every manager node: the listener certificate and the CA bundle served to agents. It does not block the dashboard start. See [Server Certificate Validity](#server-certificate-validity).                                         |

## Notifications and Alerting

For details about the default notification channels created by Health Check, the sample monitors it can provision, and the steps to finalize configuration, see [Notifications and Alerting](./notifications-alerting.md).

## Saved Objects for Dashboards and Visualizations

For details about the task that provisions dashboard and visualization saved objects from the repository definitions, see [Saved Objects for Dashboards and Visualizations](./saved-objects-dashboards.md).

## Server Certificate Validity

The `server-api:certificate-validity` check reports the state of the TLS certificates of every Wazuh manager node: the certificate the agent listener serves and the CA bundle the manager publishes to agents. It reports the worst state it finds and names the affected nodes.

Plan the renewal before the certificates expire. Once the CA bundle expires, every verifying agent fails the TLS handshake, and agents refresh their trust over that same TLS, so they cannot repair an expired bundle from their side.

### How it works

- **Source**: the check queries the Wazuh server API resource `GET /cluster/{node_id}/daemons/remoted/tls` for every node of the first server API host in `wazuh_core.hosts`. The API user needs the `cluster:read` permission on the node, the same one other cluster endpoints use.
- **What it evaluates**, per node:
  - the expiry of the listener certificate;
  - the expiry of each certificate in the CA bundle;
  - whether a CA in the bundle chains to the listener certificate. When none does, the manager answers `503` at `/cacerts` on that node and agents cannot refresh their trust;
  - whether the listener certificate validates against the bundle as its only trust store, dates and constraints included. The check quotes the reason the manager reports;
  - whether the manager can read the bundle file.
- **Freshness**: the manager reads the CA bundle and validates the chain on every request, so the next check reports a change to the bundle. The listener certificate is the one the manager loaded when `remoted` started, and it keeps serving it until `remoted` restarts.
- **Startup**: the check is not critical. A red result appears in the health check without holding the dashboard behind the not-ready screen, because the operator needs the dashboard to plan the renewal.

### Results

| Condition                                                                   | Result |
| --------------------------------------------------------------------------- | ------ |
| Every certificate is valid beyond the warning threshold                     | green  |
| A certificate expires within the warning threshold (30 days by default)     | yellow |
| A certificate expires within the critical threshold (7 days by default)     | red    |
| A certificate has expired                                                   | red    |
| No CA in the bundle chains to the listener certificate                      | red    |
| The listener certificate does not validate against the bundle               | red    |
| The manager cannot read the bundle file                                     | yellow |
| A node cannot report its certificate state, or does not expose the resource | yellow |

The check reports an expired listener certificate on its own. An expired certificate chains to no CA, so the check leaves out the bundle problems that follow from it, and the one action is to replace the certificate.

The message lists one line per affected certificate and node, followed by one action per distinct problem, however many nodes share it. Each run logs its outcome at the level of its result: `info` for green, `warning` for yellow and `error` for red.

```
server    log   [17:12:03.576] [warning][healthcheck][server-api:certificate-validity] The server certificates require attention.

- The listener certificate CN=wazuh.manager.local,OU=Wazuh,O=Wazuh,L=California,C=US on node node01 expires in 19 day(s), on 2026-10-12T17:10:17Z.

Ensure the listener certificate is replaced and remoted restarted. The manager has served the one it loaded on 2026-09-22T17:10:31Z since then, so replacing the file alone does not clear this.
```

### Thresholds

The thresholds are the `wazuh_core.healthCheckCertificateExpiryWarningDays` and `wazuh_core.healthCheckCertificateExpiryCriticalDays` [settings](#settings), set in `opensearch_dashboards.yml`:

```yml
wazuh_core.healthCheckCertificateExpiryWarningDays: 60
wazuh_core.healthCheckCertificateExpiryCriticalDays: 14
```

- The dashboard reads the settings when it starts, so a change takes effect after a restart.
- A value outside the allowed values stops the dashboard from starting, and the error names the setting:

```
 FATAL  ValidationError: [config validation of [wazuh_core].healthCheckCertificateExpiryWarningDays]: Value must be equal to or greater than [1].
```

- The dashboard also refuses to start with a critical threshold that is not lower than the warning one, because that pair would invert their meaning. The comparison includes the default values, so a critical threshold of 30 days or more set on its own fails as well:

```
 FATAL  ValidationError: [config validation of [wazuh_core]]: [healthCheckCertificateExpiryCriticalDays] (60) must be lower than [healthCheckCertificateExpiryWarningDays] (7)
```

### Troubleshooting

- **The check still reports a certificate after you replace it**: the manager serves the listener certificate it loaded when `remoted` started, so replacing `remoted.pem` on disk has no effect until `remoted` restarts. The action line of the message states the date the manager loaded the current certificate.
- **No CA chains to the listener certificate**: the CA bundle does not contain the CA that issued the certificate the listener serves, so the manager refuses to serve the bundle to agents. Add the issuing CA to the bundle with `wazuh-manager-certs add`, or replace the listener certificate with one issued by a CA already in the bundle.
- **The manager cannot read the bundle**: if the manager read the file before, the reported certificates describe that last copy. If it never read it, the response carries no certificates. Verify that the file exists and that the manager can read it.
- **The manager cannot list its nodes**: the check reports an undetermined state and logs the cause:

```
server    log   [16:51:55.364] [warning][healthcheck][server-api:certificate-validity] Could not list the manager nodes to check their certificates: Request failed with status code 500
```

## Execution results

The checks has the following properties as part of the execution:

- result: define the check result.

| Value  | Description                                                 |
| ------ | ----------------------------------------------------------- |
| gray   | Initial result value, check did not finish or disabled      |
| yellow | Some was wrong and some features could not work             |
| red    | Failure; a critical check with this result blocks the start |
| green  | Suscessful                                                  |

- status: define the status lifecycle of the check.

| Value       | Description         |
| ----------- | ------------------- |
| not_started | Check did not start |
| running     | Check is running    |
| finished    | Check finished      |

- time references (start and finish the execution).
- error: any error causes in the check.
- data: the return information of the check.
- metadata (enabled, critical).

## Overall result

This represents the summary of the results:

- `green`: all the enabled checks are `green`.
- `yellow`: there is at least a `yellow` check (no `red` checks).
- `red`: there is at least a `red` check.

# Configuration

## Settings

The service has the following settings:

| setting                                               | description                                                                                                            | default value     | allowed values                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| `healthcheck.enabled`                                 | define if the health check is enabled or not                                                                           | true              | true, false                                     |
| `healthcheck.checks_enabled`                          | define the checks that are enabled. This is a regular expression or a list of regular expressions (NodeJS compatibles) | `.*`              | string or list of strings                       |
| `healthcheck.interval`                                | define the interval to run the health check after the initial check                                                    | 15m               | 5m to 24h                                       |
| `healthcheck.retries_delay`                           | define the wait time after a failed overall health check                                                               | 2.5s              | 0 to 1m                                         |
| `healthcheck.max_retries`                             | define the maximum count of retries of the overall health check that can be executed                                   | 5                 | integer, minimum 1                              |
| `healthcheck.server_not_ready_troubleshooting_link`   | define the troubleshooting link in the not-ready server                                                                | URL to Wazuh docs | a valid URL                                     |
| `wazuh_core.healthCheckCertificateExpiryWarningDays`  | days before a server certificate expires at which `server-api:certificate-validity` reports yellow                     | 30                | integer, minimum 1                              |
| `wazuh_core.healthCheckCertificateExpiryCriticalDays` | days before a server certificate expires at which `server-api:certificate-validity` reports red                        | 7                 | integer, minimum 1, lower than the warning days |

## Enabling checks

By default all the checks are enabled else the enabled checks are redefined through the `healthcheck.checks_enabled` setting.

The enabled checks can be seen in the application logs:

```log
server    log   [10:52:31.480] [info][healthcheck] Enabled checks [5]: [integrations:default-notifications-channels,server-api:connection-compatibility,server-api:run-as,saved-objects:dashboards,saved-objects:index-patterns]
```

This setting can be a string or a list of strings.

For example,

- Enable the check related to the index patterns:

```yml
healthcheck.checks_enabled: 'saved-objects:index-patterns'
```

- Enable the checks related to the index patterns and the dashboards saved objects:

```yml
healthcheck.checks_enabled:
  ['saved-objects:index-patterns', 'saved-objects:dashboards']
```

# Application

The health check data can be explored in the **Dashboard management** > **Health Check** app.

This displays information about the overall result and checks details. It allows to export the health check data to JSON to be shared for troubleshooting.

Overview:

![health check application overview](./images/healthcheck-application-overview.png)

Check details:

![health check application check details](./images/healthcheck-application-check-details.png)

# Icon in the platform header

A pulse icon, colored based on the overall result, is present in the platform header to draw attention to a health check status that needs attention.

The icon is only displayed when the overall result is `yellow` or `red`. When the overall result is `green` (or `gray`), the icon is not rendered.

Hovering over the icon shows a tooltip with the overall status. Clicking it opens a popover listing the enabled checks whose result is `yellow` or `red`, each colored by its result and with a tooltip showing its error, followed by a link to the **Health Check** app for more details.

For example, when the status is `yellow`:

![health check warning header icon](./images/healthcheck-warning-header-icon.png)

# Wazuh dashboard is not ready yet

This page can include information about failing checks (critical or non-critical).

Any failed critical checks avoid the Wazuh dashboard can correctly work and these should be solved to continue, non-critical checks can be passed as warnings and some features could not work.

The checks data can be exported to JSON to be shared for troubleshooting.

# Troubleshooting

- Review related logs to the health check service in the backend side:

```
journalctl -u wazuh-dashboard | grep -i healthcheck
```

- Review related logs as errors/warnings to the health check service in the backend side:

```
journalctl -u wazuh-dashboard | grep -i healthcheck | grep -iE 'err|warn'
```

- Wazuh dashboard server is not ready yet page

It displays information about the failing checks (critical and non-critical).

The checks data can be exported to JSON to be shared for troubleshooting.

- Health Check application

The application provides information about check details and overall and allow to export the checks data to JSON for troubleshooting.
