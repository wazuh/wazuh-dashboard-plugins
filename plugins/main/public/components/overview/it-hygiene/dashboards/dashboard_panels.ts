import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisState = (indexPatternId: string) => {
  return {
    id: 'most_detected_vulnerabilities',
    title: 'Most common vulnerability score',
    type: 'horizontal_bar',
    params: {
      addLegend: false,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 200,
          },
          position: 'left',
          scale: {
            type: 'linear',
          },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      grid: {
        categoryLines: false,
        valueAxis: '',
      },
      labels: {
        show: false,
      },
      legendPosition: 'right',
      seriesParams: [
        {
          data: {
            id: '1',
            label: 'Count',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
      ],
      thresholdLine: {
        color: '#E7664C',
        show: false,
        style: 'full',
        value: 10,
        width: 1,
      },
      times: [],
      type: 'histogram',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: true,
            rotate: 75,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'bottom',
          scale: {
            mode: 'normal',
            type: 'linear',
          },
          show: true,
          style: {},
          title: {
            text: 'Count',
          },
          type: 'value',
        },
      ],
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
            field: 'vulnerability.score.base',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Vulnerability base score',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateTopVulnerableOSFamilies = (indexPatternId: string) => {
  return {
    id: 'most_vulnerable_endpoints_vulnerabilities',
    title: 'Most vulnerable OS families',
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
      addLegend: false,
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
            field: 'host.os.type',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Host OS type',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisState(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisState(indexPatternId),
      },
    },
  };
};
