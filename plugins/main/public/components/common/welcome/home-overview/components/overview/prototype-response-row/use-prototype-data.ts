/*
 * PROTOTYPE (issue #9672) — throwaway. Variants of the Incident Response and
 * Case Management row. Lives on branch prototype/9672-response-cards only.
 *
 * Cost: one search per source, aggregations only (plus 5 case hits).
 *  - Active responses, last 24 h: total, hourly histogram, top commands, top agents.
 *  - Cases (findings with wazuh.case.status): per status, open per severity and
 *    priority, 5 latest updated open cases.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDataSource } from '../../../../../data-source/hooks/use-data-source';
import {
  OverviewDataSource,
  ActiveResponsesDataSource,
  ActiveResponsesDataSourceRepository,
  CasesDataSource,
  FindingsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
} from '../../../../../data-source';

const OPEN = ['active', 'acknowledged'];
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const LATEST = {
  top_hits: {
    size: 5,
    sort: [
      { 'wazuh.case.updated_at': { order: 'desc', unmapped_type: 'date' } },
    ],
    _source: ['wazuh.case.*', 'wazuh.agent.name', 'wazuh.rule.title'],
  },
};
/** Case table tabs: one filter each, 5 latest cases per tab, same search. */
export const TABS: Record<string, unknown> = {
  open: { terms: { 'wazuh.case.status': OPEN } },
  urgent: {
    bool: {
      filter: [
        { terms: { 'wazuh.case.status': OPEN } },
        { term: { 'wazuh.case.priority': 'urgent' } },
      ],
    },
  },
  critical: {
    bool: {
      filter: [
        { terms: { 'wazuh.case.status': OPEN } },
        { term: { 'wazuh.case.severity': 'critical' } },
      ],
    },
  },
  completed: { term: { 'wazuh.case.status': 'completed' } },
  attention: {
    bool: {
      filter: [{ terms: { 'wazuh.case.status': OPEN } }],
      should: [
        { term: { 'wazuh.case.priority': 'urgent' } },
        { term: { 'wazuh.case.severity': 'critical' } },
      ],
      minimum_should_match: 1,
    },
  },
};

export interface ProtoIncidentResponse {
  total: number;
  hourly: Array<{ time: number; count: number }>;
  topCommands: Array<{ key: string; count: number }>;
  topAgents: Array<{ key: string; count: number }>;
  agentsCount: number;
  commandsCount: number;
  /** Distinct critical/high findings that got a response, per level. */
  answered: { critical: number; high: number };
  /** Rule titles that triggered a response. */
  respondedRules: string[];
  latest: Array<{
    id: string;
    time: string;
    command?: string;
    agent?: string;
    rule?: string;
  }>;
}

export interface ProtoCase {
  id: string;
  title?: string;
  status?: string;
  severity?: string;
  priority?: string;
  updatedAt?: string;
  agent?: string;
  rule?: string;
}

export interface ProtoCases {
  total: number;
  byStatus: Record<string, number>;
  openBySeverity: Record<string, number>;
  openByPriority: Record<string, number>;
  latestOpen: ProtoCase[];
  /** 5 latest updated cases per tab. */
  tabs: Record<string, ProtoCase[]>;
  /** Cases per tab: the tab filter's doc_count, free with the hits. */
  tabCounts: Record<string, number>;
}

function useSearch<T>(
  DataSource: any,
  createRepository: () => any,
  params: Record<string, unknown>,
  map: (response: any) => T,
): { data?: T; indexPatternId?: string; error?: unknown } {
  const repository = useMemo(createRepository, []);
  const { isLoading, dataSource, error, fetchData, fixedFilters } =
    useDataSource<tParsedIndexPattern, PatternDataSource>({
      DataSource,
      repository,
    });
  const [state, setState] = useState<{ data?: T; error?: unknown }>({});
  useEffect(() => {
    if (isLoading || !dataSource || !fetchData) {
      return;
    }
    fetchData({ ...params, filters: fixedFilters } as any)
      .then(response => setState({ data: map(response) }))
      .catch(e => setState({ error: e }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, dataSource]);
  return {
    ...state,
    error: state.error ?? error,
    indexPatternId: dataSource?.indexPattern?.id,
  };
}

const terms = (buckets: any[] = []) =>
  buckets.map(b => ({ key: String(b.key), count: b.doc_count }));
const filterCounts = (buckets: Record<string, any> = {}) =>
  Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, v?.doc_count ?? 0]),
  );

