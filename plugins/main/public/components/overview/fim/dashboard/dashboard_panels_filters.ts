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

export const getDashboardFilters = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    topPackageSelector: {
      gridData: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
        i: 'topPackageSelector',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topPackageSelector',
        savedVis: getVisStateFilter(
          'topPackageSelector',
          indexPatternId,
          'Top Packages fim',
          'Package',
          'package.name',
        ),
      },
    },
    topOSFim: {
      gridData: {
        w: 12,
        h: 12,
        x: 12,
        y: 0,
        i: 'topOSFim',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topOSFim',
        savedVis: getVisStateFilter(
          'topOSFim',
          indexPatternId,
          'Top Operating system fim',
          'Operating system',
          'host.os.name',
        ),
      },
    },
    topAgentFim: {
      gridData: {
        w: 12,
        h: 12,
        x: 24,
        y: 0,
        i: 'topAgentFim',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topAgentFim',
        savedVis: getVisStateFilter(
          'topAgentFim',
          indexPatternId,
          'Agent filter',
          'Agent',
          'agent.id',
        ),
      },
    },
    topFim: {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: 'topFim',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topFim',
        savedVis: getVisStateFilter(
          'topFim',
          indexPatternId,
          'Top vulnerabilities',
          'Fim',
          'fim.id',
        ),
      },
    },
  };
};
