import { createTopNTable } from '../common';

export const VulnerabilitiesByOsTable = createTopNTable({
  keyColumnName: 'Vulnerabilities by OS',
  noItemsMessage: 'No vulnerabilities found',
  'data-test-subj': 'vulnerabilities-by-os-table',
});
