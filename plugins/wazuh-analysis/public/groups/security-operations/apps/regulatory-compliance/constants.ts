import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { SECURITY_OPERATIONS_ID } from '../../constants';

export const REGULATORY_COMPLIANCE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'regulatory_compliance',
);
export const REGULATORY_COMPLIANCE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${REGULATORY_COMPLIANCE_ID}`,
  {
    defaultMessage: 'Regulatory Compliance',
  },
);
