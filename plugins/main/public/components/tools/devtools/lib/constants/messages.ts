import { i18n } from '@osd/i18n';

/**
 * User-facing messages (centralized for i18n and consistency).
 */
export const MESSAGES = {
  WELCOME: i18n.translate('wazuh.devTools.console.welcome', {
    defaultMessage: 'Welcome!',
  }),
  ERROR_PARSING_JSON: i18n.translate(
    'wazuh.devTools.console.errorParsingJson',
    { defaultMessage: 'Error parsing JSON query' },
  ),
  INSUFFICIENT_PERMISSIONS: i18n.translate(
    'wazuh.devTools.console.insufficientPermissions',
    { defaultMessage: 'Insufficient permissions to execute this method' },
  ),
  INSUFFICIENT_PERMISSIONS_SHORT: i18n.translate(
    'wazuh.devTools.console.insufficientPermissionsStatus',
    { defaultMessage: 'Forbidden: insufficient permissions' },
  ),
} as const;
