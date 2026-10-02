# Single sign-on (SSO)

This guide summarizes how to configure SAML-based SSO for the Wazuh dashboard with both administrator and read-only access. For IdP-specific steps, use the official web Wazuh documentation.

## Prerequisites

- Wazuh indexer and Wazuh dashboard installed
- An IdP that supports SAML (Okta, Entra ID, Keycloak, etc)
- Administrator access to the dashboard and indexer security configuration

## Required parameters

The following parameters are required in the Wazuh SSO configuration:

| Parameter           | Description                                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idp.metadata_url`  | URL to an XML file that contains metadata information about the application configured on the IdP side. It can be used instead of `idp.metadata_file`.                                                                                        |
| `idp.metadata_file` | XML file that contains the metadata information about the application configured on the IdP side. It can be used instead of `idp.metadata_url`.                                                                                               |
| `idp.entity_id`     | Entity ID of the Identity Provider. This is a unique value assigned to an Identity Provider.                                                                                                                                                  |
| `sp.entity_id`      | Entity ID of the Service Provider. This is a unique value assigned to a Service Provider.                                                                                                                                                     |
| `kibana_url`        | URL to access the Wazuh dashboard.                                                                                                                                                                                                            |
| `roles_key`         | The attribute in the SAML assertion where the roles/groups are sent.                                                                                                                                                                          |
| `exchange_key`      | The shared secret used to sign the internal JWT the security plugin issues after a successful SAML login — not the SAML assertion itself, which the IdP signs. The JWT is signed with HS512, so use a random value of at least 64 characters. |

## Configuration example

The following `config.yml` snippet, from the Keycloak-backed SAML dev environment
(`docker/osd-dev/config/os/config-saml.yml` in this repository, used when running
`./dev.sh up -saml`), shows a working `saml_auth` authentication domain for the Wazuh indexer's
security plugin:

```yaml
_meta:
  type: 'config'
  config_version: 2

config:
  dynamic:
    http:
      anonymous_auth_enabled: false
    authc:
      internal_auth:
        order: 0
        http_enabled: true
        transport_enabled: true
        http_authenticator:
          type: basic
          challenge: false
        authentication_backend:
          type: internal
      saml_auth:
        order: 1
        http_enabled: true
        transport_enabled: false
        http_authenticator:
          type: saml
          challenge: true
          config:
            idp:
              metadata_url: http://idp:8080/realms/wazuh/protocol/saml/descriptor
              entity_id: http://idp:8080/realms/wazuh
            sp:
              entity_id: wazuh
              signature_private_key_filepath: 'certs/admin-key.pem'
            kibana_url: https://localhost:5601
            roles_key: Role
            exchange_key: 1a2a3a4a5a6a7a8a9a0a1b2b3b4b5b6b
        authentication_backend:
          type: noop
```

The example is for development only. Its 32-character `exchange_key` is shorter than the
recommended 64 characters (the security plugin pads short keys instead of rejecting them), and
`sp.signature_private_key_filepath` reuses the indexer admin certificate key. In production,
generate a dedicated random `exchange_key` and a dedicated key pair for signing SAML requests.

Keep `internal_auth` (lower `order`) alongside `saml_auth` so the internal admin user can still
sign in directly if the IdP is unreachable. On the Wazuh dashboard side,
`opensearch_security.auth.type: 'saml'` and the ACS/logout paths must be added to
`server.xsrf.allowlist` in `opensearch_dashboards.yml` (see
`docker/osd-dev/config/osd/opensearch_dashboards_saml.yml` for a full example), otherwise the
IdP's POST to the assertion consumer service is rejected as a cross-site request.

## High-level setup

1. Create two groups in the IdP (for example, `wazuh-admin` and `wazuh-readonly`).
2. Configure the SAML application in the IdP using the SP metadata from the
   Wazuh indexer security plugin.
3. Configure SAML settings for the Wazuh dashboard and indexer security plugin
   with the required parameters listed above.
4. Map the IdP groups to OpenSearch security roles:
   - One role with full access to the Wazuh dashboard.
   - One role limited to read-only access.
5. Apply the security configuration changes (for example, using the
   `securityadmin` script) and restart the services if required.
6. Validate both roles by signing in through the IdP and verifying access.

## Notes

> - Group and role names used in this guide can be changed. They do not necessarily have to match the ones used here.
> - OpenSearch and the SAML assertion are case sensitive. Values on the IdP and in the SAML configuration of the Wazuh indexer must match exactly.
> - Clear the browser cache and cookies before carrying out the integration.
> - The `securityadmin` script must be executed with root user privileges.
> - Each group generated in the IdP can only be used as one `backend_role`. If other roles such as read-only are needed, create a new group for each.
> - You need an account with administrator privileges on the Wazuh dashboard.
