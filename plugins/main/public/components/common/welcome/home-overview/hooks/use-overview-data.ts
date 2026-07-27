import { useEffect, useMemo, useState } from 'react';
import { useDataSource } from '../../../data-source/hooks/use-data-source';
import {
  OverviewDataSource,
  FindingsDataSourceRepository,
  SystemInventoryStatesDataSource,
  SystemInventoryServicesStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
  SystemInventoryTrafficStatesDataSourceRepository,
  SystemInventoryPackagesStatesDataSourceRepository,
  SystemInventoryUsersStatesDataSourceRepository,
  SystemInventoryServicesStatesDataSourceRepository,
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
  FIMFilesStatesDataSource,
  FIMDataSourceRepository,
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
  ActiveResponsesDataSource,
  ActiveResponsesDataSourceRepository,
  ThreatIntelEnrichmentsStatesDataSource,
  ThreatIntelEnrichmentsStatesDataSourceRepository,
  IDataSourceFactoryConstructor,
  PatternDataSource,
  tDataSourceRepository,
  tFilter,
  tParsedIndexPattern,
} from '../../../data-source';
import { WzRequest } from '../../../../../react-services';
import {
  buildCvesMatchedAgg,
  buildFindingsOverviewAggs,
  buildFIMTopFilesAgg,
  buildMalwareFilterAgg,
  buildSCATilesAgg,
  buildSCATopBenchmarksAgg,
  buildThreatIntelFeedByTypeAgg,
  buildTopTermsAgg,
  buildVulnerabilitySeverityFiltersAgg,
  buildVulnerabilityTopPackagesAgg,
} from '../lib/queries';
import {
  HOST_OS_NAME_FIELD,
  PROCESS_NAME_FIELD,
  VULNERABILITY_SEVERITY_BANDS,
} from '../lib/fields';
import { AGG } from '../lib/constants';
import {
  mapAgentStatus,
  mapCardinality,
  mapDocCount,
  mapScaBenchmarks,
  mapScaTiles,
  mapSeverityCounts,
  mapTopBuckets,
} from '../lib/mappers';
import {
  fetchDecodersCount,
  fetchDetectorsCount,
  fetchIntegrationsCount,
  fetchRulesCount,
} from '../services/security-analytics.service';
import {
  AgentStatus,
  FimOverview,
  FindingsOverview,
  ScaOverview,
  ThreatIntelEnrichments,
  TopItem,
  VulnerabilityOverview,
} from '../interfaces/types';
import {
  DATA_SOURCE_NOT_FOUND,
  DataGroupResult,
} from '../interfaces/data-group';
import { reportQueryError } from '../lib/report-query-error';
import { classifyQueryError } from '../lib/classify-query-error';

// Data hooks for the Home overview. Every widget reads its data through one of
// these; they wrap SearchSource aggregations, the Wazuh API, and Security
// Analytics.

const LAST_24H = { from: 'now-24h', to: 'now' };
/** Aggregations and counts only; never fetch document hits. */
const NO_HITS: { pageSize: number } = { pageSize: 0 };

function isDataSourceNotFound(error: unknown): boolean {
  return (error as { type?: string })?.type === DATA_SOURCE_NOT_FOUND;
}

/**
 * State handling for one group. `data_source_not_found` → `unavailable` (benign,
 * no toast); any other error → `error` and, when a `label` is given, a coalesced
 * failure toast (see `reportQueryError`). Widgets are never hidden. Either way,
 * the error is classified (see `classifyQueryError`) so the widget can render a
 * specific message instead of a generic one.
 */
