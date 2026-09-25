import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateMetricUniqueCountByField } from '../../../common/saved-vis/generators';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateHorizontalBarByField,
} from '../../../../../../services/visualizations';

export const getOverviewUsersGroupsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'group.name',
      i18n.translate('wazuh.itHygiene.groupsDashboard.topGroups.title', {
        defaultMessage: 'Top 5 groups',
      }),
      'it-hygiene-groups',
      {
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.groupsDashboard.topGroups.fieldLabel',
          { defaultMessage: 'Groups' },
        ),
      },
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'group.name',
      i18n.translate('wazuh.itHygiene.groupsDashboard.uniqueGroups.title', {
        defaultMessage: 'Unique groups',
      }),
      'it-hygiene-groups-unique-count',
      i18n.translate('wazuh.itHygiene.groupsDashboard.uniqueGroups.label', {
        defaultMessage: 'Unique groups',
      }),
    ),
  ]);
};
