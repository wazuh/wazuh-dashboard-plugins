export const PLUGIN_ID = 'wazuhCheckUpdates';
export const PLUGIN_NAME = 'wazuh_check_updates';

export const SAVED_OBJECT_UPDATES = 'wazuh-check-updates-available-updates';
export const SAVED_OBJECT_USER_PREFERENCES = 'wazuh-check-updates-user-preferences';

export enum routes {
  checkUpdates = '/api/wazuh-check-updates/updates',
  userPreferences = '/api/wazuh-check-updates/user-preferences/me',
}
