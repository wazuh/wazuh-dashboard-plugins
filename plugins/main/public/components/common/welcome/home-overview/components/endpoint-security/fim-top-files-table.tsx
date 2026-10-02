import { i18n } from '@osd/i18n';
import { createTopNTable } from '../common';

export const FimTopFilesTable = createTopNTable({
  keyColumnName: i18n.translate(
    'wazuh.common.homeOverviewEndpointSecurity.fimTopFilesColumn',
    { defaultMessage: 'Top 5 modified files' },
  ),
  // Rows rank by `file.mtime`; the count is the agents monitoring that path.
  countColumnName: i18n.translate(
    'wazuh.common.homeOverviewTopNTable.countColumn',
    { defaultMessage: 'Count' },
  ),
  noItemsMessage: i18n.translate(
    'wazuh.common.homeOverviewEndpointSecurity.fimNoFiles',
    { defaultMessage: 'No files or registry objects found' },
  ),
  'data-test-subj': 'fim-top-files-table',
});
