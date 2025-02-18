import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { CLOUD_SECURITY_ID } from '../../constants';

export const AWS_ID = buildSubAppId(CLOUD_SECURITY_ID, 'aws');
export const AWS_TITLE = i18n.translate(`${PLUGIN_ID}.category.${AWS_ID}`, {
  defaultMessage: 'AWS',
});
