# Requirements

## Hardware requirements

### Minimum specifications

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk space**: 2 GB of free space

### Recommended specifications

For production environments:

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk space**: 10+ GB of free space
- **Network**: 1 Gbps network interface

> **Note**: Hardware requirements may vary based on the number of monitored agents, data retention policies, and dashboard usage patterns.

## Platform requirements

### Operating system

Supported Linux distributions:

- **Debian-based** (DEB packages):
  - Debian 10, 11, 12
  - Ubuntu 18.04, 20.04, 22.04, 24.04
- **Red Hat-based** (RPM packages):
  - RHEL 7, 8, 9
  - CentOS 7, 8
  - Amazon Linux 2, 2023
  - Fedora 34+

### System privileges

- Root or sudo privileges to install packages and manage services. The package itself creates
  `/usr/share/wazuh-dashboard/` and `/etc/wazuh-dashboard/` as `root:root` (only
  `/usr/share/wazuh-dashboard/data/` is owned by the `wazuh-dashboard` service user) — do not
  grant broader write access to these paths afterward. See [Security](../security.md#operational-practices).

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

- Version compatibility: OpenSearch 3.6.0 (the `opensearch` value in `buildSrc/version.properties` at the `wazuh-indexer` repository)
- Connection type: HTTPS with TLS certificate verification
- Required permissions: Read and write access to Wazuh indices
- The password of the `kibanaserver` account (`WAZUH_INDEXER_KIBANASERVER_PASSWORD`)

### Wazuh manager API

- Version compatibility: Wazuh 5.x
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
