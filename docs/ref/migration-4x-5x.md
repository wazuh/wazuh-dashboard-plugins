# Migration guide (4.x to 5.x)

This guide focuses on migrating Wazuh dashboard plugins from 4.x to 5.x. It
assumes you are upgrading the full Wazuh stack to 5.x.

## Pre-migration checklist

- Export saved objects from **Dashboard management** > **Dashboards Management**.
- Back up `/etc/wazuh-dashboard/opensearch_dashboards.yml`.
- Back up `/etc/wazuh-dashboard/certs/`.
- Review the [CHANGELOG](../../CHANGELOG.md) for removed settings and behavior changes.

## Migration steps

1. Upgrade the Wazuh indexer and Wazuh server to 5.x.
2. Upgrade the Wazuh dashboard package to 5.x.
3. Reapply your configuration to `opensearch_dashboards.yml`.
4. Ensure the default route is set to `/app/wz-home`.
5. Import saved objects if needed.

## Notable changes in 5.x

- `wazuh.yml` settings moved to `opensearch_dashboards.yml` and advanced settings.
- Default index pattern is now `wazuh-events*`.
- Several deprecated settings were removed (for example, `customization.*`).
- The legacy App Settings UI was removed; use the Wazuh dashboard settings or
  management sections instead.

## Post-migration validation

- Log in and confirm the Wazuh home app loads.
- Run **Dashboard management** > **Health Check**.
- Verify notifications channels, monitors, and saved objects.

For package upgrade steps, see [Upgrade](upgrade.md).