function useDataGroup<T>(options: {
  isLoading: boolean;
  initError: unknown;
  enabled: boolean;
  ready: boolean;
  fetch: () => Promise<T>;
  deps: unknown[];
  label?: string;
}): DataGroupResult<T> {
  const {
    isLoading,
    initError,
    enabled,
    ready,
    fetch,
    deps,
    label = 'unknown',
  } = options;
  const [result, setResult] = useState<DataGroupResult<T>>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    const handleError = (error: unknown) => {
      const classifiedError = classifyQueryError(error);
      reportQueryError(label, error);
      if (isDataSourceNotFound(error)) {
        setResult({ status: 'unavailable', error: classifiedError });
        return;
      }
      setResult({ status: 'error', error: classifiedError });
    };

    if (isLoading) {
      setResult({ status: 'loading' });
      return;
    }
    if (initError) {
      handleError(initError);
      return;
    }
    if (!enabled || !ready) {
      setResult({ status: 'loading' });
      return;
    }

    setResult({ status: 'loading' });
    fetch()
      .then(data => {
        if (!cancelled) {
          setResult({ status: 'available', data });
        }
      })
      .catch(error => {
        if (!cancelled) {
          handleError(error);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}

type FetchData = ReturnType<typeof useDataSource>['fetchData'];

/**
 * Runs one aggregation search and drives the state handling. `fetch` gets the
 * bound `fetchData`; `dataSource` is returned for the findings index-pattern id.
 */
function useAggregationGroup<T>(options: {
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  createRepository: () => tDataSourceRepository<tParsedIndexPattern>;
  enabled: boolean;
  fetch: (fetchData: FetchData) => Promise<T>;
  label?: string;
}): DataGroupResult<T> & {
  dataSource?: PatternDataSource;
  fixedFilters?: tFilter[];
} {
  const { DataSource, createRepository, enabled, fetch, label } = options;
  const repository = useMemo(createRepository, []);
  const { isLoading, dataSource, error, fetchData, fixedFilters } =
    useDataSource({
      DataSource,
      repository,
    });

  // Scope every search to the data source's fixed filters only, so global /
  // pinned filters set elsewhere in the app don't leak into the Home overview
  const scopedFetchData: FetchData = params =>
    fetchData({ ...params, filters: fixedFilters } as Parameters<FetchData>[0]);

  const result = useDataGroup<T>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: () => fetch(scopedFetchData),
    deps: [isLoading, error, dataSource, enabled],
    label,
  });

  return useMemo(
    () => ({ ...result, dataSource, fixedFilters }),
    [result, dataSource, fixedFilters],
  );
}

/**
 * Findings batch (severity, tactics, rules, techniques, IOC matches) in one
 * search, on mount. Shared by Overview, Threat Hunting and Malware Detection.
 */
export function useFindingsOverview(): DataGroupResult<FindingsOverview> & {
  indexPatternId?: string;
  fixedFilters?: tFilter[];
} {
  const { dataSource, fixedFilters, ...result } =
    useAggregationGroup<FindingsOverview>({
      DataSource: OverviewDataSource,
      createRepository: () => new FindingsDataSourceRepository(),
      enabled: true,
      label: 'Findings',
      fetch: async fetchData => {
        const response = await fetchData({
          aggs: { ...buildFindingsOverviewAggs(), ...buildMalwareFilterAgg() },
          dateRange: LAST_24H,
          pagination: NO_HITS,
        });
        const malware = response?.aggregations?.[AGG.malware];
        return {
          severity: mapSeverityCounts(response?.aggregations),
          topTactics: mapTopBuckets(response?.aggregations, AGG.tactics),
          totalFindings: mapDocCount(response),
          topRules: mapTopBuckets(response?.aggregations, AGG.topRules),
          techniquesCount: mapCardinality(
            response?.aggregations,
            AGG.techniquesCount,
          ),
          topTechniques: mapTopBuckets(
            response?.aggregations,
            AGG.topTechniques,
          ),
          iocMatches: mapCardinality(malware, AGG.iocMatches),
        };
      },
    });

  const indexPatternId = dataSource?.indexPattern?.id;

  return useMemo(
    () => ({ ...result, indexPatternId, fixedFilters }),
    [result.status, result.data, indexPatternId, fixedFilters],
  );
}

export function useTopOperatingSystems(
  enabled: boolean,
): DataGroupResult<TopItem[]> {
  return useAggregationGroup<TopItem[]>({
    DataSource: SystemInventoryStatesDataSource,
    createRepository: () =>
      new SystemInventorySystemStatesDataSourceRepository(),
    enabled,
    label: 'Top operating systems',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: buildTopTermsAgg(AGG.topOs, HOST_OS_NAME_FIELD),
        pagination: NO_HITS,
      });
      return mapTopBuckets(response?.aggregations, AGG.topOs);
    },
  });
}

