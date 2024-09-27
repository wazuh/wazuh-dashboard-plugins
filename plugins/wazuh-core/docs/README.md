# Description

The plugin creates and provides instances of the core functionalities services to be shared with other plugins. They are exposed
through the plugin lifecycle methods.

# Backend

This plugin provides some core services:

- Configuration: manages the plugins configuration
- ManageHosts: manages the API host entries
  - CacheAPIUserAllowRunAs: caches the status of API host internal user allows the run_as option
- ServerAPIClient: communicates with the Wazuh server APIs
- UpdateRegistry: updates the registry file

## Frontend

- Constants
- Utils
- Configuration: manage the plugins configuration
- Dashboard Security: manage the security related to Wazuh dashboard
- Server Security: manage the security related to Wazuh server
