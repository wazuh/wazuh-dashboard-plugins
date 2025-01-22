import { AppCategory } from 'opensearch-dashboards/public';
import { PLUGIN_ID } from '../../common/constants';
import { ANALYSIS_PLUGIN_TITLE } from '../../common/i18n';

export const CATEGORY: AppCategory = Object.freeze({
  id: PLUGIN_ID,
  label: ANALYSIS_PLUGIN_TITLE,
  order: 5000,
});
