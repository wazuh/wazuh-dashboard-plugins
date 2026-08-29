import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { mitreI18n } from '../i18n';

const getVisStateAlertsEvolution = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-MITRE-Alerts-Evolution',
    title: mitreI18n.alertsEvolution,
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
          title: { text: mitreI18n.count },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'line',
          mode: 'normal',
          data: { label: mitreI18n.count, id: '1' },
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
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
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'wazuh.rule.mitre.technique.name',
            customLabel: mitreI18n.techniqueName,
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
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

const getVisStateTopTactics = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-MITRE-Top-Tactics',
    title: mitreI18n.topTactics,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
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
            field: 'wazuh.rule.mitre.tactic.name',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
      ],
    },
  };
};

const getVisStateAttacksByTechnique = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-MITRE-Attacks-By-Technique',
    title: mitreI18n.attacksByTechnique,
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
          title: { text: mitreI18n.count },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: mitreI18n.count, id: '1' },
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
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
          schema: 'group',
          params: {
            field: 'wazuh.rule.mitre.technique.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'wazuh.rule.mitre.tactic.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
      ],
    },
  };
};

const getVisStateTopTacticsByAgent = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-MITRE-Top-Tactics-By-Agent',
    title: mitreI18n.topTacticsByAgent,
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
              otherBucketLabel: mitreI18n.other,
              missingBucketLabel: mitreI18n.missing,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
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
          data: { id: '1', label: mitreI18n.count },
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
          title: { text: mitreI18n.count },
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
          schema: 'metric',
          params: {},
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'wazuh.rule.mitre.tactic.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'wazuh.agent.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
      ],
    },
  };
};

const getVisStateTechniqueByAgent = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-MITRE-Attacks-By-Agent',
    title: mitreI18n.techniquesByAgent,
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
            field: 'wazuh.agent.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'wazuh.rule.mitre.technique.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
      ],
    },
  };
};

const getVisStateAlertsLevelByAttack = indexPatternId => {
  return {
    id: 'Wazuh-App-Agents-MITRE-Level-By-Attack',
    title: mitreI18n.ruleLevelByAttack,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'lucene',
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
          schema: 'segment',
          params: {
            field: 'wazuh.rule.mitre.technique.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
            customLabel: mitreI18n.techniqueName,
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
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
            customLabel: mitreI18n.ruleLevel,
          },
        },
      ],
    },
  };
};

const getVisStateMitreAttacksByTactic = indexPatternId => {
  return {
    id: 'Wazuh-App-Agents-MITRE-Attacks-By-Tactic',
    title: mitreI18n.mitreAttacksByTactic,
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
          title: { text: mitreI18n.count },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: mitreI18n.count, id: '1' },
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'lucene',
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
          schema: 'group',
          params: {
            field: 'wazuh.rule.mitre.technique.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'wazuh.rule.mitre.tactic.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
          },
        },
      ],
    },
  };
};

const getVisStateAlertsLevelByTactic = indexPatternId => {
  return {
    id: 'Wazuh-App-Agents-MITRE-Level-By-Tactic',
    title: mitreI18n.ruleLevelByTactic,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
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
                otherBucketLabel: mitreI18n.other,
                missingBucketLabel: mitreI18n.missing,
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'lucene',
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
          schema: 'segment',
          params: {
            field: 'wazuh.rule.mitre.tactic.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
            customLabel: mitreI18n.tacticName,
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
            otherBucketLabel: mitreI18n.other,
            missingBucket: false,
            missingBucketLabel: mitreI18n.missing,
            customLabel: mitreI18n.ruleLevel,
          },
        },
      ],
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const pinnedAgentPanels = {
    '1': {
      gridData: {
        w: 36,
        h: 12,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateAlertsEvolution(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateTopTactics(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 12,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateAlertsLevelByAttack(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 12,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateMitreAttacksByTactic(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 12,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateAlertsLevelByTactic(indexPatternId),
      },
    },
  };
  const panels = {
    '6': {
      gridData: {
        w: 36,
        h: 12,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateAlertsEvolution(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateTopTactics(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 12,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateAttacksByTechnique(indexPatternId),
      },
    },
    '9': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 12,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateTopTacticsByAgent(indexPatternId),
      },
    },
    '10': {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 12,
        i: '10',
      },
      type: 'visualization',
      explicitInput: {
        id: '10',
        savedVis: getVisStateTechniqueByAgent(indexPatternId),
      },
    },
  };
  return isPinnedAgent ? pinnedAgentPanels : panels;
};
