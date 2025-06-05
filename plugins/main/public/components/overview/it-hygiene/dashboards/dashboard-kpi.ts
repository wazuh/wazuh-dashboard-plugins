import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateHistogramBy } from '../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../services/visualizations';
import { HEIGHT, STYLE } from '../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../common/saved-vis/create-saved-vis-data';

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
          colIndex: 1,
          direction: 'asc',
        },
        columnsWidth: [
          {
            colIndex: 1,
            width: 125,
          },
        ],
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
            field: 'host.memory.free',
            customLabel: 'Memory',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'agent.name',
            orderBy: '_key',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top 5 agents least free memory',
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

export const getDashboardKPIs = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
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
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'host.os.platform',
          'Operating system families',
          'it-hygiene-top-operating-system-names',
          {
            fieldSize: 9,
            otherBucket: 'Others',
            metricCustomLabel: 'OS families',
            valueAxesTitleText: ' ',
            seriesLabel: 'OS families',
            seriesMode: 'normal',
            fieldCustomLabel: 'OS families',
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
