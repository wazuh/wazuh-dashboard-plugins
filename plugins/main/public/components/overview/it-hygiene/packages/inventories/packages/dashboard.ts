import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateMetricUniqueCountByField } from '../../../common/saved-vis/generators';

import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations/generators';

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
            customLabel: i18n.translate('wazuh.itHygiene.savedVis.countLabel', {
              defaultMessage: 'Count',
            }),
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
            otherBucketLabel: i18n.translate(
              'wazuh.itHygiene.savedVis.otherBucketLabel',
              { defaultMessage: 'Other' },
            ),
            missingBucket: false,
            missingBucketLabel: i18n.translate(
              'wazuh.itHygiene.savedVis.missingBucketLabel',
              { defaultMessage: 'Missing' },
            ),
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
    title: i18n.translate(
      'wazuh.itHygiene.packagesDashboard.architecture.title',
      { defaultMessage: 'Packages for {arch} architecture', values: { arch } },
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
                label: i18n.translate(
                  'wazuh.itHygiene.packagesDashboard.architecture.filterLabel',
                  { defaultMessage: 'Packages Architecture' },
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

export const getOverviewPackagesPackagesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateFilter(
      'Vendors',
      indexPatternId,
      '',
      i18n.translate('wazuh.itHygiene.packagesDashboard.topVendors.title', {
        defaultMessage: 'Top 5 vendors',
      }),
      'package.vendor',
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'package.name',
      '',
      'it-hygiene-packages',
      i18n.translate('wazuh.itHygiene.packagesDashboard.uniquePackages.label', {
        defaultMessage: 'Unique packages',
      }),
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'package.type',
      i18n.translate('wazuh.itHygiene.packagesDashboard.packageTypes.title', {
        defaultMessage: 'Package types',
      }),
      'it-hygiene-packages',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.packagesDashboard.packageTypes.metricLabel',
          { defaultMessage: 'Package type count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.packagesDashboard.packageTypes.metricLabel',
          { defaultMessage: 'Package type count' },
        ),
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.packagesDashboard.packageTypes.fieldLabel',
          { defaultMessage: 'Package type' },
        ),
      },
    ),
  ]);
};
