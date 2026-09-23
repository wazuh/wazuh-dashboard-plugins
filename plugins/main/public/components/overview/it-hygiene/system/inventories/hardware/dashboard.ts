import { i18n } from '@osd/i18n';
import { getVisStateHostsTotalFreeMemoryTable } from '../../../dashboards/dashboard-kpi';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStatePieByField,
  getVisStateHorizontalBarByField,
} from '../../../common/saved-vis/generators';

import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';

const getVisStateAverageMetric = (
  indexPatternId: string,
  field: string,
  customLabel: string,
): SavedVis => {
  return {
    id: `it-hygiene-network-${field}`,
    title: i18n.translate(
      'wazuh.itHygiene.hardwareDashboard.averageMetric.title',
      { defaultMessage: 'Average {field}', values: { field } },
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
          type: 'avg',
          params: {
            field,
            customLabel,
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewSystemHardwareTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.cpu.name',
      i18n.translate('wazuh.itHygiene.hardwareDashboard.topCpuNames.title', {
        defaultMessage: 'Top 5 CPU names',
      }),
      'it-hygiene-hardware',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.hardwareDashboard.topCpuNames.fieldLabel',
          { defaultMessage: 'CPUs' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.cpu.cores',
      i18n.translate('wazuh.itHygiene.hardwareDashboard.topCpuCores.title', {
        defaultMessage: 'Top 5 CPU cores',
      }),
      'it-hygiene-hardware',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.hardwareDashboard.topCpuCores.fieldLabel',
          { defaultMessage: 'Cores count' },
        ),
      },
    ),
    getVisStateHostsTotalFreeMemoryTable(
      indexPatternId,
      'host.memory.total',
      '',
      'it-hygiene-stat',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.hardwareDashboard.memoryTable.label',
          { defaultMessage: 'Hosts total memory' },
        ),
      },
    ),
  ]);
};
