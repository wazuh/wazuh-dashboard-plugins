import { createTopNTable } from '../common';

export const TopPackagesTable = createTopNTable({
  keyColumnName: 'Top 5 package name',
  noItemsMessage: 'No vulnerabilities found',
  'data-test-subj': 'vulnerabilities-by-package',
});
