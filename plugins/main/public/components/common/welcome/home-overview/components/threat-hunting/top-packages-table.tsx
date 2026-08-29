import { createTopNTable } from '../common';
import { homeOverviewI18n } from '../../i18n';

export const TopPackagesTable = createTopNTable({
  keyColumnName: homeOverviewI18n.top5PackageName,
  noItemsMessage: homeOverviewI18n.noVulnerabilities,
  'data-test-subj': 'vulnerabilities-by-package',
});
