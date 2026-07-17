import { createTopNTable } from '../common';

export const TopRulesTable = createTopNTable({
  keyColumnName: 'Top 5 rules',
  noItemsMessage: 'No rules triggered in the last 24 hours',
  'data-test-subj': 'top-rules-table',
});