export function usePrototypeIncidentResponse() {
  return useSearch<ProtoIncidentResponse>(
    ActiveResponsesDataSource,
    () => new ActiveResponsesDataSourceRepository(),
    {
      dateRange: { from: 'now-24h', to: 'now' },
      pagination: { pageSize: 0 },
      aggs: {
        hourly: {
          date_histogram: {
            field: '@timestamp',
            fixed_interval: '1h',
            min_doc_count: 0,
            extended_bounds: { min: 'now-24h', max: 'now' },
          },
        },
        commands: {
          terms: { field: 'wazuh.active_response.executable', size: 5 },
        },
        agents: { terms: { field: 'wazuh.agent.name', size: 5 } },
        agents_count: { cardinality: { field: 'wazuh.agent.id' } },
        commands_count: {
          cardinality: { field: 'wazuh.active_response.executable' },
        },
        answered_critical: {
          filter: { term: { 'wazuh.rule.level': 'critical' } },
          aggs: { findings: { cardinality: { field: 'event.doc_id' } } },
        },
        answered_high: {
          filter: { term: { 'wazuh.rule.level': 'high' } },
          aggs: { findings: { cardinality: { field: 'event.doc_id' } } },
        },
        responded_rules: { terms: { field: 'wazuh.rule.title', size: 200 } },
        latest: {
          top_hits: {
            size: 5,
            sort: [{ '@timestamp': { order: 'desc' } }],
            _source: [
              '@timestamp',
              'wazuh.active_response.executable',
              'wazuh.agent.name',
              'wazuh.rule.title',
              'wazuh.rule.description',
            ],
          },
        },
      },
    },
    r => ({
      total: r?.hits?.total ?? 0,
      hourly: (r?.aggregations?.hourly?.buckets ?? []).map((b: any) => ({
        time: b.key,
        count: b.doc_count,
      })),
      topCommands: terms(r?.aggregations?.commands?.buckets),
      topAgents: terms(r?.aggregations?.agents?.buckets),
      agentsCount: r?.aggregations?.agents_count?.value ?? 0,
      answered: {
        critical: r?.aggregations?.answered_critical?.findings?.value ?? 0,
        high: r?.aggregations?.answered_high?.findings?.value ?? 0,
      },
      respondedRules: (r?.aggregations?.responded_rules?.buckets ?? []).map(
        (b: any) => String(b.key),
      ),
      commandsCount: r?.aggregations?.commands_count?.value ?? 0,
      latest: (r?.aggregations?.latest?.hits?.hits ?? []).map((h: any) => {
        const w = h._source?.wazuh ?? {};
        return {
          id: h._id,
          time: h._source?.['@timestamp'],
          command: w.active_response?.executable,
          agent: w.agent?.name,
          rule: w.rule?.title ?? w.rule?.description,
        };
      }),
    }),
  );
}

export function usePrototypeCases() {
  const byField = (field: string, values: string[]) => ({
    filters: {
      filters: Object.fromEntries(
        values.map(v => [v, { term: { [field]: v } }]),
      ),
    },
  });
  return useSearch<ProtoCases>(
    CasesDataSource,
    () => new FindingsDataSourceRepository(),
    {
      pagination: { pageSize: 0 },
      aggs: {
        status: byField('wazuh.case.status', [
          'active',
          'acknowledged',
          'completed',
        ]),
        ...Object.fromEntries(
          Object.entries(TABS).map(([k, filter]) => [
            `tab_${k}`,
            { filter, aggs: { latest: LATEST } },
          ]),
        ),
        open: {
          filter: { terms: { 'wazuh.case.status': OPEN } },
          aggs: {
            severity: byField('wazuh.case.severity', SEVERITIES),
            priority: byField('wazuh.case.priority', PRIORITIES),
            latest: {
              top_hits: {
                size: 5,
                sort: [
                  {
                    'wazuh.case.updated_at': {
                      order: 'desc',
                      unmapped_type: 'date',
                    },
                  },
                ],
                _source: ['wazuh.case.*'],
              },
            },
          },
        },
      },
    },
    r => {
      const a = r?.aggregations ?? {};
      const toCase = (h: any): ProtoCase => {
        const c = h._source?.wazuh?.case ?? {};
        return {
          id: h._id,
          title: c.title,
          status: c.status,
          severity: c.severity,
          priority: c.priority,
          updatedAt: c.updated_at ?? c.created_at,
          agent: h._source?.wazuh?.agent?.name,
          rule: h._source?.wazuh?.rule?.title,
        };
      };
      return {
        total: r?.hits?.total ?? 0,
        byStatus: filterCounts(a.status?.buckets),
        openBySeverity: filterCounts(a.open?.severity?.buckets),
        openByPriority: filterCounts(a.open?.priority?.buckets),
        latestOpen: (a.open?.latest?.hits?.hits ?? []).map((h: any) => {
          const c = h._source?.wazuh?.case ?? {};
          return {
            id: h._id,
            title: c.title,
            status: c.status,
            severity: c.severity,
            priority: c.priority,
            updatedAt: c.updated_at ?? c.created_at,
          };
        }),
        tabCounts: Object.fromEntries(
          Object.keys(TABS).map(k => [k, a[`tab_${k}`]?.doc_count ?? 0]),
        ),
        tabs: Object.fromEntries(
          Object.keys(TABS).map(k => [
            k,
            (a[`tab_${k}`]?.latest?.hits?.hits ?? []).map(toCase),
          ]),
        ),
      };
    },
  );
}

export interface ProtoSeriousRule {
  title: string;
  count: number;
  level: string;
}

/** Critical/high findings of the last 24 h: totals and the top rules behind them. */
export function usePrototypeSeriousFindings() {
  return useSearch<{
    total: { critical: number; high: number };
    rules: ProtoSeriousRule[];
  }>(
    OverviewDataSource,
    () => new FindingsDataSourceRepository(),
    {
      dateRange: { from: 'now-24h', to: 'now' },
      pagination: { pageSize: 0 },
      aggs: {
        serious: {
          filter: { terms: { 'wazuh.rule.level': ['critical', 'high'] } },
          aggs: {
            level: { terms: { field: 'wazuh.rule.level', size: 2 } },
            rules: {
              terms: { field: 'wazuh.rule.title', size: 20 },
              aggs: {
                level: { terms: { field: 'wazuh.rule.level', size: 1 } },
              },
            },
          },
        },
      },
    },
    r => {
      const s = r?.aggregations?.serious ?? {};
      const lv = Object.fromEntries(
        (s.level?.buckets ?? []).map((b: any) => [b.key, b.doc_count]),
      );
      return {
        total: { critical: lv.critical ?? 0, high: lv.high ?? 0 },
        rules: (s.rules?.buckets ?? []).map((b: any) => ({
          title: String(b.key),
          count: b.doc_count,
          level: b.level?.buckets?.[0]?.key ?? 'high',
        })),
      };
    },
  );
}
