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

> NOTE: It is required to specify at least one host.

A host has the following properties:

| Property | Description                                                    | Required | Default value | Allowed values                     |
| -------- | -------------------------------------------------------------- | -------- | ------------- | ---------------------------------- |
| url      | Define the URL address                                         | Yes      | -             | any valid URL string               |
| port     | Define the port                                                | Yes      | -             | any integer between 1-65535        |
| username | Define the username                                            | Yes      | -             | any string between 4-64 characters |
| password | Define the password                                            | Yes      | -             | any string up to 64 characters     |
| run_as   | Define if the user context is used to retrieve the permissions | No       | false         | true, false                        |
| key      | Path to the SSL/TLS client private key file                    | No       | -             | absolute or relative file path     |
| cert     | Path to the SSL/TLS client certificate file                    | No       | -             | absolute or relative file path     |
| ca       | Path to the CA certificate file for server verification        | No       | -             | absolute or relative file path     |

This is an example of a multi-host configuration:

```yml
wazuh_core.hosts:
  default:
    url: https://localhost
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false
  another_host:
    url: https://another_host_dns
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: true
    key: '/etc/wazuh-dashboard/certs/dashboard-another-host.key'
    cert: '/etc/wazuh-dashboard/certs/dashboard-another-host.crt'
    ca: '/etc/wazuh-dashboard/certs/root-ca.pem'
```

## SSL/TLS client certificate configuration

When the Wazuh server API is configured to require client certificate authentication (via `use_ca: True` in the server `api.yaml`), the dashboard must present a valid client certificate on each connection. The `key`, `cert`, and `ca` fields on each host entry control this behavior.

### How it works

The dashboard reads the certificate files from disk when establishing the first connection to each API host and caches the resulting HTTPS agent for the lifetime of the server process. The agent is configured as follows:

- When `key` and `cert` are both provided: the dashboard presents a client certificate during the TLS handshake.
- When `ca` is provided: the dashboard loads the CA and sets `rejectUnauthorized: true`, meaning the server certificate is validated against the CA. Without `ca`, the connection proceeds without server certificate validation (`rejectUnauthorized: false`).
- `key` and `cert` must always be provided together. Providing only one of them results in an error at connection time.

The `verify_ca` field exposed in the **Server API** management table is derived automatically from the presence of the `ca` path in the host configuration. It is not a configurable field.

> **Cache note:** The HTTPS agent is created once per host and cached in memory. If certificate files are replaced on disk, the Wazuh Dashboard process must be restarted for the new files to take effect.

### Certificate path resolution

Certificate paths are resolved as follows:

- **Absolute paths** (recommended): used as-is.
- **Relative paths**: resolved relative to the OpenSearch Dashboards configuration directory (the directory containing `opensearch_dashboards.yml`).

### Error handling

The dashboard surfaces certificate errors at connection time rather than at startup. If a certificate file is missing or unreadable, the API health check for that host will fail with a descriptive error. The following conditions produce errors:

| Condition                                         | Behavior                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| `key` provided but `cert` missing (or vice versa) | Error: incomplete client certificate configuration |
| `key` or `cert` file not found on disk            | Error: certificate file not found                  |
| `ca` file not found on disk                       | Error: CA certificate file not found               |
| File exists but process lacks read permission     | Error: `EACCES: permission denied`                 |
| Server hostname not in certificate SAN            | Error: `ERR_TLS_CERT_ALTNAME_INVALID`              |

### Configuration example

The following example configures a host with full client certificate authentication and server certificate verification:

```yml
wazuh_core.hosts:
  production:
    url: 'https://wazuh.example.com'
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false
    key: '/etc/wazuh-dashboard/certs/dashboard-client.key'
    cert: '/etc/wazuh-dashboard/certs/dashboard-client.crt'
    ca: '/etc/wazuh-dashboard/certs/root-ca.pem'
```

For a host that connects without client certificates (server certificate validation is skipped):

```yml
wazuh_core.hosts:
  default:
    url: 'https://localhost'
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false
```

# Tenant configuration

Wazuh dashboard adds the following settings that can be configured in tenant level from **Dashboard management** > **Dashboard Management** > **Advanced settings**:

| Setting                | Description                                                | Default value | Allowed values                |
| ---------------------- | ---------------------------------------------------------- | ------------- | ----------------------------- |
| enrollment.dns         | Define the Wazuh server DNS for the guide to deploy agents | ''            | any valid DNS or IP           |
| reports.csv.maxRows    | Define the maximum rows to exports in some tables          | 10000         | any number starting from 0    |
| timeout                | Define the timeout for some requests done from UI          | 20000         | any number starting from 1500 |
| wazuh.updates.disabled | Define if the updates check is disabled                    | true          | true, false                   |
