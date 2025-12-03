export const PLUGIN_ID = 'wazuhCheckUpdates';
export const PLUGIN_NAME = 'wazuh_check_updates';

export const SAVED_OBJECT_UPDATES = 'wazuh-check-updates-available-updates';
export const SAVED_OBJECT_USER_PREFERENCES =
  'wazuh-check-updates-user-preferences';

const ctiBasePath = '/api/wazuh-check-updates/cti-registration';
export enum routes {
  checkUpdates = '/api/wazuh-check-updates/updates',
  userPreferences = '/api/wazuh-check-updates/user-preferences/me',
  token = `${ctiBasePath}/token`,
  subscription = `${ctiBasePath}/subscription`,
  contentUpdate = `${ctiBasePath}/update`,
}

const ctiPath = 'https://console.precti.wazuh.com';
export enum ctiUrls {
  token = `${ctiPath}/api/v1/instances/token`,
}

const WAZUH_CONTENT_MANAGER_BASE_PATH = '/_plugins/content-manager';
export const enum contentManagerRoutes {
  subscription = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/subscription`,
  contentUpdate = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/update`,
}

export const enum statusCodes {
  SUCCESS = 200,
  NOT_FOUND = 404,
}
