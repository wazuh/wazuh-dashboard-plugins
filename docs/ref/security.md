# Security

Follow these recommendations to secure a Wazuh dashboard deployment.

## Access control

- Do not keep a default or publicly known password on any indexer or Server API account. The
  `kibanaserver` and `wazuh-internal-client` passwords the dashboard uses are not shipped defaults: they come
  from the peers' `export/credentials.env` or from `/etc/wazuh-dashboard/local.env`, and are stored
  in the dashboard keystore. See [Credentials](getting-started/credentials.md).
- Once the dashboard has started, remove the passwords from `/etc/wazuh-dashboard/local.env`: the
  keystore already holds them.
- Keep passwords in the keystore rather than in `opensearch_dashboards.yml`.
- Use SSO (SAML) and role mapping for administrator and read-only access.
- Limit access to the dashboard host with firewall rules or private networking.

## Transport security

- Use TLS between the dashboard, indexer, and Wazuh server API.
- Store certificates with strict filesystem permissions. The package keeps
  `/etc/wazuh-dashboard/certs/` as `root:wazuh-dashboard 0750` with files `0640`, and the dashboard
  CA in `/etc/wazuh-dashboard/ca/` as `root:root 0700`. The service account can write nothing
  under `/etc/wazuh-dashboard/`.
- Each peer is verified with its own CA (`certs/indexer-ca.pem`, `certs/manager-ca.pem`), never
  with a merged bundle. In multi-host deployments, copy each peer's `export/ca.pem`, never its
  private key. See [Dashboard on a separate host](getting-started/installation.md#dashboard-on-a-separate-host).
- Keep `wazuh_core.hosts.<name>.ca` set on every manager API host: without it, the server
  certificate is not verified.
- Before publishing a container image built by installing the package, run
  `/usr/share/wazuh-dashboard/bin/resolve-credentials --clear` so the image ships no credentials,
  keys or certificates. See [Container images](getting-started/credentials.md#container-images).

## Access control (RBAC and API permissions)

- `wazuh_core.hosts.<name>.run_as` controls whether the Server API request runs under the calling
  user's own context instead of the configured account — see
  [Define Wazuh server hosts](configuration.md#define-wazuh-server-hosts).
- Fine-grained manager API permissions (for example `enrollment_token:create`,
  `enrollment_token:read`, `enrollment_token:delete`) are enforced by the manager's own RBAC, not
  the dashboard — see [Enrollment tokens](modules/enrollment-tokens/README.md#permissions).
- `wazuh.disabledSettings` and `opensearch_security_analytics.disabledSettings` hide specific
  indexer/Ruleset Management settings from the UI without changing the indexer's own RBAC — see
  [Configuration](configuration.md#file).
- The AI Assistant has its own encryption-at-rest and settings-lock controls
  (`wazuh_ai_assistant.encryptionKey`, `wazuh_ai_assistant.settingsReadOnly`) — see
  [AI Assistant Security](modules/ai-assistant/security.md#api-key-encryption-at-rest).

## Cookies, headers, and cross-origin requests

- The session cookie's name, encryption key, `secure` flag, and `SameSite` policy come from the
  security plugin's `opensearch_security.cookie.{name,password,secure,isSameSite}` settings —
  keep `password` a long random value and `secure` enabled whenever the dashboard is served over
  HTTPS (the default). The packages generate a random `password` into the keystore on each
  installation; nodes behind a load balancer must share one value, see
  [Session cookie password](getting-started/credentials.md#session-cookie-password).
- `server.customResponseHeaders` in `opensearch_dashboards.yml` adds arbitrary response headers
  (for example a stricter `Content-Security-Policy` or `Strict-Transport-Security`) without
  changing dashboard code.
- `server.xsrf.disableProtection` (default `false`) and `server.xsrf.allowlist` control OSD's
  built-in XSRF protection; only allowlist a path if it must be called without the `osd-xsrf`
  header (most Wazuh dashboard routes don't need to). The older `server.xsrf.whitelist` name is
  deprecated and renamed to `server.xsrf.allowlist`.
- `server.cors` is a boolean, `false` by default. There is no allowed-origin list: setting it to
  `true` enables Cross-Origin Resource Sharing with the server's default policy, so leave it
  disabled unless another trusted site must call the dashboard's API.

## Operational practices

- Keep packages up to date with Wazuh releases.
- Restrict who can access **Dashboard management** features.
- Review saved objects and notifications channels for sensitive data.
- Do not give the `wazuh-dashboard` user ownership of `/usr/share/wazuh-dashboard/` or
  `/etc/default/wazuh-dashboard`. Root runs code from the first and reads the second at every
  start, so the packages install them as `root:root` and `root:wazuh-dashboard 0640`. Only
  `/usr/share/wazuh-dashboard/data/` belongs to the service user. If you create
  `/etc/sysconfig/wazuh-dashboard`, which the service also reads, give it the same
  `root:wazuh-dashboard 0640`.
