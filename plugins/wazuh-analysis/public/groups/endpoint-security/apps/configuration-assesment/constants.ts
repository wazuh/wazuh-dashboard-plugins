import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { ENDPOINT_SECURITY_ID } from '../../constants';

export const CONFIGURATION_ASSESSMENT_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'configuration_assessment',
);
export const CONFIGURATION_ASSESSMENT_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${CONFIGURATION_ASSESSMENT_ID}`,
  {
    defaultMessage: 'Configuration Assessment',
  },
);
