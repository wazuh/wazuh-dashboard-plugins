# Requirements

## Hardware requirements

| Minimum RAM (GB) | Minimum CPU (cores) | Recommended RAM (GB) | Recommended CPU (cores) |
| ---------------- | ------------------- | -------------------- | ----------------------- |
| 4                | 2                   | 8                    | 4                       |

- **Disk space**: 2 GB of free space minimum, 10+ GB recommended for production.
- **Network**: 1 Gbps network interface recommended for production.

> **Note**: Hardware requirements may vary based on the number of monitored agents, data retention policies, and dashboard usage patterns.

## Platform requirements

### Operating system

See the [Compatibility](../compatibility.md#supported-operating-systems) page for the list of
supported operating system versions and architectures.

### System privileges

- Root or sudo privileges to install packages and manage services. The package itself creates
  `/usr/share/wazuh-dashboard/` as `root:root` (only `/usr/share/wazuh-dashboard/data/` is owned
  by the `wazuh-dashboard` service user) and `/etc/wazuh-dashboard/` as
  `wazuh-dashboard:wazuh-dashboard 0750` — do not grant broader write access to these paths
  afterward. See [Security](../security.md#operational-practices).

### System dependencies

Required packages (automatically installed with Wazuh dashboard):

- **Debian/Ubuntu**: `tar`, `curl`, `libcap2-bin`, `openssl`
- **RHEL/CentOS**: `libcap`, `openssl`, `diffutils`, `util-linux`

## Network requirements

### Required connectivity

- **Wazuh indexer**: HTTPS access (default port 9200)
- **Wazuh manager API**: HTTPS access (default port 55000)
- **Client browsers**: HTTPS access to dashboard (default port 443 or 5601)

### Firewall rules

Ensure the following ports are accessible:

- **Incoming**: TCP 443 (or 5601) for web interface
- **Outgoing**: TCP 9200 (Wazuh indexer), TCP 55000 (Wazuh manager API)

### TLS/SSL certificates

- Valid TLS certificates for HTTPS communication. A fresh install issues them from the shared Wazuh root CA; see [Credentials](credentials.md#certificates)
- Certificate files must be readable by the `wazuh-dashboard` user

## Component requirements

The Wazuh dashboard depends on:

### Wazuh indexer (OpenSearch)

- Version compatibility: see the [Compatibility](../compatibility.md#version-compatibility) matrix
- Connection type: HTTPS with TLS certificate verification
- Required permissions: Read and write access to Wazuh indices
- The password of the `kibanaserver` account (`WAZUH_INDEXER_KIBANASERVER_PASSWORD`)

### Wazuh manager API

- Version compatibility: see the [Compatibility](../compatibility.md#version-compatibility) matrix
- The password of the `wazuh-wui` account (`WAZUH_MANAGER_WUI_PASSWORD`)
- API user with appropriate permissions for:
  - Agent management
  - Configuration queries
  - Security operations
  - System monitoring

## Browser requirements

Supported web browsers:

- **Google Chrome**: Latest stable version
- **Mozilla Firefox**: Latest stable version
- **Microsoft Edge**: Latest stable version
- **Safari**: Latest stable version (macOS)

### Browser configuration

- JavaScript enabled
- Cookies enabled
- WebSockets support
- Minimum resolution: 1280x720

## Additional considerations

### Security requirements

- TLS 1.2 or higher for all communications
- Strong authentication mechanisms (passwords, SAML SSO)
- Regular security updates applied

### Performance considerations

- Low-latency network connection to Wazuh indexer (<50ms recommended)
- Dedicated server or VM (not containerized for production)
- Sufficient disk I/O for logging and caching operations
