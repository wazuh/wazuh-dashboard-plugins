import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'browser.name',
      i18n.translate(
        'wazuh.itHygiene.browserExtensionsDashboard.topBrowsers.title',
        { defaultMessage: 'Top 5 browsers' },
      ),
      'it-hygiene-browsers-name',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.browserExtensionsDashboard.topBrowsers.fieldLabel',
          { defaultMessage: 'Browsers' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.name',
      i18n.translate(
        'wazuh.itHygiene.browserExtensionsDashboard.topPackages.title',
        { defaultMessage: 'Top 5 packages' },
      ),
      'it-hygiene-packages-name',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.browserExtensionsDashboard.topPackages.fieldLabel',
          { defaultMessage: 'Packages' },
        ),
      },
    ),
  ]);
};
