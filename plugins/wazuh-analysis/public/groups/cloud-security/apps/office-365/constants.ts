import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { CLOUD_SECURITY_ID } from '../../constants';

export const OFFICE365_ID = buildSubAppId(CLOUD_SECURITY_ID, 'office365');
export const OFFICE365_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${OFFICE365_ID}`,
  {
    defaultMessage: 'Office 365',
  },
);
