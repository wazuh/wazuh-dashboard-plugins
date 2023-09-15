export const PLUGIN_ID = 'wazuhCheckUpdates';
export const PLUGIN_NAME = 'wazuh_check_updates';

export const SAVED_OBJECT_UPDATES = 'wazuh-check-updates-available-updates';
export const SAVED_OBJECT_SETTINGS = 'wazuh-check-updates-settings';
export const SAVED_OBJECT_USER_PREFERENCES = 'wazuh-check-updates-user-preferences';

export const DEFAULT_SCHEDULE = '* * * * *';
// export const DEFAULT_SCHEDULE = '0 0 0,12 * *';

export enum routes {
  checkUpdates = '/api/wazuh_check_updates/updates',
  userPreferences = '/api/wazuh_check_updates/user_preferences',
}
