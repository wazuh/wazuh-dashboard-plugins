import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';
import { buildSubAppId } from '../../utils';

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
export const THREAT_HUNTING_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'threat_hunting',
);
export const VULNERABILITY_DETECTION_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'vulnerability_detection',
);
export const MITRE_ATTACK_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'mitre_attack',
);
export const THREAT_HUNTING_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_HUNTING_ID}`,
  {
    defaultMessage: 'Threat Hunting',
  },
);
export const VULNERABILITY_DETECTION_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${VULNERABILITY_DETECTION_ID}`,
  {
    defaultMessage: 'Vulnerability Detection',
  },
);
export const MITRE_ATTACK_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${MITRE_ATTACK_ID}`,
  {
    defaultMessage: 'MITRE ATT&CK',
  },
);
