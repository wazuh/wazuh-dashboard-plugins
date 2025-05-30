import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import {
  getVisStateHistrogramBy,
  getVisStateHorizontalBarByField,
} from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';

type ProcessState =
  | 'Stopped'
  | 'Zombie'
  | 'Interruptable Sleep'
  | 'Uninterruptible Sleep';

const getVisStateProcessesState = (
  indexPatternId: string,
  processState: ProcessState,
): SavedVis => {
  return {
    id: `it-hygiene-processes-state-${processState}`,
    title: `Processes state ${processState}`,
    type: 'metric',
    params: {
      addLegend: false,
      addTooltip: true,
      metric: {
        colorSchema: 'Green to Red',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        invertColors: false,
        labels: {
          show: true,
        },
        metricColorMode: 'None',
        percentageMode: false,
        style: STYLE,
        useRanges: false,
      },
      type: 'metric',
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
            customLabel: processState,
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
                  query: `process.state: ${processState}`,
                  language: 'kuery',
                },
                label: 'Process State',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      'Top 5 processes',
      'it-hygiene-processes',
      { customLabel: 'Processes', excludeTerm: '.*wazuh.*' },
    ),
    getVisStateHistrogramBy(
      indexPatternId,
      'process.start',
      'Processes initiation',
      'it-hygiene-processes',
      'h',
    ),
  ]);
};
