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
  contentUpdate = `${ctiBasePath}/update`,
}

/** OAuth 2.0 device authorization grant type (RFC 8628) for CTI Console token polling. */
export const CTI_OAUTH_DEVICE_GRANT_TYPE =
  'urn:ietf:params:oauth:grant-type:device_code';

/**
 * Paths on `WAZUH_CTI_CONSOLE_BASE_URL` (Imposter in dev, real CTI Console in prod).
 * See `docker/imposter/cti/README.md`.
 */
export const ctiConsoleApiPaths = {
  environmentsToken: '/api/v1/platform/environments/token',
} as const;

const WAZUH_CONTENT_MANAGER_BASE_PATH = '/_plugins/content-manager';
export const enum contentManagerRoutes {
  subscription = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/subscription`,
  contentUpdate = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/update`,
}

export const enum statusCodes {
  SUCCESS = 200,
  NOT_FOUND = 404,
}
