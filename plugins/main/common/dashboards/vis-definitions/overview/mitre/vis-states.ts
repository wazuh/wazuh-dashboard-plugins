import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../lib';
import type { SavedVis } from '../../../types';

export const getVisStateAlertsEvolution = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'overview-mitre-alerts-evolution',
    title: 'Alerts evolution over time',
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
          lineWidth: 2,
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
        color: '#34130C',
      },
      dimensions: {
        x: {
          accessor: 0,
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
          params: {
            date: true,
            interval: 'PT3H',
            format: 'YYYY-MM-DD HH:mm',
            bounds: {
              min: '2019-11-07T15:45:45.770Z',
              max: '2019-11-14T15:45:45.770Z',
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
            field: 'rule.mitre.technique',
            customLabel: 'Attack ID',
            orderBy: '1',
            order: 'desc',
            size: 5,
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
            timeRange: { from: 'now-7d', to: 'now' },
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

export const getVisStateTopTactics = (indexPatternId: string): SavedVis => {
  return {
    id: 'overview-mitre-top-tactics',
    title: 'Top tactics',
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
            field: 'rule.mitre.tactic',
            orderBy: '1',
            order: 'desc',
            size: 10,
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

export const getVisStateAttacksByTechnique = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'overview-mitre-attacks-by-technique',
    title: 'Attacks by technique',
    type: 'histogram',
    params: {
      type: 'histogram',
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#34130C',
      },
      dimensions: {
        x: null,
        y: [
          {
            accessor: 1,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
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
          schema: 'group',
          params: {
            field: 'rule.mitre.technique',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.mitre.tactic',
            orderBy: '1',
            order: 'desc',
            size: 5,
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

export const getVisStateTopTacticsByAgent = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'overview-mitre-top-tactics-by-agent',
    title: 'Top tactics by agent',
    type: 'area',
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: { filter: true, show: true, truncate: 10 },
          position: 'bottom',
          scale: { type: 'linear' },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      dimensions: {
        x: {
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
      grid: { categoryLines: false, valueAxis: 'ValueAxis-1' },
      labels: {},
      legendPosition: 'right',
      seriesParams: [
        {
          data: { id: '1', label: 'Count' },
          drawLinesBetweenPoints: true,
          interpolate: 'linear',
          mode: 'normal',
          show: 'true',
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
      ],
      thresholdLine: {
        color: '#34130C',
        show: false,
        style: 'full',
        value: 10,
        width: 1,
      },
      times: [],
      type: 'area',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: { filter: false, rotate: 0, show: true, truncate: 100 },
          name: 'LeftAxis-1',
          position: 'left',
          scale: { mode: 'normal', type: 'linear' },
          show: true,
          style: {},
          title: { text: 'Count' },
          type: 'value',
        },
      ],
    },
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
            field: 'rule.mitre.tactic',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'segment',
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
        },
      ],
    },
  };
};

export const getVisStateTechniqueByAgent = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'overview-mitre-attacks-by-agent',
    title: 'Mitre techniques by agent',
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
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.mitre.technique',
            orderBy: '1',
            order: 'desc',
            size: 5,
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

export const getVisStateAlertsLevelByAttack = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'agents-mitre-level-by-attack',
    title: 'Rule level by attack',
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
          {
            accessor: 2,
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
          {
            accessor: 4,
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
    },
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
          schema: 'segment',
          params: {
            field: 'rule.mitre.technique',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Attack ID',
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Rule level',
          },
        },
      ],
    },
  };
};

export const getVisStateMitreAttacksByTactic = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'agents-mitre-attacks-by-tactic',
    title: 'MITRE attacks by tactic',
    type: 'histogram',
    params: {
      type: 'histogram',
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#34130C',
      },
      dimensions: {
        x: null,
        y: [
          {
            accessor: 1,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
        series: [
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
          schema: 'group',
          params: {
            field: 'rule.mitre.technique',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.mitre.tactic',
            orderBy: '1',
            order: 'desc',
            size: 5,
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

export const getVisStateAlertsLevelByTactic = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'agents-mitre-level-by-tactic',
    title: 'Rule level by tactic',
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
          {
            accessor: 2,
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
    },
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
          schema: 'segment',
          params: {
            field: 'rule.mitre.tactic',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Attack ID',
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Rule level',
          },
        },
      ],
    },
  };
};
