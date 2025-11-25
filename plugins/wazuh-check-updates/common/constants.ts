export const PLUGIN_ID = 'wazuhCheckUpdates';
export const PLUGIN_NAME = 'wazuh_check_updates';

export const SAVED_OBJECT_UPDATES = 'wazuh-check-updates-available-updates';
export const SAVED_OBJECT_USER_PREFERENCES =
  'wazuh-check-updates-user-preferences';

const ctiBasePath = '/api/wazuh-check-updates/cti-registration';
export enum routes {
  checkUpdates = '/api/wazuh-check-updates/updates',
  userPreferences = '/api/wazuh-check-updates/user-preferences/me',
  subscription = `${ctiBasePath}/subscription`,
  contentUpdate = `${ctiBasePath}/update`,
}

export const ctiSubscriptionRoute = '/api/v1/instances/token';

const wazuhContentManagerBasePath = '_plugins/content-manager';
export const enum contentManagerRoutes {
  subscription = `${wazuhContentManagerBasePath}/subscription`,
  contentUpdate = `${wazuhContentManagerBasePath}/update`,
}