export function useTopNetworkServices(
  enabled: boolean,
): DataGroupResult<TopItem[]> {
  return useAggregationGroup<TopItem[]>({
    // Listeners view: the ports index filtered to listening sockets
    // (destination.port IS 0), mirroring IT Hygiene > Network > Listeners.
    DataSource: SystemInventoryServicesStatesDataSource,
    createRepository: () =>
      new SystemInventoryTrafficStatesDataSourceRepository(),
    enabled,
    label: 'Top network services',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: buildTopTermsAgg(AGG.topServices, PROCESS_NAME_FIELD),
        pagination: NO_HITS,
      });
      return mapTopBuckets(response?.aggregations, AGG.topServices);
    },
  });
}

export function useAgentStatus(): DataGroupResult<AgentStatus> {
  return useDataGroup<AgentStatus>({
    isLoading: false,
    initError: null,
    enabled: true,
    ready: true,
    fetch: async () => {
      const response = await WzRequest.apiReq(
        'GET',
        '/agents/summary/status',
        {},
      );
      return mapAgentStatus(response?.data?.data?.connection);
    },
    deps: [],
    label: 'Agents status',
  });
}

export function useSCAOverview(enabled: boolean): DataGroupResult<ScaOverview> {
  return useAggregationGroup<ScaOverview>({
    DataSource: SCAStatesDataSource,
    createRepository: () => new SCAStatesDataSourceRepository(),
    enabled,
    label: 'Configuration Assessment',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: { ...buildSCATilesAgg(), ...buildSCATopBenchmarksAgg() },
        pagination: NO_HITS,
      });
      return {
        tiles: mapScaTiles(response?.aggregations),
        benchmarks: mapScaBenchmarks(response?.aggregations),
      };
    },
  });
}

export function useFIMOverview(enabled: boolean): DataGroupResult<FimOverview> {
  return useAggregationGroup<FimOverview>({
    DataSource: FIMFilesStatesDataSource,
    createRepository: () => new FIMDataSourceRepository(),
    enabled,
    label: 'File Integrity Monitoring',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: buildFIMTopFilesAgg(),
        pagination: NO_HITS,
      });
      return {
        total: mapDocCount(response),
        files: mapTopBuckets(response?.aggregations, AGG.fimTopFiles),
      };
    },
  });
}

/** Security Analytics count: a gated core.http call, no index pattern. */
function useSecurityAnalyticsFetch<T>(
  enabled: boolean,
  fetcher: () => Promise<T>,
  label: string,
): DataGroupResult<T> {
  return useDataGroup<T>({
    isLoading: false,
    initError: null,
    enabled,
    ready: true,
    fetch: fetcher,
    deps: [enabled],
    label,
  });
}

/** Enabled rules count, across both the standard and custom content spaces. */
export function useRulesCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchRulesCount, 'Rules');
}

export function useDecodersCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchDecodersCount, 'Decoders');
}

export function useIntegrationsCount(
  enabled: boolean,
): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(
    enabled,
    fetchIntegrationsCount,
    'Integrations',
  );
}

export function useDetectorsCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchDetectorsCount, 'Detectors');
}

