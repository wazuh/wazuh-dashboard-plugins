import { createTopNTable } from '../common';

export const TopRulesTable = createTopNTable({
  keyColumnName: 'Top 5 rules',
  noItemsMessage: 'No rules triggered',
  'data-test-subj': 'top-rules-table',
});
