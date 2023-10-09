import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';

const getVisStateFilter = (
  indexPatternId: string,
  title: string,
  label: string,
  fieldName: string
) => {
  return {
    title: title,
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

const getVisStateSeverityCritical = (indexPatternId: string) => {
  return {
    title: 'Critical',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Reds',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 20,
          },
          {
            from: 41,
            to: 47,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 30,
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
            customLabel: '',
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
                  query: 'vulnerability.severity:"critical"',
                  language: 'kuery',
                },
                label: 'Critical Severity Alerts',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityHigh = (indexPatternId: string) => {
  return {
    title: 'High',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Blues',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 50,
          },
          {
            from: 51,
            to: 100,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 30,
        },
      },
    },
    uiState: {
      vis: {
        colors: {
          'High Severity Alerts - Count': '#38D1BA',
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
          params: {},
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
                  query: 'vulnerability.severity:"high"',
                  language: 'kuery',
                },
                label: 'High Severity Alerts',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityMedium = (indexPatternId: string) => {
  return {
    title: 'Medium',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Yellow to Red',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 100,
          },
          {
            from: 100,
            to: 200,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 30,
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
          params: {},
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
                  query: 'vulnerability.severity:"medium"',
                  language: 'kuery',
                },
                label: 'Medium Severity Alerts',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityLow = (indexPatternId: string) => {
  return {
    title: 'Low',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 500000,
          },
          {
            from: 500000,
            to: 500001,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: true,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 30,
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
          params: {},
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
                  query: 'vulnerability.severity:"low"',
                  language: 'kuery',
                },
                label: 'Low Severity Alerts',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateTopVulnerabilities = (indexPatternId: string) => {
  return {
    title: 'Most detected vulnerabilities horizontal',
    type: 'horizontal_bar',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 200,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 75,
            filter: true,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
          params: {},
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.id',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Vulnerability.ID',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.id',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateTopVulnerabilitiesEndpoints = (indexPatternId: string) => {
  return {
    title: 'The most vulnerable endpoints horizontal',
    type: 'horizontal_bar',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 200,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 75,
            filter: true,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    uiState: {
      vis: {
        legendOpen: false,
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
            field: 'agent.id',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'package.path',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'agent.id',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'mm',
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateInventoryTable = (indexPatternId: string) => {
  return {
    title: 'Inventory table',
    type: 'table',
    params: {
      perPage: 10,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
            field: 'package.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'name',
          },
          schema: 'bucket',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'package.version',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'version',
          },
          schema: 'bucket',
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'package.architecture',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'architecture',
          },
          schema: 'bucket',
        },
        {
          id: '5',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.severity',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'severity',
          },
          schema: 'bucket',
        },
        {
          id: '6',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.id',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'id',
          },
          schema: 'bucket',
        },
        {
          id: '7',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.score.version',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'score version',
          },
          schema: 'bucket',
        },
        {
          id: '8',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.score.base',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'score base',
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

const getVisStateOpenVsCloseVulnerabilities = (indexPatternId: string) => {
  return {
    title: 'Open vs. Close',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            filter: true,
            truncate: 100,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
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
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-1d',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.vulnerability.state',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            exclude: 'Pending confirmation',
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getDashboardFilters = (): {
  [panelId: string]: DashboardPanelState<EmbeddableInput & { [k: string]: unknown }>;
} => {
  return {
    packageSelector: {
      gridData: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
        i: 'packageSelector',
      },
      type: 'visualization',
      explicitInput: {
        id: 'packageSelector',
        savedVis: getVisStateFilter(
          VULNERABILITIES_INDEX_PATTERN_ID,
          'Top Packages vulnerabilities',
          'Package',
          'package.name'
        ),
      },
    },
    packageNameSelector: {
      gridData: {
        w: 12,
        h: 12,
        x: 12,
        y: 0,
        i: 'packageNameSelector',
      },
      type: 'visualization',
      explicitInput: {
        id: 'packageNameSelector',
        savedVis: getVisStateFilter(
          VULNERABILITIES_INDEX_PATTERN_ID,
          'Top Operating system vulnerabilities',
          'Operating system',
          'host.os.name'
        ),
      },
    },
    groupFilter: {
      gridData: {
        w: 12,
        h: 12,
        x: 24,
        y: 0,
        i: 'groupFilter',
      },
      type: 'visualization',
      explicitInput: {
        id: 'groupFilter',
        savedVis: getVisStateFilter(
          VULNERABILITIES_INDEX_PATTERN_ID,
          'Agent filter',
          'Agent',
          'agent.id'
        ),
      },
    },
    otherFilter: {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: 'otherFilter',
      },
      type: 'visualization',
      explicitInput: {
        id: 'otherFilter',
        savedVis: getVisStateFilter(
          VULNERABILITIES_INDEX_PATTERN_ID,
          'Top vulnerabilities',
          'Vulnerability',
          'vulnerability.id'
        ),
      },
    },
  };
};

export const getDashboardPanels = (): {
  [panelId: string]: DashboardPanelState<EmbeddableInput & { [k: string]: unknown }>;
} => {
  return {
    '1': {
      gridData: {
        w: 12,
        h: 6,
        x: 0,
        y: 12,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateSeverityCritical(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '2': {
      gridData: {
        w: 12,
        h: 6,
        x: 12,
        y: 12,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateSeverityHigh(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '3': {
      gridData: {
        w: 12,
        h: 6,
        x: 24,
        y: 12,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateSeverityMedium(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '4': {
      gridData: {
        w: 12,
        h: 6,
        x: 36,
        y: 12,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateSeverityLow(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '5': {
      gridData: {
        w: 48,
        h: 12,
        x: 0,
        y: 24,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateOpenVsCloseVulnerabilities('wazuh-alerts-*'),
      },
    },
    '6': {
      gridData: {
        w: 24,
        h: 10,
        x: 0,
        y: 36,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateTopVulnerabilities(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '7': {
      gridData: {
        w: 24,
        h: 10,
        x: 24,
        y: 36,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateTopVulnerabilitiesEndpoints(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
    '8': {
      gridData: {
        w: 48,
        h: 12,
        x: 0,
        y: 44,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateInventoryTable(VULNERABILITIES_INDEX_PATTERN_ID),
      },
    },
  };
};
