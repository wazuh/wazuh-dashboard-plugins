# Custom branding

This guide summarizes how to replace logos and branding assets in the Wazuh
dashboard. Use the Wazuh documentation for full details and screenshots.

## Dashboard loading and header logos

Edit `opensearch_dashboards.yml` and set the branding URLs:

```yml
opensearchDashboards.branding:
  loadingLogo:
    defaultUrl: 'https://domain.org/default-logo.png'
    darkModeUrl: 'https://domain.org/dark-mode-logo.png'
  mark:
    defaultUrl: 'https://domain.org/default-logo.png'
    darkModeUrl: 'https://domain.org/dark-mode-logo.png'
```

Restart the service after changes:

```bash
systemctl restart wazuh-dashboard
```

## Wazuh app custom logos

If the App Settings UI is available in your build:

1. Open **Dashboard management** > **App Settings**.
2. Set the following properties in the Custom branding section:

- `customization.logo.app`
- `customization.logo.healthcheck`
- `customization.logo.reports`

Assets are stored in:
`/usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom/images/`

> Note: In-file `customization.logo.*` settings are deprecated. Use the UI to
> update these values. If the App Settings UI is not present in your version,
> rely on the `opensearchDashboards.branding` settings only.

## PDF reports branding

In **Dashboard management** > **App Settings**, configure:

- `customization.logo.reports`
- `customization.reports.footer`
- `customization.reports.header`

## References

- Custom branding documentation: https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/custom-branding.html
