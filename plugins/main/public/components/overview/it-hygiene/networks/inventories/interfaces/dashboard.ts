import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { HEIGHT, STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { SavedVis } from '../../../common/types';

// You can apply the same logic here using ERRORS instead of DROPS. In both cases, a lower percentage indicates everything is working fine. If the percentage rises too much, it means there's a problem that needs attention.
const getVisStateGlobalPacketLossMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-global-packet-loss-rate',
    title: i18n.translate(
      'wazuh.itHygiene.interfacesDashboard.packetLossRate.title',
      { defaultMessage: 'Average packet loss rate' },
    ),
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: true,
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
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'avg',
          params: {
            field: 'host.network.ingress.drops',
            json: "\
              {\
                \"script\": {\
                  \"source\": \" \
                    float in_drops=(doc['host.network.ingress.drops'].size() != 0 ? doc['host.network.ingress.drops'].value : 0); \
                    float in_errors=(doc['host.network.ingress.errors'].size() != 0 ? doc['host.network.ingress.errors'].value : 0); \
                    float in_packets=(doc['host.network.ingress.packets'].size() != 0 ? doc['host.network.ingress.packets'].value : 0); \
                    float out_drops=(doc['host.network.egress.drops'].size() != 0 ? doc['host.network.egress.drops'].value : 0); \
                    float out_errors=(doc['host.network.egress.errors'].size() != 0 ? doc['host.network.egress.errors'].value : 0); \
                    float out_packets=(doc['host.network.egress.packets'].size() != 0 ? doc['host.network.egress.packets'].value : 0); \
                    float d=(in_drops + out_drops); \
                    float p=(in_drops + in_errors + in_packets + out_drops + out_errors + out_packets); \
                    return p == 0 ? 0 : Math.round((d/p)*100*100);\", \
                  \"lang\": \"painless\" \
                }\
              }" /*
                The total packets is the sum of: packets, drops and erros.
                The result is multiplied by:
                - 100 to convert the value (d/p) to percent (%)
                WORKAROUND: multiply 100 to equilibrate the division by 100 done when the `isPercentMode` is true
              */,

            customLabel: i18n.translate(
              'wazuh.itHygiene.interfacesDashboard.packetLossRate.title',
              { defaultMessage: 'Average packet loss rate' },
            ),
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateInactiveNetworkInterfacesMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-state-inactive',
    title: i18n.translate(
      'wazuh.itHygiene.interfacesDashboard.inactiveInterfaces.title',
      { defaultMessage: 'Interfaces state Inactive' },
    ),
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
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: i18n.translate(
              'wazuh.itHygiene.interfacesDashboard.inactiveInterfaces.label',
              { defaultMessage: 'Inactive' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'interface.state: Inactive',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.itHygiene.interfacesDashboard.interfaceState.filterLabel',
                  { defaultMessage: 'Interfaces' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateUnknownStateNetworkInterfacesMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-state-unknown',
    title: i18n.translate(
      'wazuh.itHygiene.interfacesDashboard.unknownInterfaces.title',
      { defaultMessage: 'Interfaces state Unknown' },
    ),
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
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: i18n.translate(
              'wazuh.itHygiene.interfacesDashboard.unknownInterfaces.label',
              { defaultMessage: 'Unknown' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'interface.state: Unknown',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.itHygiene.interfacesDashboard.interfaceState.filterLabel',
                  { defaultMessage: 'Interfaces' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateWirelessNetworkInterfacesMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-type-wireless',
    title: i18n.translate(
      'wazuh.itHygiene.interfacesDashboard.wirelessInterfaces.title',
      { defaultMessage: 'Interfaces type Wireless' },
    ),
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
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: i18n.translate(
              'wazuh.itHygiene.interfacesDashboard.wirelessInterfaces.label',
              { defaultMessage: 'Wireless' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'interface.type: wireless',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.itHygiene.interfacesDashboard.wirelessInterfaces.filterLabel',
                  { defaultMessage: 'Interfaces type' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateGlobalPacketLossMetric(indexPatternId),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'interface.state',
      i18n.translate(
        'wazuh.itHygiene.interfacesDashboard.interfaceStates.title',
        { defaultMessage: 'Interface states' },
      ),
      'it-hygiene-interfaces',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceStates.metricLabel',
          { defaultMessage: 'Interfaces state count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceStates.fieldLabel',
          { defaultMessage: 'Interfaces state' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceStates.fieldLabel',
          { defaultMessage: 'Interfaces state' },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'interface.type',
      i18n.translate(
        'wazuh.itHygiene.interfacesDashboard.interfaceTypes.title',
        { defaultMessage: 'Interface types' },
      ),
      'it-hygiene-interfaces',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceTypes.metricLabel',
          { defaultMessage: 'Interfaces type count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.interfacesDashboard.interfaceTypes.fieldLabel',
          { defaultMessage: 'Type' },
        ),
      },
    ),
  ]);
};
