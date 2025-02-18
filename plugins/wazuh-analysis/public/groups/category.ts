import { AppCategory } from 'opensearch-dashboards/public';
import { ANALYSIS_PLUGIN_TITLE, PLUGIN_ID } from '../../common/constants';

export const CATEGORY: AppCategory = Object.freeze({
  id: PLUGIN_ID,
  label: ANALYSIS_PLUGIN_TITLE,
  order: 5000,
});
