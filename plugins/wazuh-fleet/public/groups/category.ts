import { i18n } from '@osd/i18n';
import { AppCategory } from 'opensearch-dashboards/public';

export const MANAGEMENT_CATEGORY: AppCategory = Object.freeze({
  id: 'wazuhManagement',
  label: i18n.translate('wazuhManagement.title', {
    defaultMessage: 'Management',
  }),
  order: 5001,
});
