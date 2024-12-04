import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

const getVisStateEventsProcessed = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Events',
    title: 'Events processed',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
          type: 'sum',
          params: {
            field: 'analysisd.events_processed',
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'analysisd.events_processed:*',
                  language: 'kuery',
                },
                label: 'Events processed',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateEventsDropped = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Events-Dropped',
    title: 'Events dropped',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
          type: 'sum',
          params: {
            field: 'analysisd.events_dropped',
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'analysisd.events_dropped:*',
                  language: 'kuery',
                },
                label: 'Events dropped',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateQueueUsage = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Queues-Usage',
    title: 'Queue Usage',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '3',
            label: 'Event queue usage',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '4',
            label: 'Rule matching queue usage',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '5',
            label: 'Alerts log queue usage',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '6',
            label: 'Firewall log queue usage',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '7',
            label: 'Statistical log queue usage',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '8',
            label: 'Archives queue usage',
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
    uiState: {
      vis: {
        colors: {
          'Alerts log queue usage': '#7EB26D',
          'Archives queue usage': '#EF843C',
          'Event queue usage': '#70DBED',
          'Firewall log queue usage': '#EAB839',
          'Rule matching queue usage': '#D683CE',
          'Statistical log queue usage': '#705DA0',
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
          enabled: false,
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.event_queue_usage',
            customLabel: 'Event queue usage',
          },
          schema: 'metric',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.rule_matching_queue_usage',
            customLabel: 'Rule matching queue usage',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.alerts_queue_usage',
            customLabel: 'Alerts log queue usage',
          },
          schema: 'metric',
        },
        {
          id: '6',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.firewall_queue_usage',
            customLabel: 'Firewall log queue usage',
          },
          schema: 'metric',
        },
        {
          id: '7',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.statistical_queue_usage',
            customLabel: 'Statistical log queue usage',
          },
          schema: 'metric',
        },
        {
          id: '8',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.archives_queue_usage',
            customLabel: 'Archives queue usage',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateEventsDecodedSummary = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Overview-Events-Decoded',
    title: 'Events decoded summary',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '3',
            label: 'Syscheck Events Decoded',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '4',
            label: 'Syscollector Events Decoded',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '5',
            label: 'Rootcheck Events Decoded',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '6',
            label: 'SCA Events Decoded',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '7',
            label: 'Other Events Decoded',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '8',
            label: 'Host Info Events Decoded',
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
    uiState: {
      vis: {
        colors: {
          'Syscheck Events Decoded': '#70DBED',
          'Other Events Decoded': '#705DA0',
          'Rootcheck Events Decoded': '#7EB26D',
          'SCA Events Decoded': '#EAB839',
          'Syscollector Events Decoded': '#D683CE',
          'Host Info Events Decoded': '#EF843C',
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
          enabled: false,
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscheck_events_decoded',
            customLabel: 'Syscheck Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscollector_events_decoded',
            customLabel: 'Syscollector Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.rootcheck_events_decoded',
            customLabel: 'Rootcheck Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '6',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.sca_events_decoded',
            customLabel: 'SCA Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '7',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.other_events_decoded',
            customLabel: 'Other Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '8',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.hostinfo_events_decoded',
            customLabel: 'Host Info Events Decoded',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateSyscheck = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Syscheck',
    title: 'Syscheck',
    type: 'line',
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: true,
            show: true,
            truncate: 100,
          },
          position: 'bottom',
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
      labels: {},
      legendPosition: 'right',
      seriesParams: [
        {
          data: {
            id: '1',
            label: 'Syscheck Events Decoded',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'line',
          valueAxis: 'ValueAxis-1',
        },
        {
          data: {
            id: '2',
            label: 'Syscheck EDPS',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'line',
          valueAxis: 'ValueAxis-1',
        },
        {
          data: {
            id: '3',
            label: 'Queue Usage %',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: false,
          type: 'line',
          valueAxis: 'ValueAxis-2',
        },
      ],
      thresholdLine: {
        color: '#E24D42',
        show: true,
        style: 'dashed',
        value: 16384 * 0.9, // TODO:
        width: 1,
      },
      times: [],
      type: 'line',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'left',
          scale: {
            defaultYExtents: false,
            mode: 'normal',
            type: 'linear',
            setYExtents: true,
            max: 16384, // TODO:
          },
          show: true,
          style: {},
          title: {
            text: 'Count',
          },
          type: 'value',
        },
        {
          id: 'ValueAxis-2',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 100,
          },
          name: 'RightAxis-1',
          position: 'right',
          scale: {
            defaultYExtents: false,
            mode: 'normal',
            type: 'linear',
            setYExtents: true,
            min: 0,
            max: 100,
          },
          show: true,
          style: {},
          title: {
            text: 'Queue usage %',
          },
          type: 'value',
        },
      ],
    },
    uiState: {
      vis: {
        colors: {
          'Queue Usage %': '#7EB26D',
          'Syscheck EDPS': '#D683CE',
          'Syscheck Events Decoded': '#70DBED',
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
          type: 'avg',
          params: {
            field: 'analysisd.syscheck_events_decoded',
            customLabel: 'Syscheck Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscheck_edps',
            customLabel: 'Syscheck EDPS',
          },
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            json: '',
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscheck_queue_usage',
            json: '{\r\n  "script": {\r\n      "source": "def size = doc[\'analysisd.syscheck_queue_size\'];def usage = doc[\'analysisd.syscheck_queue_usage\'];def finalSize = size.size() > 0 ? size.value : 0;def finalUsage = usage.size() > 0 ? usage.value : 0;return finalUsage/finalSize * 100;"\r\n  }\r\n}',
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateSyscollector = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Syscollector',
    title: 'Syscollector',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: false,
        valueAxis: '',
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
            defaultYExtents: false,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            max: 16384, // TODO:
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
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value',
          position: 'right',
          show: true,
          style: {},
          scale: {
            defaultYExtents: false,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            min: 0,
            max: 100,
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Queue usage %',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Syscollector Events Decoded',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '2',
            label: 'Syscollector EDPS',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '3',
            label: 'Queue Usage %',
          },
          valueAxis: 'ValueAxis-2',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: false,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        color: '#E24D42',
        show: true,
        style: 'dashed',
        value: 16384 * 0.9, // TODO:
        width: 1,
      },
    },
    uiState: {
      vis: {
        colors: {
          'Queue Usage %': '#7EB26D',
          'Syscollector EDPS': '#D683CE',
          'Syscollector Events Decoded': '#70DBED',
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
          type: 'avg',
          params: {
            field: 'analysisd.syscollector_events_decoded',
            customLabel: 'Syscollector Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscollector_edps',
            customLabel: 'Syscollector EDPS',
          },
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            json: '',
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.syscollector_queue_usage',
            json: '{\r\n  "script": {\r\n      "source": "def size = doc[\'analysisd.syscollector_queue_size\'];def usage = doc[\'analysisd.syscollector_queue_usage\'];def finalSize = size.size() > 0 ? size.value : 0;def finalUsage = usage.size() > 0 ? usage.value : 0;return finalUsage/finalSize * 100;"\r\n  }\r\n}',
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateRootcheck = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Rootcheck',
    title: 'Rootcheck',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: false,
        valueAxis: '',
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
            defaultYExtents: false,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            max: 16384, // TODO:
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
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value',
          position: 'right',
          show: true,
          style: {},
          scale: {
            defaultYExtents: false,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            min: 0,
            max: 100,
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Queue usage %',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Rootcheck Events Decoded',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '2',
            label: 'Rootcheck EDPS',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '3',
            label: 'Queue Usage %',
          },
          valueAxis: 'ValueAxis-2',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: false,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        color: '#E24D42',
        show: true,
        style: 'dashed',
        value: 16384 * 0.9, // TODO:
        width: 1,
      },
    },
    uiState: {
      vis: {
        colors: {
          'Queue Usage %': '#7EB26D',
          'Rootcheck EDPS': '#D683CE',
          'Rootcheck Events Decoded': '#70DBED',
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
          type: 'avg',
          params: {
            field: 'analysisd.rootcheck_events_decoded',
            customLabel: 'Rootcheck Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.rootcheck_edps',
            customLabel: 'Rootcheck EDPS',
          },
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            json: '',
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.rootcheck_queue_usage',
            json: '{\r\n  "script": {\r\n      "source": "def size = doc[\'analysisd.rootcheck_queue_size\'];def usage = doc[\'analysisd.rootcheck_queue_usage\'];def finalSize = size.size() > 0 ? size.value : 0;def finalUsage = usage.size() > 0 ? usage.value : 0;return finalUsage/finalSize * 100;"\r\n  }\r\n}',
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateSCA = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-SCA',
    title: 'SCA',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: false,
        valueAxis: '',
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
            defaultYExtents: false,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            max: 16384, // TODO:
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
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value',
          position: 'right',
          show: true,
          style: {},
          scale: {
            defaultYExtents: false,
            min: 0,
            type: 'linear',
            mode: 'normal',
            setYExtents: true,
            max: 100,
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Queue usage %',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'SCA Events Decoded',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '2',
            label: 'SCA EDPS',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: true,
        },
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            id: '3',
            label: 'Queue Usage %',
          },
          valueAxis: 'ValueAxis-2',
          drawLinesBetweenPoints: true,
          lineWidth: 4,
          interpolate: 'linear',
          showCircles: false,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        color: '#E24D42',
        show: true,
        style: 'dashed',
        value: 16384 * 0.9, // TODO:
        width: 1,
      },
    },
    uiState: {
      vis: {
        colors: {
          'Queue Usage %': '#7EB26D',
          'SCA EDPS': '#D683CE',
          'SCA Events Decoded': '#70DBED',
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
          type: 'avg',
          params: {
            field: 'analysisd.sca_events_decoded',
            customLabel: 'SCA Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.sca_edps',
            customLabel: 'SCA EDPS',
          },
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            json: '',
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.sca_queue_usage',
            json: '{\r\n  "script": {\r\n      "source": "def size = doc[\'analysisd.sca_queue_size\'];def usage = doc[\'analysisd.sca_queue_usage\'];def finalSize = size.size() > 0 ? size.value : 0;def finalUsage = usage.size() > 0 ? usage.value : 0;return finalUsage/finalSize * 100;"\r\n  }\r\n}',
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

const getVisStateHostInfo = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-HostInfo',
    title: 'Host Info',
    type: 'line',
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: true,
            show: true,
            truncate: 100,
          },
          position: 'bottom',
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
      labels: {},
      legendPosition: 'right',
      seriesParams: [
        {
          data: {
            id: '1',
            label: 'Host info Events Decoded',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'line',
          valueAxis: 'ValueAxis-1',
        },
        {
          data: {
            id: '2',
            label: 'Host info EDPS',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'line',
          valueAxis: 'ValueAxis-1',
        },
        {
          data: {
            id: '3',
            label: 'Queue Usage %',
          },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          lineWidth: 4,
          mode: 'normal',
          show: true,
          showCircles: false,
          type: 'line',
          valueAxis: 'ValueAxis-2',
        },
      ],
      thresholdLine: {
        color: '#E24D42',
        show: true,
        style: 'dashed',
        value: 16384 * 0.9, // TODO:
        width: 1,
      },
      times: [],
      type: 'line',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'left',
          scale: {
            defaultYExtents: false,
            mode: 'normal',
            type: 'linear',
            setYExtents: true,
            max: 16384, // TODO:
          },
          show: true,
          style: {},
          title: {
            text: 'Count',
          },
          type: 'value',
        },
        {
          id: 'ValueAxis-2',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 100,
          },
          name: 'RightAxis-1',
          position: 'right',
          scale: {
            defaultYExtents: false,
            min: 0,
            mode: 'normal',
            type: 'linear',
            setYExtents: true,
            max: 100,
          },
          show: true,
          style: {},
          title: {
            text: 'Queue usage %',
          },
          type: 'value',
        },
      ],
    },
    uiState: {
      vis: {
        colors: {
          'Queue Usage %': '#7EB26D',
          'Host info EDPS': '#D683CE',
          'Host info Events Decoded': '#70DBED',
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
          type: 'avg',
          params: {
            field: 'analysisd.hostinfo_events_decoded',
            customLabel: 'Host info Events Decoded',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.hostinfo_edps',
            customLabel: 'Host info EDPS',
          },
          schema: 'metric',
        },
        {
          id: '3',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            json: '',
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'avg',
          params: {
            field: 'analysisd.hostinfo_queue_usage',
            json: '{\r\n  "script": {\r\n      "source": "def size = doc[\'analysisd.hostinfo_queue_size\'];def usage = doc[\'analysisd.hostinfo_queue_usage\'];def finalSize = size.size() > 0 ? size.value : 0;def finalUsage = usage.size() > 0 ? usage.value : 0;return finalUsage/finalSize * 100;"\r\n  }\r\n}',
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

/* Overview visualizations by node */

const getVisStateEventsProcessedByNode = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Events-By-Node',
    title: 'Events processed',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
          type: 'sum',
          params: {
            field: 'analysisd.events_processed',
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '4',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'analysisd.events_processed:*',
                  language: 'kuery',
                },
                label: 'Events processed by node',
              },
            ],
          },
          schema: 'group',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'nodeName.keyword',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: '',
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateEventsDroppedByNode = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Statistics-Analysisd-Events-Dropped-By-Node',
    title: 'Events dropped',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
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
          type: 'sum',
          params: {
            field: 'analysisd.events_dropped',
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
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: 'timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'analysisd.events_dropped:*',
                  language: 'kuery',
                },
                label: 'Events dropped by node',
              },
            ],
          },
          schema: 'group',
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'nodeName.keyword',
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

/* Definition of panels */

export const getDashboardPanelsAnalysisEngine = (
  indexPatternId: string,
  isClusterMode: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const clusterModePanels = {
    '10': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 0,
        i: '10',
      },
      type: 'visualization',
      explicitInput: {
        id: '10',
        savedVis: getVisStateEventsProcessedByNode(indexPatternId),
      },
    },
    '11': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 0,
        i: '11',
      },
      type: 'visualization',
      explicitInput: {
        id: '11',
        savedVis: getVisStateEventsDroppedByNode(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 13,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateQueueUsage(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 26,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateEventsDecodedSummary(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 39,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateSyscheck(indexPatternId),
      },
    },
    '6': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 39,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateSyscollector(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 52,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateRootcheck(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 52,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateSCA(indexPatternId),
      },
    },
    '9': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 65,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateHostInfo(indexPatternId),
      },
    },
  };

  const panels = {
    '1': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateEventsProcessed(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateEventsDropped(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 13,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateQueueUsage(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 26,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateEventsDecodedSummary(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 39,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateSyscheck(indexPatternId),
      },
    },
    '6': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 39,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateSyscollector(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 52,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateRootcheck(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 52,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateSCA(indexPatternId),
      },
    },
    '9': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 65,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateHostInfo(indexPatternId),
      },
    },
  };

  return isClusterMode ? clusterModePanels : panels;
};
