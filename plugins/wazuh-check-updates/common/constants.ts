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
  ctiRegistrationStatus = `${ctiBasePath}/status`,
  contentUpdate = `${ctiBasePath}/update`,
}

/** OAuth 2.0 device authorization grant type (RFC 8628) for CTI Console token polling. */
export const CTI_OAUTH_DEVICE_GRANT_TYPE =
  'urn:ietf:params:oauth:grant-type:device_code';

const SECONDS_PER_MINUTE = 60;

/** Default poll interval when the device response omits `interval` (RFC 8628 minimum is 5). */
export const CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC = 5;

/** Seconds added to the poll interval after a `slow_down` response (RFC 8628). */
export const CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC = 5;

/** Minimum clamp for device-token poll interval (seconds). */
export const CTI_MIN_DEVICE_POLL_INTERVAL_SEC = 1;

/** Maximum clamp for device-token poll interval: 24 hours (defensive limit for bogus `interval`). */
export const CTI_MAX_DEVICE_POLL_INTERVAL_SEC = 24 * 60 * SECONDS_PER_MINUTE;

/** Default `expires_in` for the device code when the server omits it (30 min, typical in spec examples). */
export const CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC = 30 * SECONDS_PER_MINUTE;

/**
 * Body returned to the browser on successful device-token poll.
 * Upstream `access_token` / `refresh_token` / etc. stay server-side only.
 */
export const CTI_REGISTRATION_COMPLETED_BODY = { success: true } as const;

/** Shown as `message` and in the success modal (i18n `successDetail` default). */
export const CTI_REGISTRATION_SUCCESS_STATUS_MESSAGE =
  'This environment is registered for CTI updates. You will be notified about relevant changes when they are available.';

/**
 * Paths appended to `WAZUH_CTI_CONSOLE_BASE_URL` (e.g. Wazuh Cloud API or local Imposter).
 * See `docker/imposter/cti/README.md` for the offline mock contract.
 */
export const ctiConsoleApiPaths = {
  environmentsToken: '/api/v1/platform/environments/token',
} as const;

/** Content Manager plugin HTTP path prefix (cluster plugin / Imposter mock). */
const WAZUH_CONTENT_MANAGER_BASE_PATH = '/_plugins/_content_manager';

/** Relative paths appended to `WAZUH_CONTENT_MANAGER_BASE_URL` (server-side only). */
export const enum contentManagerRoutes {
  subscription = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/subscription`,
  contentUpdate = `${WAZUH_CONTENT_MANAGER_BASE_PATH}/update`,
}

export const enum statusCodes {
  SUCCESS = 200,
  NOT_FOUND = 404,
  /** OAuth terminal errors (access_denied, expired_token, etc.) after device flow. */
  REGISTRATION_FAILED = 460,
}
