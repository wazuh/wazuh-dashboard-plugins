import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';

export const CLOUD_SECURITY_ID = 'cloud_security';
export const CLOUD_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}`,
  {
    defaultMessage: 'Cloud Security',
  },
);
export const CLOUD_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}.description`,
  {
    defaultMessage:
      'Monitoring and protection for cloud environments against security threats.',
  },
);
