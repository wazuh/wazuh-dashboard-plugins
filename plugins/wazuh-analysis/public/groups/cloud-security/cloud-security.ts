import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { PLUGIN_ID } from '../../../common/constants';
import { CATEGORY } from '../category';

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

export const CloudSecurityApp = (_core: CoreSetup): App => ({
  id: CLOUD_SECURITY_ID,
  title: CLOUD_SECURITY_TITLE,
  category: CATEGORY,
  mount:
    async (_params: AppMountParameters) =>
    // TODO: Implement the cloud security application
    () => {},
});
