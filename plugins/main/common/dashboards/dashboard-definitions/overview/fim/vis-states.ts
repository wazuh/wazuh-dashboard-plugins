import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../lib';
import type { SavedVis } from '../../../types';

export const getVisStateFIMAlertsByActionOverTime = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-fim-alerts-by-action-over-time',
    title: 'Alerts by action over time',
    type: 'area',
    params: {
      type: 'area',
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
        valueAxis: 'ValueAxis-1',
      },
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
          type: 'area',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          drawLinesBetweenPoints: true,
          showCircles: true,
          interpolate: 'cardinal',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'left',
      times: [],
      addTimeMarker: false,
    },
    uiState: {},
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.event',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            time_zone: 'Europe/Berlin',
            drop_partials: false,
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

export const getVisStateFIMTopAgentsPie = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'overview-fim-top-5-agents',
    title: 'Top 5 agents',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            size: 5,
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

export const getVisStateFIMEventsSummary = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-fim-events-summary',
    title: 'Events summary',
    type: 'line',
    params: {
      type: 'line',
      grid: { categoryLines: true, style: { color: '#eee' } },
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
          title: { text: 'Alerts' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'line',
          mode: 'normal',
          data: { label: 'Alerts', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
    },
    uiState: {},
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          schema: 'metric',
          params: { customLabel: 'Alerts' },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: { field: 'timestamp' },
        },
      ],
    },
  };
};

export const getVisStateFIMTopRules = (indexPatternId: string): SavedVis => {
  return {
    id: 'overview-fim-top-5-rules',
    title: 'Rule distribution',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          schema: 'metric',
          params: { field: 'rule.level' },
        },
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

export const getVisStateFIMCommonActions = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-fim-common-actions',
    title: 'Actions',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.event',
            size: 5,
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

export const getVisStateFIMTopAgentsUser = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-fim-top-agents-user',
    title: 'Top 5 users',
    type: 'table',
    params: {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      sort: { columnIndex: 3, direction: 'desc' },
      showTotal: false,
      showToolbar: true,
      totalFunc: 'sum',
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
    },
    data: {
      searchSource: buildSearchSource(indexPatternId, {
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              negate: false,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'wazuh.integration.decoders',
              value: 'syscheck',
              params: { query: 'syscheck', type: 'phrase' },
            },
            query: {
              match: {
                'wazuh.integration.decoders': { query: 'syscheck', type: 'phrase' },
              },
            },
            $state: { store: 'appState' },
          },
        ],
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
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
          schema: 'bucket',
          params: {
            field: 'syscheck.uname_after',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top user',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'agent.id',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Agent ID',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'agent.name',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Agent name',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentFIMUsers = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-users',
    title: 'Most active users',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: true, values: true, last_level: true, truncate: 100 },
    },
    uiState: {},
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.uname_after',
            size: 5,
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

export const getVisStateAgentFIMActions = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-actions',
    title: 'Actions',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: true, values: true, last_level: true, truncate: 100 },
    },
    uiState: {},
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.event',
            size: 5,
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

export const getVisStateAgentFIMEvents = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-events',
    title: 'Events',
    type: 'line',
    params: {
      type: 'line',
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
          type: 'line',
          mode: 'normal',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.event',
            order: 'desc',
            size: 5,
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
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

export const getVisStateAgentFIMFilesAdded = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-files-added',
    title: 'Files added',
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
      searchSource: buildSearchSource(indexPatternId, {
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              type: 'phrases',
              key: 'syscheck.event',
              value: 'added, readded',
              params: ['added', 'readded'],
              negate: false,
              disabled: false,
              alias: null,
            },
            query: {
              bool: {
                should: [
                  {
                    match_phrase: {
                      'syscheck.event': 'added',
                    },
                  },
                  {
                    match_phrase: {
                      'syscheck.event': 'readded',
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
            $state: {
              store: 'appState',
            },
          },
        ],
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.path',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentFIMFilesModified = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-files-modified',
    title: 'Files modified',
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
      searchSource: buildSearchSource(indexPatternId, {
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              negate: false,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'syscheck.event',
              value: 'modified',
              params: {
                query: 'modified',
                type: 'phrase',
              },
            },
            query: {
              match: {
                'syscheck.event': {
                  query: 'modified',
                  type: 'phrase',
                },
              },
            },
            $state: {
              store: 'appState',
            },
          },
        ],
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.path',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentFIMFilesDeleted = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-agents-fim-files-deleted',
    title: 'Files deleted',
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
      searchSource: buildSearchSource(indexPatternId, {
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              negate: false,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'syscheck.event',
              value: 'deleted',
              params: {
                query: 'deleted',
                type: 'phrase',
              },
            },
            query: {
              match: {
                'syscheck.event': {
                  query: 'deleted',
                  type: 'phrase',
                },
              },
            },
            $state: {
              store: 'appState',
            },
          },
        ],
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
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
            field: 'syscheck.path',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};
