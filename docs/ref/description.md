# Description

The Wazuh dashboard plugins provide the user interface for exploring Wazuh
data and managing Wazuh server capabilities from OpenSearch Dashboards. The
primary plugin (`main`) delivers the Wazuh application, while auxiliary plugins
(`wazuh-core` and `wazuh-check-updates`) provide shared services and update
notifications.

Key capabilities include:

- Security and compliance dashboards for multiple data sources
- Agent management and enrollment workflows
- Wazuh server configuration and API tooling
- Health checks, notifications, and alerting integrations

These plugins are designed to work with Wazuh 5.x and the compatible
OpenSearch Dashboards version listed in each plugin's `package.json` file.

## Documentation Overview

This repository provides comprehensive documentation for developers and administrators:

### Development Documentation

For developers working on the plugins:

- [Setup Environment](../dev/setup.md) - Toolchain prerequisites and editor configuration
- [Build from Sources](../dev/build-sources.md) - How to build the plugins using Docker
- [Build Image](../dev/build-image.md) - Creating custom Docker development images
- [Build Packages](../dev/build-packages.md) - Generating distribution packages
- [Run from Sources](../dev/run-sources.md) - Running the development environment
- [Run Tests](../dev/run-tests.md) - Executing unit and integration tests
- [Get External Resources](../dev/get-external-resources.md) - Managing external dependencies

### Getting Started

For administrators deploying the plugins:

- [Requirements](getting-started/requirements.md) - System prerequisites and compatibility
- [Packages](getting-started/packages.md) - Available distributions and versions
- [Installation](getting-started/installation.md) - Step-by-step installation guide

### Configuration and Features

- [Configuration](configuration.md) - Plugin settings and customization
- [Single Sign-On](sso.md) - SAML SSO setup with role mapping
- [Custom Branding](custom-branding.md) - UI theming and personalization
- [Agent Deploy One-Liner](agent-deploy-one-liner.md) - Quick agent deployment commands

### Modules

- [Health Check](modules/healthcheck.md) - System health monitoring
- [Normalization](modules/normalization.md) - Data standardization
- [Notifications and Alerting](modules/notifications-alerting.md) - Alert channels and workflows

### Integration and Operations

- [External Integrations](external-integrations.md) - Slack, PagerDuty, Shuffle, Maltiverse
- [Upgrade](upgrade.md) - Version upgrade procedures
- [Migration 4.x to 5.x](migration-4x-5x.md) - Migration guide for major version changes
- [Uninstall](uninstall.md) - Plugin removal procedures
- [Back Up and Restore](backup-restore.md) - Data protection strategies
- [Security](security.md) - Security best practices and hardening
- [Performance](performance.md) - Optimization and tuning guidelines

### Reference

- [Architecture](architecture.md) - Plugin structure and design
- [Compatibility](compatibility.md) - Version compatibility matrix
- [Glossary](glossary.md) - Terminology and definitions

### Troubleshooting

- [Diagnostic Guide](../diag/diagnostic.md) - Common issues and debugging procedures
