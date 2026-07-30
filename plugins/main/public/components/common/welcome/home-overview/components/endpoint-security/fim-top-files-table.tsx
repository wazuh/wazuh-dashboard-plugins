import { createTopNTable } from '../common';

export const FimTopFilesTable = createTopNTable({
  keyColumnName: 'Top 5 modified files',
  // Rows rank by `file.mtime`; the count is the agents monitoring that path.
  countColumnName: 'Agents',
  noItemsMessage: 'No files or registry objects found',
  'data-test-subj': 'fim-top-files-table',
});
