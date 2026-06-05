# Security

Follow these recommendations to secure a Wazuh dashboard deployment.

## Access control

- Change default credentials for the dashboard and indexer users.
- Use SSO (SAML) and role mapping for administrator and read-only access.
- Limit access to the dashboard host with firewall rules or private networking.

## Transport security

- Use TLS between the dashboard, indexer, and Wazuh server API.
- Store certificates with strict filesystem permissions.

## Operational practices

- Keep packages up to date with Wazuh releases.
- Restrict who can access **Dashboard management** features.
- Review saved objects and notifications channels for sensitive data.
