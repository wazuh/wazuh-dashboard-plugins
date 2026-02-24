# Packages

Wazuh dashboard is distributed as system packages and is installed from the
official Wazuh repositories.

## Package formats

Two package formats are available:

### DEB (Debian-based distributions)

- **File pattern**: `wazuh-dashboard_<version>-<revision>_amd64.deb`
- **Example**: `wazuh-dashboard_5.0.0-1_amd64.deb`
- **Supported distributions**: Debian, Ubuntu
- **Package manager**: `apt`, `apt-get`, `dpkg`

### RPM (Red Hat-based distributions)

- **File pattern**: `wazuh-dashboard-<version>-<revision>.x86_64.rpm`
- **Example**: `wazuh-dashboard-5.0.0-1.x86_64.rpm`
- **Supported distributions**: RHEL, CentOS, Fedora, Amazon Linux
- **Package manager**: `yum`, `dnf`, `rpm`

## Package name

- **Package name**: `wazuh-dashboard`
- **Current version**: 5.0.0 (alpha0)
- **Architecture**: x86_64 (amd64)

## Package contents

The Wazuh dashboard package includes:

### Core components

- **Wazuh plugins**:
  - `wazuh` - Main dashboard application
  - `wazuh-core` - Shared services and utilities
  - `wazuh-check-updates` - Update notification system
- **OpenSearch Dashboards**: Pre-configured base platform
- **Node.js runtime**: Bundled with the package

### Installation paths

- **Application files**: `/usr/share/wazuh-dashboard/`
- **Configuration files**: `/etc/wazuh-dashboard/`
- **Data directory**: `/var/lib/wazuh-dashboard/`
- **Log files**: `/var/log/wazuh-dashboard/`
- **Plugin directory**: `/usr/share/wazuh-dashboard/plugins/`
- **Certificates**: `/etc/wazuh-dashboard/certs/`

### System integration

- **User**: `wazuh-dashboard`
- **Group**: `wazuh-dashboard`
- **Service**: `wazuh-dashboard.service` (systemd)
- **Init script**: `/etc/init.d/wazuh-dashboard` (SysV init)

## Package size

- **Compressed package**: ~370 MB
- **Installed size**: ~1.2 GB (including dependencies and node modules)

## Package dependencies

Automatically installed dependencies:

### Debian/Ubuntu

- `debhelper` (>= 9)
- `tar`
- `curl`
- `libcap2-bin`

### RHEL/CentOS/Fedora

- `libcap`

## Package repositories

Official Wazuh repositories:

- **APT repository**: `https://packages.wazuh.com/5.x/apt/`
- **Yum repository**: `https://packages.wazuh.com/5.x/yum/`
- **GPG key**: `https://packages.wazuh.com/key/GPG-KEY-WAZUH`

## Version scheme

Wazuh dashboard follows semantic versioning:

- **Format**: `<major>.<minor>.<patch>-<revision>`
- **Example**: `5.0.0-1`
  - `5.0.0` - Wazuh version
  - `1` - Package revision

### OpenSearch Dashboards compatibility

Each Wazuh dashboard version is built for a specific OpenSearch Dashboards version:

- **Wazuh 5.0.0**: OpenSearch Dashboards 3.3.0
- Check `plugins/wazuh-core/package.json` for exact platform version

## Installation methods

Packages can be installed via:

1. **Official repositories** (recommended):

   - Automatic dependency resolution
   - Easy updates with package manager
   - GPG signature verification

2. **Direct package download**:

   - From https://packages.wazuh.com/
   - Manual dependency management required

3. **Air-gapped environments**:
   - Download package and dependencies offline
   - Transfer to target system
   - Install using local package manager

The installation steps and repository configuration are documented in the
installation guide:
https://documentation.wazuh.com/current/installation-guide/wazuh-dashboard/index.html

## Package verification

Verify package integrity:

```bash
# Verify GPG signature (DEB)
dpkg-sig --verify wazuh-dashboard_5.0.0-1_amd64.deb

# Verify GPG signature (RPM)
rpm --checksig wazuh-dashboard-5.0.0-1.x86_64.rpm

# Check package contents
dpkg -c wazuh-dashboard_5.0.0-1_amd64.deb  # DEB
rpm -qlp wazuh-dashboard-5.0.0-1.x86_64.rpm  # RPM
```
