# Configuration

This section describes all the settings that adds Wazuh dashboard.

## File

The following settings can be defined in the configuration file `opensearch_dashboards.yml`:

| Setting                                             | Description                                                                                                            | Default value     | Allowed values                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| `wazuh_core.hosts`                                  | Define the Wazuh server hosts                                                                                          | -                 | Hosts (see #define-wazuh-server-hosts) |
| `healthcheck.enabled`                               | define if the health check is enabled or not                                                                           | true              | true, false                            |
| `healthcheck.checks_enabled`                        | define the checks that are enabled. This is a regular expression or a list of regular expressions (NodeJS compatibles) | `.*`              | string or list of strings              |
| `healthcheck.interval`                              | define the interval to run the health check after the initial check                                                    | 15m               | 5m to 24h                              |
| `healthcheck.retries_delay`                         | define the wait time after a failed overall health check                                                               | 2.5s              | 0 to 1m                                |
| `healthcheck.max_retries`                           | define the maximum count of retries of the overall health check that can be executed                                   | 5                 | integer, minimum 1                     |
| `healthcheck.server_not_ready_troubleshooting_link` | define the troubleshooting link in the not-ready server                                                                | URL to Wazuh docs | a valid URL                            |

## Define Wazuh server hosts

The Wazuh server hosts are defined in the configuration file through the `wazuh_core.hosts` setting.

> Note It is required to specify at least one host.

A host has the following properties:

| Property | Description                                                                          | Default value | Allowed values       |
| -------- | ------------------------------------------------------------------------------------ | ------------- | -------------------- |
| url      | Define the URL address                                                               | -             | any valid URL string |
| port     | Define the port                                                                      | -             | any number           |
| username | Define the username                                                                  | -             | any string           |
| password | Define the password                                                                  | -             | any string           |
| run_as   | Define the the user context is used to retrieve the permissions for the Wazuh server | false         | true, false          |

This is an example of a multi-host configuration:

```yml
wazuh_core.hosts:
  - default:
    url: https://localhost
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false
  - another_host:
    url: https://another_host_dns
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: true
```

# Tenant configuration

Wazuh dashboard adds the following settings that can be configured in tenant level from **Dashboard management** > **Dashboard Management** > **Advanced settings**:

| Setting                | Description                                                | Default value     | Allowed values                 |
| ---------------------- | ---------------------------------------------------------- | ----------------- | ------------------------------ |
| alerts.sample.prefix   | Define the prefix for the alerts sample data               | wazuh-alerts-4.x- | any valid indice string        |
| enrollment.dns         | Define the Wazuh server DNS for the guide to deploy agents | ''                | any valid DNS or IP            |
| hideManagerAlerts      | Define if the alerts of Wazuh server should be hidden      | false             | true, false                    |
| ip.ignore              | Define the alerts index pattern to ignore in the selector  | []                | array of index pattern strings |
| pattern                | Define the default alerts index pattern                    | wazuh-alerts\*    | any valid index pattern string |
| reports.csv.maxRows    | Define the maximum rows to exports in some tables          | 10000             | any number starting from 0     |
| timeout                | Define the timeout for some requests done from UI          | 20000             | any number starting from 1500  |
| wazuh.updates.disabled | Define if the updates check is disabled                    | false             | true, false                    |
