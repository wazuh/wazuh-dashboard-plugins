import { createTopNTable } from '../common';

export const FimTopFilesTable = createTopNTable({
  keyColumnName: 'Top 5 modified files',
  noItemsMessage: 'No files or registry objects found',
  'data-test-subj': 'fim-top-files-table',
});
