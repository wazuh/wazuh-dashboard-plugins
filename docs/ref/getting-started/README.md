# Getting started

This section guides you through the prerequisites and installation process for
the Wazuh dashboard plugins.

## Quick start

To get started with the Wazuh dashboard, follow these steps in order:

1. **[Requirements](requirements.md)** - Verify your system meets the hardware, platform, and network requirements
2. **[Packages](packages.md)** - Learn about available package formats and distribution methods
3. **[Installation](installation.md)** - Follow step-by-step installation instructions
4. **[Credentials](credentials.md)** - Understand how the packages resolve passwords and TLS certificates

## What you'll need

Before installing:

- A supported Linux distribution and architecture (see [Compatibility](../compatibility.md))
- Enough CPU and RAM (see [Hardware requirements](requirements.md#hardware-requirements))
- Network access to Wazuh indexer and Wazuh manager API
- The `kibanaserver` and `wazuh-internal-client` passwords, when the indexer or the manager runs on another host (see [Credentials](credentials.md))
- Root or sudo privileges

See [Requirements](requirements.md) for detailed specifications.

## Installation paths

Choose your installation method:

### Production deployment

For production environments, use the official installation scripts and procedures.

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

See the [Development documentation](../../dev/README.md) for:

- **[Set up environment](../../dev/setup.md)** - Install toolchain (Git, Node.js, Yarn, Docker)
- **[Build from sources](../../dev/build-sources.md)** - Build plugins inside Docker
- **[Run from sources](../../dev/run-sources.md)** - Launch Docker dev environment with indexer, manager, and optional agents
- **[Run tests](../../dev/run-tests.md)** - Execute unit and integration tests

This Docker-based workflow provides:

- Complete Wazuh stack (indexer, manager, agents)
- Hot reload for plugin development
- Pre-configured development environment
- No need to install OpenSearch Dashboards locally

## After installation

Once installed, configure:

1. **[Configuration](../configuration.md)** - Basic plugin settings and API connections
2. **[Single sign-on](../sso.md)** (optional) - Set up SAML authentication
3. **[Custom branding](../custom-branding/custom-branding.md)** (optional) - Customize the UI appearance
4. **[Security](../security.md)** - Apply security best practices

## Next steps

After initial setup:

- **Deploy agents**: Use the [Agent deploy one-liner](../agent-deploy-one-liner.md) for quick agent deployment
- **Configure integrations**: Set up [External integrations](../external-integrations.md) for notifications (Slack, PagerDuty)
- **Monitor health**: Review [Health Check](../modules/healthcheck.md) module status
- **Backup data**: Follow [Back up and restore](../backup-restore.md) procedures

## Troubleshooting

If you encounter issues during installation or setup:

- Check [Diagnostic guide](../../diag/diagnostic.md)
- Review the service logs with `journalctl -u wazuh-dashboard`
- Verify network connectivity to indexer and manager
- Ensure certificates are properly configured
- If the service does not start, see [When the dashboard does not start](credentials.md#when-the-dashboard-does-not-start)

## Support

For additional help:

- Community forum: https://groups.google.com/g/wazuh
- GitHub issues: https://github.com/wazuh/wazuh-dashboard-plugins/issues
