# Getting Started

This section guides you through the prerequisites and installation process for
the Wazuh dashboard plugins.

## Quick Start

To get started with the Wazuh dashboard, follow these steps in order:

1. **[Requirements](requirements.md)** - Verify your system meets the hardware, platform, and network requirements
2. **[Packages](packages.md)** - Learn about available package formats and distribution methods
3. **[Installation](installation.md)** - Follow step-by-step installation instructions

## What you'll need

Before installing:

- A supported Linux distribution (Debian/Ubuntu/RHEL/CentOS/Fedora)
- Minimum 4 GB RAM and 2 CPU cores (8 GB RAM and 4+ cores recommended for production)
- Network access to Wazuh indexer and Wazuh manager API
- TLS/SSL certificates for HTTPS communication
- Root or sudo privileges

See [Requirements](requirements.md) for detailed specifications.

## Installation paths

Choose your installation method:

### Production deployment

For production environments, follow the official installation guide:
https://documentation.wazuh.com/current/installation-guide/index.html

This includes:

- All-in-one deployment scripts
- Distributed deployment options
- Certificate generation
- Security hardening

### Manual installation

For custom deployments or troubleshooting, see [Installation](installation.md) for:

- Package repository setup
- Manual package installation
- Configuration steps
- Service management

### Development from sources

For developers or testing environments, run the plugins from source code using Docker:

See the [Development Documentation](../../dev/README.md) for:

- **[Setup Environment](../../dev/setup.md)** - Install toolchain (Git, Node.js, Yarn, Docker)
- **[Build from Sources](../../dev/build-sources.md)** - Build plugins inside Docker
- **[Run from Sources](../../dev/run-sources.md)** - Launch Docker dev environment with indexer, manager, and optional agents
- **[Run Tests](../../dev/run-tests.md)** - Execute unit and integration tests

This Docker-based workflow provides:

- Complete Wazuh stack (indexer, manager, agents)
- Hot reload for plugin development
- Pre-configured development environment
- No need to install OpenSearch Dashboards locally

## After installation

Once installed, configure:

1. **[Configuration](../configuration.md)** - Basic plugin settings and API connections
2. **[Single Sign-On](../sso.md)** (optional) - Set up SAML authentication
3. **[Custom Branding](../custom-branding.md)** (optional) - Customize the UI appearance
4. **[Security](../security.md)** - Apply security best practices

## Next steps

After initial setup:

- **Deploy agents**: Use the [Agent Deploy One-Liner](../agent-deploy-one-liner.md) for quick agent deployment
- **Configure integrations**: Set up [External Integrations](../external-integrations.md) for notifications (Slack, PagerDuty)
- **Monitor health**: Review [Health Check](../modules/healthcheck.md) module status
- **Backup data**: Follow [Back Up and Restore](../backup-restore.md) procedures

## Troubleshooting

If you encounter issues during installation or setup:

- Check [Diagnostic Guide](../../diag/diagnostic.md)
- Review log files at `/var/log/wazuh-dashboard/`
- Verify network connectivity to indexer and manager
- Ensure certificates are properly configured

## Support

For additional help:

- Official documentation: https://documentation.wazuh.com/
- Community forum: https://groups.google.com/g/wazuh
- GitHub issues: https://github.com/wazuh/wazuh-dashboard-plugins/issues
