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

| Name                                                                | Description                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index-pattern:alerts`                                              | Validate (create if possible) the existence of a compatible index pattern for alerts                                                                                                                                       |
| `index-pattern:archives`                                            | Validate (create if possible) the existence of a compatible index pattern for archives                                                                                                                                     |
| `index-pattern:events-access-management`                            | Validate (create if possible) the existence of a compatible index pattern for access management events                                                                                                                     |
| `index-pattern:events-applications`                                 | Validate (create if possible) the existence of a compatible index pattern for aaplications events                                                                                                                          |
| `index-pattern:events-cloud-services`                               | Validate (create if possible) the existence of a compatible index pattern for cloud services events                                                                                                                        |
| `index-pattern:events-cloud-services-aws`                           | Validate (create if possible) the existence of a compatible index pattern for AWS events                                                                                                                                   |
| `index-pattern:events-cloud-services-azure`                         | Validate (create if possible) the existence of a compatible index pattern for Azure events                                                                                                                                 |
| `index-pattern:events-cloud-services-gcp`                           | Validate (create if possible) the existence of a compatible index pattern for GCP events                                                                                                                                   |
| `index-pattern:events-network-activity`                             | Validate (create if possible) the existence of a compatible index pattern for network activity events                                                                                                                      |
| `index-pattern:events-other`                                        | Validate (create if possible) the existence of a compatible index pattern for other events                                                                                                                                 |
| `index-pattern:events-security`                                     | Validate (create if possible) the existence of a compatible index pattern for security events                                                                                                                              |
| `index-pattern:events-system-activity`                              | Validate (create if possible) the existence of a compatible index pattern for system activity events                                                                                                                       |
| `index-pattern:monitoring`                                          | Validate (create if possible) the existence of a compatible index pattern for monitoring                                                                                                                                   |
| `index-pattern:statistics`                                          | Validate (create if possible) the existence of a compatible index pattern for statistics                                                                                                                                   |
| `index-pattern:states-vulnerabilities`                              | Validate (create if possible) the existence of a compatible index pattern for vulnerabilities states                                                                                                                       |
| `index-pattern:states-inventory`                                    | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene overview states                                                                                                                   |
| `index-pattern:states-inventory-groups`                             | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene groups overview states                                                                                                            |
| `index-pattern:states-inventory-hardware`                           | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene hardware states                                                                                                                   |
| `index-pattern:states-inventory-hotfixes`                           | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene hotfixes states                                                                                                                   |
| `index-pattern:states-inventory-interfaces`                         | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene interfaces states                                                                                                                 |
| `index-pattern:states-inventory-networks`                           | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene networks states                                                                                                                   |
| `index-pattern:states-inventory-packages`                           | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene packages states                                                                                                                   |
| `index-pattern:states-inventory-ports`                              | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene ports states                                                                                                                      |
| `index-pattern:states-inventory-processes`                          | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene processes states                                                                                                                  |
| `index-pattern:states-inventory-protocols`                          | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene protocols states                                                                                                                  |
| `index-pattern:states-inventory-system`                             | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene system states                                                                                                                     |
| `index-pattern:states-inventory-users`                              | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene users states                                                                                                                      |
| `index-pattern:states-inventory-services`                           | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene services states                                                                                                                   |
| `index-pattern:states-inventory-browser-extensions`                 | Validate (create if possible) the existence of a compatible index pattern for IT Hygiene browser-extensions states                                                                                                         |
| `index-pattern:states-fim-files`                                    | Validate (create if possible) the existence of a compatible index pattern for FIM files states                                                                                                                             |
| `index-pattern:states-fim-registry-keys`                            | Validate (create if possible) the existence of a compatible index pattern for FIM registry keys states                                                                                                                     |
| `index-pattern:states-fim-registry-values`                          | Validate (create if possible) the existence of a compatible index pattern for FIM registry values states                                                                                                                   |
| `index-pattern:states-sca`                                          | Validate (create if possible) the existence of a compatible index pattern for Configuration Assessment states                                                                                                              |
| `server-api:connection-compatibility`                               | Validate the connection and compatibility with the server API hosts                                                                                                                                                        |
| `integrations:default-notifications-channels-and-alerting-monitors` | Validate the existence of the default Notifications channels and Alerting monitors; creates them if missing (monitors are only created if their corresponding channels exist). See Notifications and Alerting for details. |

## Notifications and Alerting

For details about the default notification channels created by Health Check, the sample monitors it can provision, and the steps to finalize configuration, see [Notifications and Alerting](./notifications-alerting.md).

## Execution results

The checks has the following properties as part of the execution:

- result: define the check result.

| Value  | Description                                            |
| ------ | ------------------------------------------------------ |
| gray   | Initial result value, check did not finish or disabled |
| yellow | Some was wrong and some features could not work        |
| red    | Critical error                                         |
| green  | Suscessful                                             |

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

| setting                                             | description                                                                                                            | default value     | allowed values            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------- |
| `healthcheck.enabled`                               | define if the health check is enabled or not                                                                           | true              | true, false               |
| `healthcheck.checks_enabled`                        | define the checks that are enabled. This is a regular expression or a list of regular expressions (NodeJS compatibles) | `.*`              | string or list of strings |
| `healthcheck.interval`                              | define the interval to run the health check after the initial check                                                    | 15m               | 5m to 24h                 |
| `healthcheck.retries_delay`                         | define the wait time after a failed overall health check                                                               | 2.5s              | 0 to 1m                   |
| `healthcheck.max_retries`                           | define the maximum count of retries of the overall health check that can be executed                                   | 5                 | integer, minimum 1        |
| `healthcheck.server_not_ready_troubleshooting_link` | define the troubleshooting link in the not-ready server                                                                | URL to Wazuh docs | a valid URL               |

## Enabling checks

By default all the checks are enabled else the enabled checks are redefined through the `healthcheck.checks_enabled` setting.

The enabled checks can be seen in the application logs:

```log
server    log   [10:04:59.621] [info][healthcheck] Enabled checks [2]: [server-api:connection-compatibility,index-pattern:alerts,index-pattern:monitoring,index-pattern:statistics,index-pattern:vulnerabilities-states,index-pattern:states-inventory,index-pattern:states-inventory-groups,index-pattern:states-inventory-hardware,index-pattern:states-inventory-hotfixes,index-pattern:states-inventory-interfaces,index-pattern:states-inventory-networks,index-pattern:states-inventory-packages,index-pattern:states-inventory-ports,index-pattern:states-inventory-processes,index-pattern:states-inventory-protocols,index-pattern:states-inventory-system,index-pattern:states-inventory-users,index-pattern:states-fim-files,index-pattern:states-fim-registry-keys,index-pattern:states-fim-registry-values]
```

This setting can be a string or a list of strings.

For example,

- Enable checks related to the index patterns:

```yml
healthcheck.checks_enabled: index-pattern
```

- Enable checks related to the alerts index pattern:

```yml
healthcheck.checks_enabled: 'index-pattern:alerts'
```

- Enable checks related to the IT Hygiene states:

```yml
healthcheck.checks_enabled: 'index-pattern:states-inventory'
```

- Enable checks related to the IT Hygiene states and alerts:

```yml
healthcheck.checks_enabled:
  ['index-pattern:alerts', 'index-pattern:states-inventory']
```

# Application

The health check data can be explored in the **Dashboard management** > **Health Check** app.

This displays information about the overall result and checks details. It allows to export the health check data to JSON to be shared for troubleshooting.

TODO: screenshot

# Icon in the platform header

An icon is present in the platform header to display the overall result of the health check.

TODO: screenshot

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
