import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../common/saved-vis/generators';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'service.name',
      i18n.translate('wazuh.itHygiene.servicesDashboard.topServices.title', {
        defaultMessage: 'Top 5 services',
      }),
      'it-hygiene-services',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.servicesDashboard.topServices.fieldLabel',
          { defaultMessage: 'Services' },
        ),
      },
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'service.name',
      '',
      'it-hygiene-services',
      i18n.translate('wazuh.itHygiene.servicesDashboard.uniqueServices.label', {
        defaultMessage: 'Unique services',
      }),
    ),
  ]);
};
