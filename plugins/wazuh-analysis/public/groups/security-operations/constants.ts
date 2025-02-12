import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';
import { buildSubAppId } from '../../utils';

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
export const REGULATORY_COMPLIANCE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'regulatory_compliance',
);
export const IT_HYGIENE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'it_hygiene',
);
export const REGULATORY_COMPLIANCE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${REGULATORY_COMPLIANCE_ID}`,
  {
    defaultMessage: 'Regulatory Compliance',
  },
);
export const IT_HYGIENE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${IT_HYGIENE_ID}`,
  {
    defaultMessage: 'IT Hygiene',
  },
);
