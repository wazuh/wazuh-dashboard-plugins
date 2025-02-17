import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { THREAT_INTELLIGENCE_ID } from '../../constants';

export const THREAT_HUNTING_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'threat_hunting',
);
export const THREAT_HUNTING_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_HUNTING_ID}`,
  {
    defaultMessage: 'Threat Hunting',
  },
);
