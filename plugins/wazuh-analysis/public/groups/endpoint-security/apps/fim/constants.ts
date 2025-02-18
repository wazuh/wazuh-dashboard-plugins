import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { ENDPOINT_SECURITY_ID } from '../../constants';

export const FIM_ID = buildSubAppId(ENDPOINT_SECURITY_ID, 'fim');
export const FIM_TITLE = i18n.translate(`${PLUGIN_ID}.category.${FIM_ID}`, {
  defaultMessage: 'File Integrity Monitoring',
});
