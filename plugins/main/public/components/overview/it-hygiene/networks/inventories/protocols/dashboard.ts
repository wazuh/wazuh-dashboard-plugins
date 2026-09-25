import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';
const getVisStateNetworkMetricsMinMax = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-network-metrics-min-max',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 40,
        },
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'min',
          params: {
            field: 'network.metric',
            customLabel: i18n.translate(
              'wazuh.itHygiene.protocolsDashboard.networkMetrics.minLabel',
              { defaultMessage: 'Min network metric' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'max',
          params: {
            field: 'network.metric',
            customLabel: i18n.translate(
              'wazuh.itHygiene.protocolsDashboard.networkMetrics.maxLabel',
              { defaultMessage: 'Max network metric' },
            ),
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewNetworksProtocolsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.type',
      i18n.translate('wazuh.itHygiene.protocolsDashboard.networkTypes.title', {
        defaultMessage: 'Network types',
      }),
      'it-hygiene-protocols',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.networkTypes.metricLabel',
          { defaultMessage: 'Network type count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.networkTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.networkTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
      },
    ),
    getVisStateNetworkMetricsMinMax(indexPatternId),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.dhcp',
      i18n.translate('wazuh.itHygiene.protocolsDashboard.dhcpEnabled.title', {
        defaultMessage: 'DHCP enabled',
      }),
      'it-hygiene-protocols',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.dhcpEnabled.metricLabel',
          { defaultMessage: 'Network DHCP count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.dhcpEnabled.title',
          { defaultMessage: 'DHCP enabled' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.protocolsDashboard.dhcpEnabled.title',
          { defaultMessage: 'DHCP enabled' },
        ),
      },
    ),
  ]);
};
