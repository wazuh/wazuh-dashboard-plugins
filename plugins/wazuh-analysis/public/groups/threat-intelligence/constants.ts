import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';

export const THREAT_INTELLIGENCE_ID = 'threat_intelligence';
export const THREAT_INTELLIGENCE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_INTELLIGENCE_ID}.`,
  {
    defaultMessage: 'Threat Intelligence',
  },
);
export const THREAT_INTELLIGENCE_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_INTELLIGENCE_ID}.description`,
  {
    defaultMessage:
      'Collect and analyze information about potential threats to inform security decisions.',
  },
);
