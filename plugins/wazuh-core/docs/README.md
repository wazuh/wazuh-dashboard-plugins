# Description

The plugin creates and provides instances of the core functionalities services to be shared with other plugins. They are exposed
through the plugin lifecycle methods.

# Backend

This plugin provides some core services:

- CacheAPIUserAllowRunAs: caches the status of API host internal user allows the run as option
- ManageHosts: manage the API host entries
- ServerAPIClient: communicates with the Wazuh server APIs
- ServerAPIHostEntries: gets information about the API host entries
- UpdateConfigurationFile: updates the configuration file
- UpdateRegistry: updates the registry file

## Frontend

- Utils
- Constants
