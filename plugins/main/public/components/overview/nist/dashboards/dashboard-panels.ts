import { DashboardPanelState } from '../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../src/plugins/embeddable/public';

const getVisStateMostActiveAgents = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-Agents',
    title: 'Most active agents',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
        buckets: [
          {
            accessor: 0,
            format: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'agent.name',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Agent',
          },
        },
      ],
    },
  };
};

const getVisStateRequirementsOverTime = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-Requirements-over-time',
    title: 'Top 10 requirements over time',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: true, valueAxis: 'ValueAxis-1' },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
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
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'line',
          mode: 'normal',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
          interpolate: 'linear',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: { show: false },
      dimensions: {
        x: {
          accessor: 0,
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
          params: {
            date: true,
            interval: 'PT1H',
            format: 'YYYY-MM-DD HH:mm',
            bounds: {
              min: '2019-08-20T12:33:23.360Z',
              max: '2019-08-22T12:33:23.360Z',
            },
          },
          aggType: 'date_histogram',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
          {
            accessor: 1,
            format: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.nist_800_53',
            orderBy: '1',
            order: 'desc',
            size: 8,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-2d', to: 'now' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateRequirementsByAgents = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-requirements-by-agents',
    title: 'Requirements distribution by agent',
    type: 'area',
    params: {
      type: 'area',
      grid: { categoryLines: false },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
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
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          drawLinesBetweenPoints: true,
          showCircles: true,
          interpolate: 'linear',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      dimensions: {
        x: {
          accessor: 0,
          format: {
            id: 'terms',
            params: {
              id: 'string',
              otherBucketLabel: 'Other',
              missingBucketLabel: 'Missing',
            },
          },
          params: {},
          aggType: 'terms',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
          {
            accessor: 1,
            format: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    uiState: { vis: { legendOpen: false } },
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'agent.id',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Agent',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.nist_800_53',
            orderBy: '1',
            order: 'desc',
            size: 9,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
      ],
    },
  };
};

const getVisStateRequirementsAgentsHeatmap = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-Requirements-Agents-heatmap',
    title: 'Alerts volume by agent',
    type: 'heatmap',
    params: {
      addLegend: true,
      addTooltip: true,
      colorSchema: 'Blues',
      colorsNumber: 10,
      colorsRange: [],
      dimensions: {
        series: [
          {
            accessor: 0,
            aggType: 'terms',
            format: {
              id: 'terms',
              params: {
                id: 'string',
                missingBucketLabel: 'Missing',
                otherBucketLabel: 'Other',
              },
            },
            params: {},
          },
        ],
        x: {
          accessor: 1,
          aggType: 'terms',
          format: {
            id: 'terms',
            params: {
              id: 'string',
              missingBucketLabel: 'Missing',
              otherBucketLabel: 'Other',
            },
          },
          params: {},
        },
        y: [
          {
            accessor: 2,
            aggType: 'count',
            format: { id: 'number' },
            params: {},
          },
        ],
      },
      enableHover: false,
      invertColors: false,
      legendPosition: 'right',
      percentageMode: false,
      setColorRange: false,
      times: [],
      type: 'heatmap',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            color: 'black',
            overwriteColor: false,
            rotate: 0,
            show: false,
          },
          scale: { defaultYExtents: false, type: 'linear' },
          show: false,
          type: 'value',
        },
      ],
    },
    uiState: {
      vis: {
        defaultColors: {
          '0 - 160': 'rgb(247,251,255)',
          '160 - 320': 'rgb(227,238,249)',
          '320 - 480': 'rgb(208,225,242)',
          '480 - 640': 'rgb(182,212,233)',
          '640 - 800': 'rgb(148,196,223)',
          '800 - 960': 'rgb(107,174,214)',
          '960 - 1,120': 'rgb(74,152,201)',
          '1,120 - 1,280': 'rgb(46,126,188)',
          '1,280 - 1,440': 'rgb(23,100,171)',
          '1,440 - 1,600': 'rgb(8,74,145)',
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
          enabled: true,
          id: '1',
          params: {},
          schema: 'metric',
          type: 'count',
        },
        {
          enabled: true,
          id: '3',
          params: {
            customLabel: 'Requirement',
            field: 'rule.nist_800_53',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            size: 10,
          },
          schema: 'group',
          type: 'terms',
        },
        {
          enabled: true,
          id: '2',
          params: {
            customLabel: 'Agent',
            field: 'agent.id',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            size: 5,
          },
          schema: 'segment',
          type: 'terms',
        },
      ],
    },
  };
};

const getVisStateMetrics = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-Metrics',
    title: 'Stats',
    type: 'metric',
    params: {
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
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
          fontSize: 20,
        },
      },
      dimensions: {
        metrics: [
          {
            type: 'vis_dimension',
            accessor: 0,
            format: { id: 'number', params: {} },
          },
          {
            type: 'vis_dimension',
            accessor: 1,
            format: { id: 'number', params: {} },
          },
        ],
      },
      addTooltip: true,
      addLegend: false,
      type: 'metric',
    },
    uiState: {},
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
          schema: 'metric',
          params: { customLabel: 'Total alerts' },
        },
        {
          id: '2',
          enabled: true,
          type: 'max',
          schema: 'metric',
          params: {
            field: 'rule.level',
            customLabel: 'Max rule level detected',
          },
        },
      ],
    },
  };
};

