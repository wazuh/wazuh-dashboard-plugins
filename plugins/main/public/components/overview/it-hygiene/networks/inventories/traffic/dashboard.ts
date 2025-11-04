import { SavedVis } from '../../../../../../../common/dashboards/types';
import {
  buildDashboardKPIPanels,
  buildIndexPatternReferenceList,
  buildSearchSource,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
  STYLE,
} from '../../../../../../../common/dashboards/lib';

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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),

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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'destination.port',
      'Top 5 destination ports',
      'it-hygiene-ports',
      {
        fieldSize: 5,
        metricCustomLabel: 'Top ports count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Top ports',
        seriesMode: 'normal',
        fieldCustomLabel: 'Top ports',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.transport',
      'Transport protocols',
      'it-hygiene-ports',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Transport protocols count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Transport protocols',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Transport protocols',
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      'Top 5 processes',
      'it-hygiene-ports',
      { fieldCustomLabel: 'Processes' },
    ),
  ]);
};
