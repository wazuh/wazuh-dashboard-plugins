import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';

export const SECURITY_OPERATIONS_ID = 'security_operations';
export const SECURITY_OPERATIONS_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}`,
  {
    defaultMessage: 'Security Operations',
  },
);
export const SECURITY_OPERATIONS_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}.description`,
  {
    defaultMessage:
      'Advanced monitoring and protection for devices against security threats.',
  },
);
