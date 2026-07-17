import { createTopNTable } from '../common';

export const FimPlatformsTable = createTopNTable({
  keyColumnName: 'Top 5 by platform',
  noItemsMessage: 'No files or registry objects baselined yet',
  'data-test-subj': 'fim-platforms-table',
});
