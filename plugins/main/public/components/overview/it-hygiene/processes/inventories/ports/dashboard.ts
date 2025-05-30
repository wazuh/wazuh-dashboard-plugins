import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import {
  getVisStateHorizontalBarByField,
  getVisStateDonutByField,
} from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';

type InterfaceState = 'LISTEN' | 'ESTABLISHED';

const getVisStateInterfaceState = (
  indexPatternId: string,
  interfaceState: InterfaceState,
): SavedVis => {
  return {
    id: `it-hygiene-network-interfaces-${interfaceState}`,
    title: `Interfaces in ${interfaceState} state`,
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
            customLabel: interfaceState,
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
                  query: `interface.state: ${interfaceState}`,
                  language: 'kuery',
                },
                label: 'Interface State',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateUDPOnlyTransportsMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-Transports-only-udp',
    title: 'Transports operating only on UDP',
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
            customLabel: 'UDP',
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
                  query: 'network.transport:"UDP"',
                  language: 'kuery',
                },
                label: 'Transport Protocols',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'destination.port',
      'Top 5 source ports',
      'it-hygiene-ports',
      { customLabel: 'Source ports' },
    ),
    getVisStateDonutByField(
      indexPatternId,
      'interface.state',
      'States',
      'it-hygiene-ports',
    ),
    getVisStateDonutByField(
      indexPatternId,
      'network.transport',
      'Transport protocols',
      'it-hygiene-ports',
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      'Top 5 processes',
      'it-hygiene-ports',
      { customLabel: 'Processes', excludeTerm: '.*wazuh.*' },
    ),
  ]);
};
