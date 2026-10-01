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
- **Current version**: 5.0.0 (rc1)
- **Architecture**: 64-bit Intel/AMD (`amd64`/`x86_64`) and 64-bit ARM (`arm64`/`aarch64`) — see
  the [package name table](#package-name-1) below

## Package contents

The Wazuh dashboard package includes:

### Core components

- **Wazuh plugins**:
  - `wazuh` - Main dashboard application
  - `wazuh-core` - Shared services and utilities
  - `wazuh-check-updates` - Update notification system
  - `wazuh-ai-assistant` - AI assistant chat
- **OpenSearch Dashboards**: Pre-configured base platform
- **Node.js runtime**: Bundled with the package

### Installation paths

- **Application files**: `/usr/share/wazuh-dashboard/` (`root:root`)
- **Configuration files**: `/etc/wazuh-dashboard/`
- **Data directory**: `/usr/share/wazuh-dashboard/data/` (`wazuh-dashboard:wazuh-dashboard 0750`, the
  only part of the installation directory the service user owns)
- **Logs**: systemd journal (`journalctl -u wazuh-dashboard`); the package writes no log files
- **Plugin directory**: `/usr/share/wazuh-dashboard/plugins/`
- **Certificates**: `/etc/wazuh-dashboard/certs/` (issued on a fresh install, see [Credentials](credentials.md#certificates))
- **Credential resolver**: `/usr/share/wazuh-dashboard/bin/resolve-credentials` (`root:root 0750`)
- **Shared credentials library**: `/usr/share/wazuh-dashboard/lib/wazuh-credentials.sh` (`root:root 0644`)
- **Service environment file**: `/etc/default/wazuh-dashboard` (`root:wazuh-dashboard 0640`)
- **Shared credentials file**: `/etc/wazuh/credentials.env` (created by the first Wazuh package on the host, not shipped)

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

- `tar`
- `curl`
- `libcap2-bin`
- `openssl`

### RHEL/CentOS/Fedora

- `libcap`
- `openssl`
- `diffutils`
- `util-linux`

`openssl` issues the dashboard TLS certificates, and `diffutils` (`cmp`) and `util-linux` (`flock`)
are used by the shared credentials library. See [Credentials](credentials.md).

## Package repositories

Official Wazuh repositories:

- **APT repository**: `https://packages.wazuh.com/production/5.x/apt/`
- **Yum repository**: `https://packages.wazuh.com/production/5.x/yum/`
- **GPG key**: `https://packages.wazuh.com/key/GPG-KEY-WAZUH`

## Version scheme

Wazuh dashboard follows semantic versioning:

- **Format**: `<major>.<minor>.<patch>-<revision>`
- **Example**: `5.0.0-1`
  - `5.0.0` - Wazuh version
  - `1` - Package revision

### OpenSearch Dashboards compatibility

Each Wazuh dashboard version is built for a specific OpenSearch Dashboards version:

- **Wazuh 5.0.0**: OpenSearch Dashboards 3.6.0
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

## Download packages

### Package name

| System            | Architecture     | Package name                                       |
| ----------------- | ---------------- | -------------------------------------------------- |
| Debian-based      | 64-bit Intel/AMD | `wazuh-dashboard_<VERSION>-<REVISION>_amd64.deb`   |
| Debian-based      | 64-bit ARM       | `wazuh-dashboard_<VERSION>-<REVISION>_arm64.deb`   |
| RHEL/CentOS-based | 64-bit Intel/AMD | `wazuh-dashboard-<VERSION>-<REVISION>.x86_64.rpm`  |
| RHEL/CentOS-based | 64-bit ARM       | `wazuh-dashboard-<VERSION>-<REVISION>.aarch64.rpm` |

where:

- `VERSION`: app version. e.g. `5.0.0`
- `REVISION`: app revision.
  - For production packages, the revision is usually `1`.
  - For pre-release packages, the revision can be `alpha1`, `alpha2`, `beta1`, `rc1`, etc. e.g. `rc1`
  - For nightly packages, the revision is `latest`.

### Repositories

#### Production

URL: `https://packages.wazuh.com/production/<MAJOR_VERSION>.x/<PACKAGE_MANAGER>/pool/main/w/<PACKAGE_NAME>`

where:

- `<MAJOR_VERSION>`: major version number, e.g. `5`
- `<PACKAGE_MANAGER>`: `apt` (Debian-based) `yum` (RHEL/CentOS-based)
- `<PACKAGE_NAME>`: package name

The `<REVISION>` in the package name for production packages is usually `1`.

Example: `https://packages.wazuh.com/production/5.x/apt/pool/main/w/wazuh-dashboard_5.0.0-1_amd64.deb`

#### Pre-release

URL: `https://packages-staging.xdrsiem.wazuh.info/pre-release/<MAJOR_VERSION>.x/<PACKAGE_MANAGER>/pool/main/w/<PACKAGE_NAME>`

where:

- `<MAJOR_VERSION>`: major version number, e.g. `5`
- `<PACKAGE_MANAGER>`: `apt` (Debian-based) `yum` (RHEL/CentOS-based)
- `<PACKAGE_NAME>`: package name

The `<REVISION>` in the package name for pre-release packages can be `alpha1`, `alpha2`, `beta1`, `rc1`, etc. e.g. `rc1`

Example: `https://packages-staging.xdrsiem.wazuh.info/pre-release/5.x/apt/pool/main/w/wazuh-dashboard_5.0.0-alpha1_amd64.deb`

#### Nightly

URL: `https://packages-staging.xdrsiem.wazuh.info/nightly/<VERSION>/<PACKAGE_MANAGER>/pool/main/w/<PACKAGE_NAME>`

where:

- `<VERSION>`: version number, e.g. `5.0.0`
- `<PACKAGE_MANAGER>`: `apt` (Debian-based) `yum` (RHEL/CentOS-based)
- `<PACKAGE_NAME>`: package name

The `<REVISION>` in the package name for nightly packages is `latest`.

Example: `https://packages-staging.xdrsiem.wazuh.info/nightly/5.0.0/apt/pool/main/w/wazuh-dashboard/wazuh-dashboard_5.0.0-latest_arm64.deb`

#### Nightly backup

URL: `https://packages-staging.xdrsiem.wazuh.info/nightly-backup/<DATE>/<PACKAGE_NAME>`

where:

- `<DATE>`: date representation in `YYYY-MM-DD` format, e.g. `2026-03-27`
- `<PACKAGE_NAME>`: package name

The `<REVISION>` in the package name for nightly backup packages is `latest`.

Example: `https://packages-staging.xdrsiem.wazuh.info/nightly-backup/2026-03-27/wazuh-dashboard_5.0.0-latest_amd64.deb`

### Download the package

```bash
wget <URL>
```

where:

- `<URL>`: is the package URL obtained in the previous step.
