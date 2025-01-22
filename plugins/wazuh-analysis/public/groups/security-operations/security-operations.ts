import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { PLUGIN_ID } from '../../../common/constants';
import { CATEGORY } from '../category';

export const SECURITY_OPERATIONS_ID = 'security_operations';
export const SECURITY_OPERATIONS_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}`,
  {
    defaultMessage: 'Security Operations',
  },
);
export const SECURITY_OPERATIONS_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}.description`,
  {
    defaultMessage:
      'Advanced monitoring and protection for devices against security threats.',
  },
);

export const SecurityOperationsApp = (_core: CoreSetup): App => ({
  id: SECURITY_OPERATIONS_ID,
  title: SECURITY_OPERATIONS_TITLE,
  category: CATEGORY,
  mount:
    async (_params: AppMountParameters) =>
    // TODO: Implement the security operations application
    () => {},
});
