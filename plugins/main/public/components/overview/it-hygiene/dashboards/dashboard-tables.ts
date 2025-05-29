import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisStateFilter = (
  id: string,
  indexPatternId: string,
  title: string,
  label: string,
  fieldName: string,
) => {
  return {
    id,
    title,
    type: 'table',
    params: {
      perPage: 5,
      percentageCol: '',
      row: true,
      showMetricsAtAllLevels: false,
      showPartialRows: false,
      showTotal: false,
      totalFunc: 'sum',
    },
    uiState: {
      vis: {
        columnsWidth: [
          {
            colIndex: 1,
            width: 75,
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: fieldName,
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: label,
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

export const getDashboardTables = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    t1: {
      gridData: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
        i: 't1',
      },
      type: 'visualization',
      explicitInput: {
        id: 't1',
        savedVis: getVisStateFilter(
          'it-hygiene-top-packages',
          indexPatternId,
          'Top packages',
          'Top 5 packages',
          'package.name',
        ),
      },
    },
    t2: {
      gridData: {
        w: 12,
        h: 12,
        x: 12,
        y: 0,
        i: 't2',
      },
      type: 'visualization',
      explicitInput: {
        id: 't2',
        savedVis: getVisStateFilter(
          'it-hygiene-top-packages',
          indexPatternId,
          'Top processes',
          'Top 5 processes',
          'process.command_line',
        ),
      },
    },
    t3: {
      gridData: {
        w: 12,
        h: 12,
        x: 24,
        y: 0,
        i: 't3',
      },
      type: 'visualization',
      explicitInput: {
        id: 't3',
        savedVis: getVisStateFilter(
          'it-hygiene-top-operating-system-names',
          indexPatternId,
          'Top OS',
          'Top 5 operating systems',
          'host.os.name',
        ),
      },
    },
    t4: {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: 't4',
      },
      type: 'visualization',
      explicitInput: {
        id: 't4',
        savedVis: getVisStateFilter(
          'it-hygiene-stat',
          indexPatternId,
          'Top 5 CPUs',
          'Hosts CPUs',
          'host.cpu.name',
        ),
      },
    },
  };
};
