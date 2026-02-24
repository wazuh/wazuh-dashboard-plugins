# Single sign-on (SSO)

This guide summarizes how to configure SAML-based SSO for the Wazuh dashboard
with both administrator and read-only access. For IdP-specific steps, use the
official Wazuh documentation referenced below.

## Prerequisites

- Wazuh indexer and Wazuh dashboard installed
- An IdP that supports SAML (Okta, Entra ID, Keycloak, etc)
- Administrator access to the dashboard and indexer security configuration

## Required parameters

The following parameters are required in the Wazuh SSO configuration:

- `idp.metadata_url` or `idp.metadata_file`
- `idp.entity_id`
- `sp.entity_id`
- `kibana_url` (Wazuh dashboard URL)
- `roles_key` (SAML attribute that contains role or group names)
- `exchange_key` (at least 64 characters)

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

## References

- SSO overview: https://documentation.wazuh.com/current/user-manual/user-administration/single-sign-on/index.html
- Administrator role setup: https://documentation.wazuh.com/current/user-manual/user-administration/single-sign-on/administrator/index.html
- Read-only role setup: https://documentation.wazuh.com/current/user-manual/user-administration/single-sign-on/read-only/index.html
