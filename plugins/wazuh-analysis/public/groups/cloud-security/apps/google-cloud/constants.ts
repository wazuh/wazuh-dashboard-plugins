import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { CLOUD_SECURITY_ID } from '../../constants';

export const GOOGLE_CLOUD_ID = buildSubAppId(CLOUD_SECURITY_ID, 'google_cloud');
export const GOOGLE_CLOUD_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GOOGLE_CLOUD_ID}`,
  {
    defaultMessage: 'Google Cloud',
  },
);
