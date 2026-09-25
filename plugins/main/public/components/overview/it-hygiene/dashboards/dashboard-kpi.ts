import { i18n } from '@osd/i18n';
import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateTable } from '../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../services/visualizations';
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
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'max',
          params: {
            field: 'host.memory.usage',
            customLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.memoryTable.usageLabel',
              { defaultMessage: 'Usage' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'wazuh.agent.name',
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
            customLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.memoryTable.topEndpointsLabel',
              { defaultMessage: 'Top 5 endpoints by memory usage' },
            ),
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
            otherBucketLabel: i18n.translate(
              'wazuh.itHygiene.savedVis.otherBucketLabel',
              { defaultMessage: 'Other' },
            ),
            missingBucket: false,
            missingBucketLabel: i18n.translate(
              'wazuh.itHygiene.savedVis.missingBucketLabel',
              { defaultMessage: 'Missing' },
            ),
            customLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.memoryTable.totalMemoryLabel',
              { defaultMessage: 'Total memory' },
            ),
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
        savedVis: getVisStateTable(
          indexPatternId,
          'host.os.platform',
          '',
          'it-hygiene-top-operating-system-names',
          {
            customLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.osFamilies.label',
              { defaultMessage: 'Operating system families' },
            ),
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
          i18n.translate(
            'wazuh.itHygiene.overviewDashboard.packageTypes.title',
            { defaultMessage: 'Package types' },
          ),
          'it-hygiene-system',
          {
            fieldSize: 4,
            otherBucket: i18n.translate(
              'wazuh.itHygiene.savedVis.othersBucketLabel',
              { defaultMessage: 'Others' },
            ),
            metricCustomLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.packageTypes.metricLabel',
              { defaultMessage: 'Package types count' },
            ),
            valueAxesTitleText: ' ',
            fieldCustomLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.packageTypes.fieldLabel',
              { defaultMessage: 'Package type' },
            ),
            seriesLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.packageTypes.fieldLabel',
              { defaultMessage: 'Package type' },
            ),
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
          {
            customLabel: i18n.translate(
              'wazuh.itHygiene.overviewDashboard.memoryTable.label',
              { defaultMessage: 'Hosts total memory' },
            ),
          },
        ),
      },
    },
  };
};
