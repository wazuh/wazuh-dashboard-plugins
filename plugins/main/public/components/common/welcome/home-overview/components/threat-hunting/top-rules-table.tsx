import { createTopNTable } from '../common';
import { homeOverviewI18n } from '../../i18n';

export const TopRulesTable = createTopNTable({
  keyColumnName: homeOverviewI18n.top5Rules,
  noItemsMessage: homeOverviewI18n.noRulesTriggered,
  'data-test-subj': 'top-rules-table',
});
