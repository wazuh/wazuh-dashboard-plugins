# Backup and restore

This guide focuses on the assets managed by the Wazuh dashboard itself.

## What to back up

- Dashboard configuration: `/etc/wazuh-dashboard/opensearch_dashboards.yml`
- TLS certificates: `/etc/wazuh-dashboard/certs/`
- Saved objects exported from the UI (dashboards, visualizations, index patterns)
- Custom branding assets (if used):
  `/usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom/images/`

## Export saved objects

1. Open **Dashboard management** > **Dashboards Management** > **Saved objects**.
2. Export the required objects, or use **Export all objects**.

## Restore

1. Reinstall the Wazuh dashboard package on the target host.
2. Restore `opensearch_dashboards.yml` and the certificates directory.
3. Restart the service:

```bash
systemctl restart wazuh-dashboard
```

4. Import saved objects from **Dashboard management** > **Dashboards Management** > **Saved objects**.