const getVisStateTopRequirements = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-NIST-Top-10-requirements',
    title: 'Top 10 requirements',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
        buckets: [
          {
            accessor: 0,
            format: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.nist_800_53',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
      ],
    },
  };
};

const getVisStateAgentStats = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-NIST-Stats',
    title: 'Stats',
    type: 'metric',
    params: {
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
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
          fontSize: 20,
        },
      },
      dimensions: {
        metrics: [
          {
            type: 'vis_dimension',
            accessor: 0,
            format: { id: 'number', params: {} },
          },
          {
            type: 'vis_dimension',
            accessor: 1,
            format: { id: 'number', params: {} },
          },
        ],
      },
      addTooltip: true,
      addLegend: false,
      type: 'metric',
    },
    uiState: {},
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
          schema: 'metric',
          params: { customLabel: 'Total alerts' },
        },
        {
          id: '3',
          enabled: true,
          type: 'max',
          schema: 'metric',
          params: { field: 'rule.level', customLabel: 'Max rule level' },
        },
      ],
    },
  };
};

const getVisStateAgentTopRequirements = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-NIST-top-10-requirements',
    title: 'Top 10 requirements',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
      dimensions: {
        metric: {
          accessor: 0,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
      },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.nist_800_53',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
      ],
    },
  };
};

const getVisStateAgentRuleLevelDistribution = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-NIST-Requirement-by-level',
    title: 'Requirements distributed by level',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, rotate: 0, filter: true, truncate: 200 },
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
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 75, filter: true, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      dimensions: {
        x: {
          accessor: 0,
          format: {
            id: 'terms',
            params: {
              id: 'string',
              otherBucketLabel: 'Other',
              missingBucketLabel: 'Missing',
            },
          },
          params: {},
          aggType: 'terms',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
          {
            accessor: 1,
            format: {
              id: 'terms',
              params: {
                id: 'number',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
      labels: { show: false },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.nist_800_53',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Level',
          },
        },
      ],
    },
  };
};

const getVisStateAgentRequirementsOverTime = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-NIST-Requirements-stacked-overtime',
    title: 'Requirements over time',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: true, valueAxis: 'ValueAxis-1' },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
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
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: { show: false },
      dimensions: {
        x: {
          accessor: 0,
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
          params: {
            date: true,
            interval: 'PT1H',
            format: 'YYYY-MM-DD HH:mm',
            bounds: {
              min: '2019-08-19T09:46:35.795Z',
              max: '2019-08-23T09:46:35.795Z',
            },
          },
          aggType: 'date_histogram',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
          {
            accessor: 1,
            format: {
              id: 'terms',
              params: {
                id: 'string',
                otherBucketLabel: 'Other',
                missingBucketLabel: 'Missing',
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    uiState: {},
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
          schema: 'metric',
          params: {},
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.hipaa',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirement',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-4d', to: 'now' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'Timestamp',
          },
        },
      ],
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const overviewDashboard = {
    g1: {
      gridData: {
        w: 11,
        h: 14,
        x: 0,
        y: 0,
        i: 'g1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g1',
        savedVis: getVisStateMostActiveAgents(indexPatternId),
      },
    },
    g2: {
      gridData: {
        w: 24,
        h: 14,
        x: 11,
        y: 0,
        i: 'g2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g2',
        savedVis: getVisStateRequirementsOverTime(indexPatternId),
      },
    },
    g3: {
      gridData: {
        w: 13,
        h: 14,
        x: 35,
        y: 0,
        i: 'g3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g3',
        savedVis: getVisStateRequirementsByAgents(indexPatternId),
      },
    },
    g4: {
      gridData: {
        w: 24,
        h: 12,
        x: 0,
        y: 14,
        i: 'g4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g4',
        savedVis: getVisStateRequirementsAgentsHeatmap(indexPatternId),
      },
    },
    g5: {
      gridData: {
        w: 11,
        h: 12,
        x: 24,
        y: 14,
        i: 'g5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g5',
        savedVis: getVisStateMetrics(indexPatternId),
      },
    },
    g6: {
      gridData: {
        w: 13,
        h: 12,
        x: 35,
        y: 14,
        i: 'g6',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g6',
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
    },
  };

  const agentDashboard = {
    a1: {
      gridData: {
        w: 12,
        h: 11,
        x: 0,
        y: 0,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateAgentStats(indexPatternId),
      },
    },
    a2: {
      gridData: {
        w: 12,
        h: 11,
        x: 12,
        y: 0,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateAgentTopRequirements(indexPatternId),
      },
    },
    a3: {
      gridData: {
        w: 24,
        h: 11,
        x: 24,
        y: 0,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
    },
    a4: {
      gridData: {
        w: 48,
        h: 11,
        x: 0,
        y: 11,
        i: 'a4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a4',
        savedVis: getVisStateAgentRequirementsOverTime(indexPatternId),
      },
    },
  };
  return isPinnedAgent ? agentDashboard : overviewDashboard;
};
