import { i18n } from '@osd/i18n';
import { createTopNTable } from '../common';

export const TopPackagesTable = createTopNTable({
  keyColumnName: i18n.translate(
    'wazuh.common.homeOverviewThreatHunting.topPackagesColumn',
    { defaultMessage: 'Top 5 package name' },
  ),
  noItemsMessage: i18n.translate(
    'wazuh.common.homeOverviewThreatHunting.noVulnerabilities',
    { defaultMessage: 'No vulnerabilities found' },
  ),
  'data-test-subj': 'vulnerabilities-by-package',
});
