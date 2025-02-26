import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';

export const ENDPOINT_SECURITY_ID = 'endpoint_security';
export const ENDPOINT_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}`,
  {
    defaultMessage: 'Endpoint Security',
  },
);
export const ENDPOINT_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}.description`,
  {
    defaultMessage:
      'Advanced monitoring and protection for devices against security threats.',
  },
);
