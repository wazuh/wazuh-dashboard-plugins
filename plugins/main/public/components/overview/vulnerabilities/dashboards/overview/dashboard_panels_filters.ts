import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { vulnerabilitiesI18n } from '../../i18n';

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
            customLabel: vulnerabilitiesI18n.count,
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
            otherBucketLabel: vulnerabilitiesI18n.other,
            missingBucket: false,
            missingBucketLabel: vulnerabilitiesI18n.missing,
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
          vulnerabilitiesI18n.topVulnerabilities,
          vulnerabilitiesI18n.top5Vulnerabilities,
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
          vulnerabilitiesI18n.topOsVulnerabilities,
          vulnerabilitiesI18n.top5Os,
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
          vulnerabilitiesI18n.agentFilter,
          vulnerabilitiesI18n.top5Agents,
          'wazuh.agent.name',
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
          vulnerabilitiesI18n.topPackagesVulnerabilities,
          vulnerabilitiesI18n.top5Packages,
          'package.name',
        ),
      },
    },
  };
};
