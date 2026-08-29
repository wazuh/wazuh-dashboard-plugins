import { createTopNTable } from '../common';
import { homeOverviewI18n } from '../../i18n';

export const FimTopFilesTable = createTopNTable({
  keyColumnName: homeOverviewI18n.top5ModifiedFiles,
  // Rows rank by `file.mtime`; the count is the agents monitoring that path.
  countColumnName: homeOverviewI18n.count,
  noItemsMessage: homeOverviewI18n.noFilesOrRegistry,
  'data-test-subj': 'fim-top-files-table',
});
