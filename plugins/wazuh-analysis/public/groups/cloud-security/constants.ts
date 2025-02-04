import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';
import { buildSubAppId } from '../../utils';

export const CLOUD_SECURITY_ID = 'cloud_security';
export const CLOUD_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}`,
  {
    defaultMessage: 'Cloud Security',
  },
);
export const CLOUD_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}.description`,
  {
    defaultMessage:
      'Monitoring and protection for cloud environments against security threats.',
  },
);
export const DOCKER_ID = buildSubAppId(CLOUD_SECURITY_ID, 'docker');
export const AWS_ID = buildSubAppId(CLOUD_SECURITY_ID, 'aws');
export const GOOGLE_CLOUD_ID = buildSubAppId(CLOUD_SECURITY_ID, 'google_cloud');
export const GITHUB_ID = buildSubAppId(CLOUD_SECURITY_ID, 'github');
export const OFFICE365_ID = buildSubAppId(CLOUD_SECURITY_ID, 'office365');
export const DOCKER_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${DOCKER_ID}`,
  {
    defaultMessage: 'Docker',
  },
);
export const AWS_TITLE = i18n.translate(`${PLUGIN_ID}.category.${AWS_ID}`, {
  defaultMessage: 'AWS',
});
export const GOOGLE_CLOUD_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GOOGLE_CLOUD_ID}`,
  {
    defaultMessage: 'Google Cloud',
  },
);
export const GITHUB_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GITHUB_ID}`,
  {
    defaultMessage: 'Github',
  },
);
export const OFFICE365_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${OFFICE365_ID}`,
  {
    defaultMessage: 'Office 365',
  },
);
