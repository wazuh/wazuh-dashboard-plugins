# Security

Follow these recommendations to secure a Wazuh dashboard deployment.

## Access control

- Do not keep a default or publicly known password on any indexer or Server API account. The
  `kibanaserver` and `wazuh-wui` passwords the dashboard uses are not shipped defaults: they come
  from `/etc/wazuh/credentials.env` and are stored in the dashboard keystore. See
  [Credentials](getting-started/credentials.md).
- Delete `/etc/wazuh/credentials.env` once every Wazuh component is installed and running: it holds
  every plaintext password in the deployment.
- Keep passwords in the keystore rather than in `opensearch_dashboards.yml`.
- Use SSO (SAML) and role mapping for administrator and read-only access.
- Limit access to the dashboard host with firewall rules or private networking.

## Transport security

- Use TLS between the dashboard, indexer, and Wazuh server API.
- Store certificates with strict filesystem permissions. Certificates issued by the package use
  `0500` for `/etc/wazuh-dashboard/certs/` and `0400` for its files.
- In multi-host deployments, issue every component's certificates from one CA. A bootstrap CA
  created by a package trusts only its own host.
- Do not leave a CA private key (`/etc/wazuh/ca/root-ca.key`) on a host that does not need to sign
  certificates.
- Before publishing a container image built by installing the package, run
  `/usr/share/wazuh-dashboard/bin/resolve-credentials --clear` so the image ships no credentials,
  keys or certificates. See [Container images](getting-started/credentials.md#container-images).

## Operational practices

- Keep packages up to date with Wazuh releases.
- Restrict who can access **Dashboard management** features.
- Review saved objects and notifications channels for sensitive data.
