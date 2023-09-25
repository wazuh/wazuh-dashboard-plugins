import path from 'path';

export const PLUGIN_ID = 'wazuhCheckUpdates';
export const PLUGIN_NAME = 'wazuh_check_updates';

export const SAVED_OBJECT_UPDATES = 'wazuh-check-updates-available-updates';
export const SAVED_OBJECT_SETTINGS = 'wazuh-check-updates-settings';
export const SAVED_OBJECT_USER_PREFERENCES = 'wazuh-check-updates-user-preferences';

export const DEFAULT_SCHEDULE = '* */12 * * *';

export enum routes {
  checkUpdates = '/api/wazuh-check-updates/updates',
  userPreferences = '/api/wazuh-check-updates/user-preferences',
}

// Security
export const WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY =
  'OpenSearch Dashboards Security';

// Default Elasticsearch user name context
export const ELASTIC_NAME = 'elastic';

// Wazuh data path
const WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH = 'data';
export const WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH = path.join(
  __dirname,
  '../../../',
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH
);
export const WAZUH_DATA_ABSOLUTE_PATH = path.join(
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH,
  'wazuh'
);

// Wazuh data path - config
export const WAZUH_DATA_CONFIG_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'config');
export const WAZUH_DATA_CONFIG_APP_PATH = path.join(WAZUH_DATA_CONFIG_DIRECTORY_PATH, 'wazuh.yml');

// Wazuh data path - logs
export const MAX_MB_LOG_FILES = 100;
export const WAZUH_DATA_LOGS_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'logs');
export const WAZUH_DATA_LOGS_PLAIN_FILENAME = 'wazuhapp-plain.log';
export const WAZUH_DATA_LOGS_RAW_FILENAME = 'wazuhapp.log';

// App configuration
export const WAZUH_CONFIGURATION_CACHE_TIME = 10000; // time in ms;
