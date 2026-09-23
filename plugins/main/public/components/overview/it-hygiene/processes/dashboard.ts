import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import { STYLE } from '../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../common/saved-vis/create-saved-vis-data';
import {
  getVisStateHorizontalBarByField,
  getVisStateHistogramBy,
} from '../common/saved-vis/generators';
import { SavedVis } from '../common/types';

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
    title: i18n.translate(
      'wazuh.itHygiene.processesDashboard.processState.title',
      {
        defaultMessage: 'Processes state {processState}',
        values: { processState },
      },
    ),
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
                label: i18n.translate(
                  'wazuh.itHygiene.processesDashboard.processState.filterLabel',
                  { defaultMessage: 'Process State' },
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

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      i18n.translate('wazuh.itHygiene.processesDashboard.topProcesses.title', {
        defaultMessage: 'Top 5 processes',
      }),
      'it-hygiene-processes',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.processesDashboard.topProcesses.fieldLabel',
          { defaultMessage: 'Processes' },
        ),
      },
    ),
    getVisStateHistogramBy(
      indexPatternId,
      'process.start',
      i18n.translate('wazuh.itHygiene.processesDashboard.startTime.title', {
        defaultMessage: 'Processes start time',
      }),
      'it-hygiene-processes',
      'h',
      { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
    ),
  ]);
};
