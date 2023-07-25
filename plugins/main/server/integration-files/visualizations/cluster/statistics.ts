/*
 * Wazuh app - Cluster monitoring visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default [
  {
    _id: 'Wazuh-App-Statistics-remoted-Recv-bytes',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted Recv bytes',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics remoted Recv bytes',
        type: 'line',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.recv_bytes',
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
                from: 'now-24h',
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
                    query: 'remoted.recv_bytes:*',
                    language: 'kuery',
                  },
                  label: 'recv_bytes',
                },
              ],
            },
            schema: 'group',
          },
        ],
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
          row: true,
        },
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-remoted-event-count',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted event count',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics remoted event count',
        type: 'line',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.evt_count',
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
                    query: 'remoted.evt_count:*',
                    language: 'kuery',
                  },
                  label: 'evt_count',
                },
              ],
            },
            schema: 'group',
          },
        ],
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-remoted-messages',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted messages',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics remoted messages',
        type: 'line',
        aggs: [
          {
            id: '7',
            enabled: false,
            type: 'count',
            params: {
              customLabel: 'Count',
            },
            schema: 'metric',
          },
          {
            id: '8',
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
            id: '12',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.msg_sent',
              customLabel: 'msg_sent',
            },
            schema: 'metric',
          },
          {
            id: '13',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.ctrl_msg_count',
              customLabel: 'msg_count',
            },
            schema: 'metric',
          },
          {
            id: '14',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.discarded_count',
              customLabel: 'discarded_count',
            },
            schema: 'metric',
          },
          {
            id: '15',
            enabled: true,
            type: 'avg',
            params: {
              field: 'remoted.dequeued_after_close',
              customLabel: 'dequeued_after_close',
            },
            schema: 'metric',
          },
        ],
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
                id: '7',
                label: 'Count',
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
                id: '12',
                label: 'msg_sent',
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
                id: '13',
                label: 'msg_count',
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
                id: '14',
                label: 'discarded_count',
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
                id: '15',
                label: 'dequeued_after_close',
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
          radiusRatio: 50,
        },
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-remoted-tcp-sessions',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted tcp sessions',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics remoted tcp sessions',
        type: 'line',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'sum',
            params: {
              field: 'remoted.tcp_sessions',
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
                from: 'now-24h',
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
                    query: 'remoted.tcp_sessions:*',
                    language: 'kuery',
                  },
                  label: 'tcp_sessions',
                },
              ],
            },
            schema: 'group',
          },
        ],
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Overview-Events-Decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Overview events decoded',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Overview events decoded',
        type: 'line',
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
              customLabel: ' Syscheck Events Decoded',
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
                label: ' Syscheck Events Decoded',
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Syscheck',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Syscheck',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Syscheck',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_events_decoded, q='*').label('Syscheck Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_edps, q='*').label('Syscheck EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage, q='*') ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Syscollector',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Syscollector',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Syscollector',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_events_decoded, q='*').label('syscollector Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_edps, q='*').label('syscollector EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage, q='*') ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Rootcheck',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Rootcheck',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Rootcheck',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_events_decoded, q='*').label('Rootcheck Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_edps, q='*').label('Rootcheck EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage) ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-SCA',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics SCA',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics SCA',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_events_decoded, q='*').label('SCA Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_edps, q='*').label('SCA EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.sca_queue_usage, q='*') ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-HostInfo',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics HostInfo',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics HostInfo',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_events_decoded, q='*').label('Host info Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_edps, q='*').label('Host info EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage, q='*') ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Other',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Other',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Other',
        type: 'timelion',
        params: {
          expression:
            ".es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_events_decoded, q='*').label('Host info Events Decoded'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_edps, q='*').label('Host info EDPS'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_usage, q='*') ).label('Queue Usage').color('green'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_usage, q='*').if(gte, 0.7, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_usage, q='*') ), null) .color('#FFCC11').label('Queue Usage 70%+'), .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_usage, q='*').if(gte, 0.9, .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_size, q='*').multiply( .es(index=wazuh-statistics-*, timefield=timestamp,metric=avg:analysisd.other_queue_usage, q='*') ), null) .color('red').label('Queue Usage 90%+')",
          interval: '5m',
        },
        aggs: [],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Events-By-Node',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Events by Node',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Events by Node',
        type: 'line',
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
                  label: 'Events processed by Node:',
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Events-Dropped-By-Node',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Events Dropped by Node',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Events Dropped by Node',
        type: 'line',
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
                  label: 'Events dropped by Node:',
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Statistics-Analysisd-Queues-Usage',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics Queues Usage',
      visState: JSON.stringify({
        title: 'Wazuh App Statistics Queues Usage',
        type: 'line',
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
              field: 'analysisd.event_queue_size',
              customLabel: 'Event queue usage',
            },
            schema: 'metric',
          },
          {
            id: '4',
            enabled: true,
            type: 'avg',
            params: {
              field: 'analysisd.rule_matching_queue_size',
              customLabel: 'Rule matching queue usage',
            },
            schema: 'metric',
          },
          {
            id: '5',
            enabled: true,
            type: 'avg',
            params: {
              field: 'analysisd.alerts_queue_size',
              customLabel: 'Alerts log queue usage',
            },
            schema: 'metric',
          },
          {
            id: '6',
            enabled: true,
            type: 'avg',
            params: {
              field: 'analysisd.firewall_queue_size',
              customLabel: 'Firewall log queue usage',
            },
            schema: 'metric',
          },
          {
            id: '7',
            enabled: true,
            type: 'avg',
            params: {
              field: 'analysisd.statistical_queue_size',
              customLabel: 'Statistical log queue usage',
            },
            schema: 'metric',
          },
          {
            id: '8',
            enabled: true,
            type: 'avg',
            params: {
              field: 'analysisd.archives_queue_size',
              customLabel: 'Archives queue usage',
            },
            schema: 'metric',
          },
        ],
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-statistics-*',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
];
