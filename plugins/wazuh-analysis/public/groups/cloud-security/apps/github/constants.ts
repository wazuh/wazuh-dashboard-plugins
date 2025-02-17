import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { CLOUD_SECURITY_ID } from '../../constants';

export const GITHUB_ID = buildSubAppId(CLOUD_SECURITY_ID, 'github');
export const GITHUB_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GITHUB_ID}`,
  {
    defaultMessage: 'Github',
  },
);
