import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { SECURITY_OPERATIONS_ID } from '../../constants';

export const INCIDENT_RESPONSE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'incident_response',
);
export const INCIDENT_RESPONSE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${INCIDENT_RESPONSE_ID}`,
  {
    defaultMessage: 'Incident Response',
  },
);
