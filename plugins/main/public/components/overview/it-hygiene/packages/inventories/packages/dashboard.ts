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
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.vendor',
      'Top 5 vendors',
      'it-hygiene-packages',
      'Package vendors',
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
