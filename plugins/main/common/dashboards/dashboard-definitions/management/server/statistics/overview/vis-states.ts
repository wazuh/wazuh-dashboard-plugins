import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../../../lib';
import type { SavedVis } from '../../../../../types';

export const getVisStateQueueUsage = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-queues-usage',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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

export const getVisStateEventsDecodedSummary = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-overview-events-decoded',
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
          lineWidth: 4,
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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

export const getVisStateSyscheck = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-syscheck',
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
        show: false,
        style: 'dashed',
        value: 100,
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
            defaultYExtents: true,
            mode: 'normal',
            setYExtents: false,
            type: 'linear',
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
            max: 100,
            min: 0,
            mode: 'normal',
            setYExtents: true,
            type: 'linear',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            json: JSON.stringify({
              script: {
                source: /* python */ `
                  def usage = doc['analysisd.syscheck_queue_usage'];
                  def finalUsage = usage.size() > 0 ? usage.value : 0;
                  return finalUsage * 100;
                `,
              },
            }),
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'max',
          params: {
            field: 'analysisd.syscheck_queue_size',
            customLabel: 'Queue Size',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateSyscollector = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-syscollector',
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
            defaultYExtents: true,
            mode: 'normal',
            setYExtents: false,
            type: 'linear',
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
            max: 100,
            min: 0,
            mode: 'normal',
            setYExtents: true,
            type: 'linear',
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
        show: false,
        style: 'dashed',
        value: 100,
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            json: JSON.stringify({
              script: {
                source: /* python */ `
                  def usage = doc['analysisd.syscheck_queue_usage'];
                  def finalUsage = usage.size() > 0 ? usage.value : 0;
                  return finalUsage * 100;
                `,
              },
            }),
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'max',
          params: {
            field: 'analysisd.syscheck_queue_size',
            customLabel: 'Queue Size',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateRootcheck = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-rootcheck',
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
            defaultYExtents: true,
            mode: 'normal',
            setYExtents: false,
            type: 'linear',
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
            max: 100,
            min: 0,
            mode: 'normal',
            setYExtents: true,
            type: 'linear',
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
        show: false,
        style: 'dashed',
        value: 100,
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            json: JSON.stringify({
              script: {
                source: /* python */ `
                  def usage = doc['analysisd.syscheck_queue_usage'];
                  def finalUsage = usage.size() > 0 ? usage.value : 0;
                  return finalUsage * 100;
                `,
              },
            }),
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'max',
          params: {
            field: 'analysisd.syscheck_queue_size',
            customLabel: 'Queue Size',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateSCA = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-sca',
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
            defaultYExtents: true,
            mode: 'normal',
            setYExtents: false,
            type: 'linear',
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
            max: 100,
            min: 0,
            mode: 'normal',
            setYExtents: true,
            type: 'linear',
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
        show: false,
        style: 'dashed',
        value: 100,
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            json: JSON.stringify({
              script: {
                source: /* python */ `
                  def usage = doc['analysisd.syscheck_queue_usage'];
                  def finalUsage = usage.size() > 0 ? usage.value : 0;
                  return finalUsage * 100;
                `,
              },
            }),
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'max',
          params: {
            field: 'analysisd.syscheck_queue_size',
            customLabel: 'Queue Size',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateHostInfo = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-hostinfo',
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
        show: false,
        style: 'dashed',
        value: 100,
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
            defaultYExtents: true,
            mode: 'normal',
            setYExtents: false,
            type: 'linear',
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
            max: 100,
            min: 0,
            mode: 'normal',
            setYExtents: true,
            type: 'linear',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            json: JSON.stringify({
              script: {
                source: /* python */ `
                  def usage = doc['analysisd.syscheck_queue_usage'];
                  def finalUsage = usage.size() > 0 ? usage.value : 0;
                  return finalUsage * 100;
                `,
              },
            }),
            customLabel: 'Queue Usage %',
          },
          schema: 'metric',
        },
        {
          id: '5',
          enabled: true,
          type: 'max',
          params: {
            field: 'analysisd.syscheck_queue_size',
            customLabel: 'Queue Size',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

/* Overview visualizations by node */

export const getVisStateEventsProcessedByNode = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-events-by-node',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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

export const getVisStateEventsDroppedByNode = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-statistics-analysisd-events-dropped-by-node',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
