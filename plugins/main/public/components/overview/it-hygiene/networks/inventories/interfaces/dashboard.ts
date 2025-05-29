import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { generateVisualization } from '../../../common/create-new-visualization';
import { HEIGHT, STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateDonutByField } from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';

// You can apply the same logic here using ERRORS instead of DROPS. In both cases, a lower percentage indicates everything is working fine. If the percentage rises too much, it means there's a problem that needs attention.
const getVisStateGlobalPacketLossMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-global-packet-loss-rate',
    title: 'Global packet loss rate',
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
          type: 'sum',
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

            customLabel: 'Global packet loss rate',
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
    title: 'Interfaces state Inactive',
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
            customLabel: 'Inactive',
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
                  query: 'observer.ingress.interface.state: Inactive',
                  language: 'kuery',
                },
                label: 'Interfaces',
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
    title: 'Interfaces state Unknown',
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
            customLabel: 'Unknown',
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
                  query: 'observer.ingress.interface.state: Unknown',
                  language: 'kuery',
                },
                label: 'Interfaces',
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
    title: 'Interfaces type Wireless',
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
            customLabel: 'Wireless',
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
                  query: 'observer.ingress.interface.type: wireless',
                  language: 'kuery',
                },
                label: 'Interfaces type',
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
    getVisStateDonutByField(
      indexPatternId,
      'observer.ingress.interface.state',
      'States',
      'it-hygiene-interfaces',
    ),
    getVisStateDonutByField(
      indexPatternId,
      'observer.ingress.interface.type',
      'Types',
      'it-hygiene-interfaces',
    ),
  ]);
};
