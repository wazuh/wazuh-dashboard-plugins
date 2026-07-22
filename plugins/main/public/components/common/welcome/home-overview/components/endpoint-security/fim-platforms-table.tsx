import { createTopNTable } from '../common';

export const FimPlatformsTable = createTopNTable({
  keyColumnName: 'Top 5 platforms',
  noItemsMessage: 'No files or registry objects found',
  'data-test-subj': 'fim-platforms-table',
});
