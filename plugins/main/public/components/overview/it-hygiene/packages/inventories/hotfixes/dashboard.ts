import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../../../common/saved-vis/generators';

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      i18n.translate('wazuh.itHygiene.hotfixesDashboard.mostCommonKbs.title', {
        defaultMessage: 'Most common KBs',
      }),
      'it-hygiene-hotfixes',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.hotfixesDashboard.kbs.fieldLabel',
          { defaultMessage: 'KBs' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      i18n.translate('wazuh.itHygiene.hotfixesDashboard.leastCommonKbs.title', {
        defaultMessage: 'Least common KBs',
      }),
      'it-hygiene-hotfixes',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.hotfixesDashboard.kbs.fieldLabel',
          { defaultMessage: 'KBs' },
        ),
        orderAggregation: 'asc',
      },
    ),
  ]);
};
