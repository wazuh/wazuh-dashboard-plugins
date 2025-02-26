import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { CLOUD_SECURITY_ID } from '../../constants';

export const DOCKER_ID = buildSubAppId(CLOUD_SECURITY_ID, 'docker');
export const DOCKER_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${DOCKER_ID}`,
  {
    defaultMessage: 'Docker',
  },
);
