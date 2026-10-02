# Description

The Wazuh dashboard plugins provide the user interface for exploring Wazuh
data and managing Wazuh server capabilities from OpenSearch Dashboards. The
primary plugin (`main`) delivers the Wazuh application, while auxiliary plugins
(`wazuh-core`, `wazuh-check-updates` and `wazuh-ai-assistant`) provide shared
services, update notifications and the AI assistant.

Key capabilities include:

- Security and compliance dashboards for multiple data sources
- Agent management and enrollment workflows
- Wazuh server configuration and API tooling
- Health checks, notifications, and alerting integrations

These plugins are designed to work with Wazuh 5.x and the compatible
OpenSearch Dashboards version listed in each plugin's `package.json` file.

## Documentation overview

This repository provides comprehensive documentation for developers and administrators:

### Development documentation

For developers working on the plugins:

- [Set up environment](../dev/setup.md) - Toolchain prerequisites and editor configuration
- [Build from sources](../dev/build-sources.md) - How to build the plugins using Docker
- [Build image](../dev/build-image.md) - Creating custom Docker development images
- [Build packages](../dev/build-packages.md) - Generating distribution packages
- [Run from sources](../dev/run-sources.md) - Running the development environment
- [Run tests](../dev/run-tests.md) - Executing unit and integration tests
- [Get External Resources](../dev/get-external-resources.md) - Managing external dependencies

### Getting started

For administrators deploying the plugins:

- [Requirements](getting-started/requirements.md) - System prerequisites and compatibility
- [Packages](getting-started/packages.md) - Available distributions and versions
- [Installation](getting-started/installation.md) - Step-by-step installation guide

### Configuration and features

- [Configuration](configuration.md) - Plugin settings and customization
- [Single sign-on](sso.md) - SAML SSO setup with role mapping
- [Custom branding](./custom-branding/custom-branding.md) - UI theming and personalization
- [Agent deploy one-liner](agent-deploy-one-liner.md) - Quick agent deployment commands

### Modules

- [Health Check](modules/healthcheck.md) - System health monitoring
- [Notifications and Alerting](modules/notifications-alerting.md) - Alert channels and workflows
- [Indexer management settings](modules/indexer-settings.md) - Wazuh indexer configuration from the dashboard
- [Enrollment tokens](modules/enrollment-tokens/README.md) - Agent enrollment token management
- [Available updates](modules/available-updates.md) - New-version notifications
- [Active Response](modules/active-response/README.md) - Trigger and monitor active responses
- [Ruleset management](modules/ruleset-management/README.md) - Normalization and detection rules
- [AI Assistant](modules/ai-assistant/README.md) - AI-powered chat over Wazuh data
- [Case Management](modules/case-management/README.md) - Investigation case tracking
- [Incident Response](modules/incident-response/README.md) - Incident response workflows

### Integration and operations

- [External integrations](external-integrations.md) - Slack, PagerDuty, Shuffle
- [Upgrade](upgrade.md) - Version upgrade procedures
- [Migration 4.x to 5.x](migration-4x-5x.md) - Migration guide for major version changes
- [Uninstall](uninstall.md) - Plugin removal procedures
- [Back up and restore](backup-restore.md) - Data protection strategies
- [Security](security.md) - Security best practices and hardening
- [Performance](performance.md) - Optimization and tuning guidelines

### Reference

- [Architecture](architecture.md) - Plugin structure and design
- [Compatibility](compatibility.md) - Version compatibility matrix
- [Glossary](glossary.md) - Terminology and definitions

### Troubleshooting

- [Diagnostic guide](../diag/diagnostic.md) - Common issues and debugging procedures
