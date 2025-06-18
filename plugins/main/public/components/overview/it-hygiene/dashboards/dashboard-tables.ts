import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateTable } from '../common/saved-vis/generators';

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
        savedVis: getVisStateTable(
          indexPatternId,
          'package.name',
          'Top 5 installed packages',
          'it-hygiene-top-packages',
          {
            customLabel: 'Top 5 installed packages',
          },
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
        savedVis: getVisStateTable(
          indexPatternId,
          'process.name',
          'Top 5 running processes',
          'it-hygiene-top-processes',
          {
            customLabel: 'Top 5 running processes',
            filter: [
              {
                $state: {
                  store: 'appState',
                },
                exists: {
                  field: 'source.port',
                },
                meta: {
                  alias: null,
                  disabled: false,
                  key: 'source.port',
                  negate: true,
                  type: 'exists',
                  value: 'exists',
                  index: indexPatternId,
                },
              },
            ],
          },
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
        savedVis: getVisStateTable(
          indexPatternId,
          'host.os.name',
          'Top 5 operating systems',
          'it-hygiene-top-operating-system-names',
          {
            customLabel: 'Top 5 operating systems',
          },
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
        savedVis: getVisStateTable(
          indexPatternId,
          'host.cpu.name',
          'Top 5 CPUs',
          'it-hygiene-stat',
          {
            customLabel: 'Top 5 host CPUs',
          },
        ),
      },
    },
  };
};
