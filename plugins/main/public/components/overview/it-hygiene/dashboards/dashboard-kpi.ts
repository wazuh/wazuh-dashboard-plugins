import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  buildIndexPatternReferenceList,
  buildSearchSource,
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../common/dashboards/lib';

export const getVisStateHostsTotalFreeMemoryTable = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    excludeTerm?: string;
    size?: number;
    perPage?: number;
    customLabel?: string;
  } = {},
) => {
  return {
    id: `${visIDPrefix}-${field}`,
    title,
    type: 'table',
    params: {
      perPage: 10,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    },
    uiState: {
      vis: {
        sortColumn: {
          colIndex: 2,
          direction: 'desc',
        },
        columnsWidth: [
          {
            colIndex: 1,
            width: 125,
          },
          {
            colIndex: 2,
            width: 125,
          },
        ],
      },
    },
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'max',
          params: {
            field: 'host.memory.usage',
            customLabel: 'Usage',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'agent.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top 5 endpoints by memory usage',
          },
          schema: 'bucket',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'host.memory.total',
            orderBy: '1',
            order: 'desc',
            size: 1,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: options.customLabel || 'Total memory',
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

export const getDashboardKPIs = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return {
    s1: {
      gridData: {
        w: 16,
        h: 9,
        x: 0,
        y: 0,
        i: 's1',
      },
      type: 'visualization',
      explicitInput: {
        id: 's1',
        savedVis: getVisStateTable(
          indexPatternId,
          'host.os.platform',
          '',
          'it-hygiene-top-operating-system-names',
          {
            fieldCustomLabel: 'Operating system families',
          },
        ),
      },
    },
    s2: {
      gridData: {
        w: 16,
        h: 9,
        x: 16,
        y: 0,
        i: 's2',
      },
      type: 'visualization',
      explicitInput: {
        id: 's2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'package.type',
          'Package types',
          'it-hygiene-system',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Package types count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Package type',
            seriesLabel: 'Package type',
          },
        ),
      },
    },
    s3: {
      gridData: {
        w: 16,
        h: 9,
        x: 32,
        y: 0,
        i: 's3',
      },
      type: 'visualization',
      explicitInput: {
        id: 's3',
        savedVis: getVisStateHostsTotalFreeMemoryTable(
          indexPatternId,
          'host.memory.total',
          '',
          'it-hygiene-stat',
          { customLabel: 'Hosts total memory' },
        ),
      },
    },
  };
};