export function useVulnerabilityOverview(
  enabled: boolean,
): DataGroupResult<VulnerabilityOverview> {
  return useAggregationGroup<VulnerabilityOverview>({
    DataSource: VulnerabilitiesDataSource,
    createRepository: () => new VulnerabilitiesDataSourceRepository(),
    enabled,
    label: 'Vulnerabilities',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: {
          ...buildVulnerabilitySeverityFiltersAgg(),
          ...buildVulnerabilityTopPackagesAgg(),
          ...buildCvesMatchedAgg(),
        },
        pagination: NO_HITS,
      });
      return {
        severity: mapSeverityCounts(
          response?.aggregations,
          AGG.vulnerabilitySeverity,
          VULNERABILITY_SEVERITY_BANDS,
        ),
        byPackage: mapTopBuckets(
          response?.aggregations,
          AGG.vulnerabilitiesByPackage,
        ),
        cvesMatched: mapCardinality(response?.aggregations, AGG.cvesMatched),
      };
    },
  });
}

/**
 * Threat-intel enrichments catalog: the total IOC count (the "IOCs" tile) and
 * the feed composition by type (Malware Detection's "IOC feed by type"), in one
 * search over `wazuh-threatintel-enrichments*`. Current-state, so no time range.
 * Shared by the Endpoint Security and Threat Intelligence Feed sections.
 */
export function useThreatIntelEnrichments(
  enabled: boolean,
): DataGroupResult<ThreatIntelEnrichments> {
  return useAggregationGroup<ThreatIntelEnrichments>({
    DataSource: ThreatIntelEnrichmentsStatesDataSource,
    createRepository: () =>
      new ThreatIntelEnrichmentsStatesDataSourceRepository(),
    enabled,
    label: 'Threat intelligence',
    fetch: async fetchData => {
      const response = await fetchData({
        aggs: buildThreatIntelFeedByTypeAgg(),
        pagination: NO_HITS,
      });
      return {
        total: mapDocCount(response),
        feedByType: mapTopBuckets(response?.aggregations, AGG.iocFeedByType),
      };
    },
  });
}

/** Single-index document count (no aggregations). */
function useIndexDocCount(
  DataSourceClass: IDataSourceFactoryConstructor<PatternDataSource>,
  createRepository: () => tDataSourceRepository<tParsedIndexPattern>,
  enabled: boolean,
  label: string,
  dateRange?: { from: string; to: string },
): DataGroupResult<number | undefined> {
  const repository = useMemo(createRepository, []);
  const { isLoading, dataSource, error, fetchData, fixedFilters } =
    useDataSource({
      DataSource: DataSourceClass,
      repository,
    });

  return useDataGroup<number | undefined>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () =>
      mapDocCount(
        await fetchData({
          dateRange,
          pagination: NO_HITS,
          filters: fixedFilters,
        } as Parameters<typeof fetchData>[0]),
      ),
    deps: [isLoading, error, dataSource, enabled],
    label,
  });
}

/**
 * IT Hygiene counts: one search per inventory index, so a missing index shows
 * "-" on only its own tile (never hidden).
 */
export function useItHygieneOperatingSystemsCount(
  enabled: boolean,
): DataGroupResult<number | undefined> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventorySystemStatesDataSourceRepository(),
    enabled,
    'IT Hygiene: operating systems',
  );
}

export function useItHygienePackagesCount(
  enabled: boolean,
): DataGroupResult<number | undefined> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryPackagesStatesDataSourceRepository(),
    enabled,
    'IT Hygiene: packages',
  );
}

export function useItHygieneUsersCount(
  enabled: boolean,
): DataGroupResult<number | undefined> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryUsersStatesDataSourceRepository(),
    enabled,
    'IT Hygiene: users',
  );
}

export function useItHygieneServicesCount(
  enabled: boolean,
): DataGroupResult<number | undefined> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryServicesStatesDataSourceRepository(),
    enabled,
    'IT Hygiene: services',
  );
}

export function useActiveResponseOverview(
  enabled: boolean,
): DataGroupResult<number | undefined> {
  return useIndexDocCount(
    ActiveResponsesDataSource,
    () => new ActiveResponsesDataSourceRepository(),
    enabled,
    'Active Response',
    LAST_24H,
  );
}
