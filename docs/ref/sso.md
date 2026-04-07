# Single sign-on (SSO)

This guide summarizes how to configure SAML-based SSO for the Wazuh dashboard with both administrator and read-only access. For IdP-specific steps, use the official web Wazuh documentation.

## Prerequisites

- Wazuh indexer and Wazuh dashboard installed
- An IdP that supports SAML (Okta, Entra ID, Keycloak, etc)
- Administrator access to the dashboard and indexer security configuration

## Required parameters

The following parameters are required in the Wazuh SSO configuration:

| Parameter | Description |
|-----------|-------------|
| `idp.metadata_url` | URL to an XML file that contains metadata information about the application configured on the IdP side. It can be used instead of `idp.metadata_file`. |
| `idp.metadata_file` | XML file that contains the metadata information about the application configured on the IdP side. It can be used instead of `idp.metadata_url`. |
| `idp.entity_id` | Entity ID of the Identity Provider. This is a unique value assigned to an Identity Provider. |
| `sp.entity_id` | Entity ID of the Service Provider. This is a unique value assigned to a Service Provider. |
| `kibana_url` | URL to access the Wazuh dashboard. |
| `roles_key` | The attribute in the SAML assertion where the roles/groups are sent. |
| `exchange_key` | The key that will be used to sign the assertions. It must have at least 64 characters. |

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
