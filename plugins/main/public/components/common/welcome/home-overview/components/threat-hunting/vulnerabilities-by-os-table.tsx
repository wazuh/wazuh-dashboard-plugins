import { createTopNTable } from '../common';

export const VulnerabilitiesByOsTable = createTopNTable({
  keyColumnName: 'Top 5 OS platforms',
  noItemsMessage: 'No vulnerabilities found',
  'data-test-subj': 'vulnerabilities-by-os-table',
});
