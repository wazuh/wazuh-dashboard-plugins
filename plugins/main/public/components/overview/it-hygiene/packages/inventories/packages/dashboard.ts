import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStateMetricUniqueCountByField,
  getVisStateHorizontalBarByField,
} from '../../../common/saved-vis/generators';

import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';

type PackageArchitecture = 'x86_64' | 'arm64';

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

const getVisStatePackageArchitectureMetric = (
  indexPatternId: string,
  arch: PackageArchitecture,
): SavedVis => {
  return {
    id: `it-hygiene-packages-${arch}`,
    title: `Packages for ${arch} architecture`,
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
            customLabel: arch.toLocaleUpperCase(),
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
                  query: `package.architecture: ${arch}`,
                  language: 'kuery',
                },
                label: 'Packages Architecture',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewPackagesPackagesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateFilter(
      'Vendors',
      indexPatternId,
      '',
      'Top 5 vendors',
      'package.vendor',
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'package.name',
      '',
      'it-hygiene-packages',
      'Packages',
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'package.version',
      '',
      'it-hygiene-packages',
      'Package versions',
    ),
  ]);
};
