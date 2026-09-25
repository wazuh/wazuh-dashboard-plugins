import { i18n } from '@osd/i18n';
import { createTopNTable } from '../common';

export const TopRulesTable = createTopNTable({
  keyColumnName: i18n.translate(
    'wazuh.common.homeOverviewThreatHunting.topRulesColumn',
    { defaultMessage: 'Top 5 rules' },
  ),
  noItemsMessage: i18n.translate(
    'wazuh.common.homeOverviewThreatHunting.noRules',
    { defaultMessage: 'No rules triggered' },
  ),
  'data-test-subj': 'top-rules-table',
});
