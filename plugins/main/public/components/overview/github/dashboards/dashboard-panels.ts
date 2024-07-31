import { DashboardPanelState } from '../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../src/plugins/embeddable/public';

const getVisStateAlertsEvolutionByOrganization = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GitHub-Alerts-Evolution-By-Organization',
    title: 'Alerts evolution by organization',
    type: 'area',
    params: {
      type: 'area',
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
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
      labels: {},
      orderBucketsBySum: false,
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
            field: 'data.github.org',
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
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-7d',
              to: 'now',
            },
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: '',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateTopOrganizationsByAlertCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GitHub-Top-5-Organizations-By-Alerts',
    title: 'Top 5 organizations by alerts',
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
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateActionTypeByOrganization = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GitHub-Alert-Action-Type-By-Organization',
    title: 'Top alerts by action type and organization',
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
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.action',
            orderBy: '1',
            order: 'desc',
            size: 3,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateUsersWithMoreAlerts = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GitHub-Users-With-More-Alerts',
    title: 'Users with more alerts',
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
          type: 'histogram',
          mode: 'stacked',
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
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.actor',
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

const getVisStateAgentAlertsEvolutionByOrganization = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Agents-GitHub-Alerts-Evolution-By-Organization',
    title: 'Alerts evolution by organization',
    type: 'area',
    params: {
      type: 'area',
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
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
      labels: {},
      orderBucketsBySum: false,
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
            field: 'data.github.org',
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
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-7d',
              to: 'now',
            },
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: '',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateAgentTopOrganizationsByAlertCount = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Agents-GitHub-Top-5-Organizations-By-Alerts',
    title: 'Top 5 organizations by alerts',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: false,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
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
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateAgentActionTypeByOrganization = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GitHub-Alert-Action-Type-By-Organization',
    title: 'Top alerts by action type and organization',
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
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.action',
            orderBy: '1',
            order: 'desc',
            size: 3,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateAgentUsersWithMoreAlerts = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GitHub-Users-With-More-Alerts',
    title: 'Users with more alerts',
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
          type: 'histogram',
          mode: 'stacked',
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
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.org',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.github.actor',
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

const getVisStateMetricOrganizationsCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-GitHub-Metric-Organizations-Count',
    title: '',
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
            type: 'range',
            from: 0,
            to: 0,
          },
          {
            type: 'range',
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
          subText: '',
          fontSize: 40,
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
          type: 'cardinality',
          params: {
            field: 'data.github.org',
            customLabel: 'Organizations',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateMetricRepositoriesCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-GitHub-Metric-Repositories-Count',
    title: '',
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
            type: 'range',
            from: 0,
            to: 0,
          },
          {
            type: 'range',
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
          fontSize: 40,
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
          type: 'cardinality',
          params: {
            field: 'data.github.repo',
            customLabel: 'Repositories',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateMetricActorsCount = (indexPatternId: string) => {
  return {
    id: 'Wazuh-GitHub-Metric-Actors-Count',
    title: '',
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
            type: 'range',
            from: 0,
            to: 0,
          },
          {
            type: 'range',
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
          fontSize: 40,
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
          type: 'cardinality',
          params: {
            field: 'data.github.actor',
            customLabel: 'Actors',
          },
          schema: 'metric',
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
    g0: {
      gridData: {
        w: 16,
        h: 6,
        x: 0,
        y: 0,
        i: 'g0',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g0',
        savedVis: getVisStateMetricOrganizationsCount(indexPatternId),
      },
    },
    g1: {
      gridData: {
        w: 16,
        h: 6,
        x: 16,
        y: 0,
        i: 'g1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g1',
        savedVis: getVisStateMetricRepositoriesCount(indexPatternId),
      },
    },
    g2: {
      gridData: {
        w: 16,
        h: 6,
        x: 32,
        y: 0,
        i: 'g2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g2',
        savedVis: getVisStateMetricActorsCount(indexPatternId),
      },
    },
    g3: {
      gridData: {
        w: 29,
        h: 13,
        x: 0,
        y: 6,
        i: 'g3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g3',
        savedVis: getVisStateAlertsEvolutionByOrganization(indexPatternId),
      },
    },
    g4: {
      gridData: {
        w: 19,
        h: 13,
        x: 29,
        y: 6,
        i: 'g4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g4',
        savedVis: getVisStateTopOrganizationsByAlertCount(indexPatternId),
      },
    },
    g5: {
      gridData: {
        w: 19,
        h: 13,
        x: 0,
        y: 19,
        i: 'g5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g5',
        savedVis: getVisStateActionTypeByOrganization(indexPatternId),
      },
    },
    g6: {
      gridData: {
        w: 29,
        h: 13,
        x: 19,
        y: 19,
        i: 'g6',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g6',
        savedVis: getVisStateUsersWithMoreAlerts(indexPatternId),
      },
    },
  };

  const agentDashboard = {
    a1: {
      gridData: {
        w: 16,
        h: 6,
        x: 0,
        y: 0,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateMetricOrganizationsCount(indexPatternId),
      },
    },
    a2: {
      gridData: {
        w: 16,
        h: 6,
        x: 16,
        y: 0,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateMetricRepositoriesCount(indexPatternId),
      },
    },
    a3: {
      gridData: {
        w: 16,
        h: 6,
        x: 32,
        y: 0,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateMetricActorsCount(indexPatternId),
      },
    },
    a4: {
      gridData: {
        w: 29,
        h: 13,
        x: 0,
        y: 6,
        i: 'a4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a4',
        savedVis: getVisStateAgentAlertsEvolutionByOrganization(indexPatternId),
      },
    },
    a5: {
      gridData: {
        w: 19,
        h: 13,
        x: 29,
        y: 6,
        i: 'a5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a5',
        savedVis: getVisStateAgentTopOrganizationsByAlertCount(indexPatternId),
      },
    },
    a6: {
      gridData: {
        w: 19,
        h: 13,
        x: 0,
        y: 19,
        i: 'a6',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a6',
        savedVis: getVisStateAgentActionTypeByOrganization(indexPatternId),
      },
    },
    a7: {
      gridData: {
        w: 29,
        h: 13,
        x: 19,
        y: 19,
        i: 'a7',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a7',
        savedVis: getVisStateAgentUsersWithMoreAlerts(indexPatternId),
      },
    },
  };
  return isPinnedAgent ? agentDashboard : overviewDashboard;
};
