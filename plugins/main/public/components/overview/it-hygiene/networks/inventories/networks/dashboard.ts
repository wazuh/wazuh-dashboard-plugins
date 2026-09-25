import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';

export const getOverviewNetworksNetworksTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.type',
      i18n.translate('wazuh.itHygiene.addressesDashboard.networkTypes.title', {
        defaultMessage: 'Network types',
      }),
      'it-hygiene-networks',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.addressesDashboard.networkTypes.metricLabel',
          { defaultMessage: 'Network type count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.addressesDashboard.networkTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.addressesDashboard.networkTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'network.ip',
      i18n.translate('wazuh.itHygiene.addressesDashboard.topNetworks.title', {
        defaultMessage: 'Top 5 networks',
      }),
      'it-hygiene-networks',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.addressesDashboard.topNetworks.fieldLabel',
          { defaultMessage: 'Network IP' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'interface.name',
      i18n.translate(
        'wazuh.itHygiene.addressesDashboard.topInterfaceNames.title',
        { defaultMessage: 'Top 5 interface names' },
      ),
      'it-hygiene-networks',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.addressesDashboard.topInterfaceNames.fieldLabel',
          { defaultMessage: 'Interface name' },
        ),
      },
    ),
  ]);
};
