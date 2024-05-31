import { DashboardPanelState } from '../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../src/plugins/embeddable/public';

const getVisStateTopRequirements = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-PCI-DSS-requirements',
    title: 'Top 10 PCI DSS requirements',
    type: 'line',
    params: {
      type: 'line',
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
          drawLinesBetweenPoints: false,
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
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
          params: { date: true, interval: 'P1D', format: 'YYYY-MM-DD' },
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
        z: [
          {
            accessor: 3,
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
      radiusRatio: 50,
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
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-1h', to: 'now' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.pci_dss',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'count',
          schema: 'radius',
          params: {},
        },
      ],
    },
  };
};

const getVisStateTopAgentsByCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-PCI-DSS-Agents',
    title: 'Top 10 agents by alerts count',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
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
            size: 10,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateRequirementsHeatmap = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-PCI-DSS-Requirements-Agents-heatmap',
    title: 'Last alerts',
    type: 'heatmap',
    params: {
      type: 'heatmap',
      addTooltip: true,
      addLegend: true,
      enableHover: false,
      legendPosition: 'right',
      times: [],
      colorsNumber: 10,
      colorSchema: 'Greens',
      setColorRange: false,
      colorsRange: [],
      invertColors: false,
      percentageMode: false,
      valueAxes: [
        {
          show: false,
          id: 'ValueAxis-1',
          type: 'value',
          scale: { type: 'linear', defaultYExtents: false },
          labels: {
            show: false,
            rotate: 0,
            overwriteColor: false,
            color: '#555',
          },
        },
      ],
    },
    uiState: {
      vis: {
        defaultColors: {
          '0 - 13': 'rgb(247,252,245)',
          '13 - 26': 'rgb(233,247,228)',
          '26 - 39': 'rgb(211,238,205)',
          '39 - 52': 'rgb(184,227,177)',
          '52 - 65': 'rgb(152,213,148)',
          '65 - 78': 'rgb(116,196,118)',
          '78 - 91': 'rgb(75,176,98)',
          '91 - 104': 'rgb(47,152,79)',
          '104 - 117': 'rgb(21,127,59)',
          '117 - 130': 'rgb(0,100,40)',
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
          schema: 'metric',
          params: {},
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.pci_dss',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirements',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'agent.name',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Agents',
          },
        },
      ],
    },
  };
};

const getVisStateRequirementsByAgent = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-PCI-DSS-Requirements-by-agent',
    title: 'Requirements by agent',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
        style: {
          color: '#eee',
        },
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
            rotate: 0,
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
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: {
            label: 'Count',
            id: '1',
          },
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
      radiusRatio: 51,
      labels: {
        show: false,
      },
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
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
          params: {},
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'agent.name',
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
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'rule.pci_dss',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Requirements',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateAgentTopRuleGroups = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-PCI-Groups',
    title: 'Top 5 rule groups',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
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
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.groups',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateAgentTopRules = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-PCI-Rule',
    title: 'Top 5 rules',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
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
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.description',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateAgentTopRequirements = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-PCI-Requirement',
    title: 'Top 5 PCI DSS requirements',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
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
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.pci_dss',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateAgentTopRequirementsCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-PCI-Requirements',
    title: 'PCI DSS requirements',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false, style: { color: '#eee' } },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100, rotate: 0 },
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
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'rule.pci_dss',
            size: 5,
            order: 'desc',
            orderBy: '1',
            customLabel: '',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.pci_dss',
            size: 10,
            order: 'desc',
            orderBy: '1',
            customLabel: 'PCI DSS Requirements',
          },
        },
      ],
    },
  };
};

const getVisStateAgentRuleLevelDistribution = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-PCI-Rule-level-distribution',
    title: 'Rule level distribution',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: true, values: true, last_level: true, truncate: 100 },
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
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.level',
            size: 15,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
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
        w: 24,
        h: 14,
        x: 0,
        y: 0,
        i: 'g1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g1',
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
    },
    g2: {
      gridData: {
        w: 24,
        h: 14,
        x: 24,
        y: 0,
        i: 'g2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g2',
        savedVis: getVisStateTopAgentsByCount(indexPatternId),
      },
    },
    g3: {
      gridData: {
        w: 48,
        h: 19,
        x: 0,
        y: 14,
        i: 'g3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g3',
        savedVis: getVisStateRequirementsHeatmap(indexPatternId),
      },
    },
    g4: {
      gridData: {
        w: 48,
        h: 9,
        x: 0,
        y: 33,
        i: 'g4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g4',
        savedVis: getVisStateRequirementsByAgent(indexPatternId),
      },
    },
  };

  const agentDashboard = {
    a1: {
      gridData: {
        w: 16,
        h: 11,
        x: 0,
        y: 0,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateAgentTopRuleGroups(indexPatternId),
      },
    },
    a2: {
      gridData: {
        w: 16,
        h: 11,
        x: 16,
        y: 0,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateAgentTopRules(indexPatternId),
      },
    },
    a3: {
      gridData: {
        w: 16,
        h: 11,
        x: 32,
        y: 0,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateAgentTopRequirements(indexPatternId),
      },
    },
    a4: {
      gridData: {
        w: 35,
        h: 11,
        x: 0,
        y: 11,
        i: 'a4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a4',
        savedVis: getVisStateAgentTopRequirementsCount(indexPatternId),
      },
    },
    a5: {
      gridData: {
        w: 13,
        h: 11,
        x: 35,
        y: 11,
        i: 'a5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a5',
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
    },
  };

  return isPinnedAgent ? agentDashboard : overviewDashboard;
};
