import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';
import { buildSubAppId } from '../../utils';

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
export const CONFIGURATION_ASSESSMENT_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'configuration_assessment',
);
export const MALWARE_DETECTION_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'malware_detection',
);
export const FIM_ID = buildSubAppId(ENDPOINT_SECURITY_ID, 'fim');
export const CONFIGURATION_ASSESSMENT_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${CONFIGURATION_ASSESSMENT_ID}`,
  {
    defaultMessage: 'Configuration Assessment',
  },
);
export const MALWARE_DETECTION_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${MALWARE_DETECTION_ID}`,
  {
    defaultMessage: 'Malware Detection',
  },
);
export const FIM_TITLE = i18n.translate(`${PLUGIN_ID}.category.${FIM_ID}`, {
  defaultMessage: 'File Integrity Monitoring',
});
