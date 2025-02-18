import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { THREAT_INTELLIGENCE_ID } from '../../constants';

export const MITRE_ATTACK_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'mitre_attack',
);
export const MITRE_ATTACK_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${MITRE_ATTACK_ID}`,
  {
    defaultMessage: 'MITRE ATT&CK',
  },
);
