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

export const getDashboardFilters = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    topVulnerabilities: {
      gridData: {
        w: 9,
        h: 12,
        x: 0,
        y: 0,
        i: 'topVulnerabilities',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topVulnerabilities',
        savedVis: getVisStateFilter(
          'topVulnerabilities',
          indexPatternId,
          'Top vulnerabilities',
          'Top 5 vulnerabilities',
          'vulnerability.id',
        ),
      },
    },
    topOSVulnerabilities: {
      gridData: {
        w: 15,
        h: 12,
        x: 9,
        y: 0,
        i: 'topOSVulnerabilities',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topOSVulnerabilities',
        savedVis: getVisStateFilter(
          'topOSVulnerabilities',
          indexPatternId,
          'Top operating system vulnerabilities',
          'Top 5 OS',
          'host.os.full',
        ),
      },
    },
    topAgentVulnerabilities: {
      gridData: {
        w: 15,
        h: 12,
        x: 24,
        y: 0,
        i: 'topAgentVulnerabilities',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topAgentVulnerabilities',
        savedVis: getVisStateFilter(
          'topAgentVulnerabilities',
          indexPatternId,
          'Agent filter',
          'Top 5 agents',
          'agent.name',
        ),
      },
    },
    topPackageSelector: {
      gridData: {
        w: 9,
        h: 12,
        x: 39,
        y: 0,
        i: 'topPackageSelector',
      },
      type: 'visualization',
      explicitInput: {
        id: 'topPackageSelector',
        savedVis: getVisStateFilter(
          'topPackageSelector',
          indexPatternId,
          'Top packages vulnerabilities',
          'Top 5 packages',
          'package.name',
        ),
      },
    },
  };
};
