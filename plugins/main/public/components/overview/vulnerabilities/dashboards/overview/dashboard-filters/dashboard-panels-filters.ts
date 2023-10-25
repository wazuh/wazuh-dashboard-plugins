import { DashboardPanelState } from "../../../../../../../../../src/plugins/dashboard/public/application";
import { EmbeddableInput } from "../../../../../../../../../src/plugins/embeddable/public";
import { VULNERABILITIES_INDEX_PATTERN_ID } from "../../../common/constants";

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


  export const getDashboardFilters = (): {
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
            VULNERABILITIES_INDEX_PATTERN_ID,
            'Top Packages vulnerabilities',
            'Package',
            'package.name',
          ),
        },
      },
      topOSVulnerabilities: {
        gridData: {
          w: 12,
          h: 12,
          x: 12,
          y: 0,
          i: 'topOSVulnerabilities',
        },
        type: 'visualization',
        explicitInput: {
          id: 'topOSVulnerabilities',
          savedVis: getVisStateFilter(
            'topOSVulnerabilities',
            VULNERABILITIES_INDEX_PATTERN_ID,
            'Top Operating system vulnerabilities',
            'Operating system',
            'host.os.name',
          ),
        },
      },
      topAgentVulnerabilities: {
        gridData: {
          w: 12,
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
            VULNERABILITIES_INDEX_PATTERN_ID,
            'Agent filter',
            'Agent',
            'agent.id',
          ),
        },
      },
      topVulnerabilities: {
        gridData: {
          w: 12,
          h: 12,
          x: 36,
          y: 0,
          i: 'topVulnerabilities',
        },
        type: 'visualization',
        explicitInput: {
          id: 'topVulnerabilities',
          savedVis: getVisStateFilter(
            'topVulnerabilities',
            VULNERABILITIES_INDEX_PATTERN_ID,
            'Top vulnerabilities',
            'Vulnerability',
            'vulnerability.id',
          ),
        },
      },
    };
  };