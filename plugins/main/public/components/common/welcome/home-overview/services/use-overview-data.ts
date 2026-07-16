import { useEffect, useMemo, useState } from 'react';
import { useDataSource } from '../../../data-source/hooks/use-data-source';
import {
  OverviewDataSource,
  FindingsDataSourceRepository,
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
  SystemInventoryTrafficStatesDataSourceRepository,
  SystemInventoryPackagesStatesDataSourceRepository,
  SystemInventoryUsersStatesDataSourceRepository,
  SystemInventoryServicesStatesDataSourceRepository,
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
  FIMFilesStatesDataSource,
  FIMDataSourceRepository,
  MalwareDetectionDataSource,
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
  ActiveResponsesDataSource,
  ActiveResponsesDataSourceRepository,
  IDataSourceFactoryConstructor,
  PatternDataSource,
  tDataSourceRepository,
  tParsedIndexPattern,
} from '../../../data-source';
import { WzRequest } from '../../../../../react-services';
import { useRefresh } from '../context/refresh-context';
import {
  buildCvesMatchedAgg,
  buildFindingsOverviewAggs,
  buildFIMTopPlatformsAgg,
  buildIocFeedByTypeAgg,
  buildIocMatchesAgg,
  buildSCATilesAgg,
  buildSCATopBenchmarksAgg,
  buildTopTermsAgg,
  buildVulnerabilitySeverityFiltersAgg,
  buildVulnerabilityTopOsAgg,
  HOST_OS_NAME_FIELD,
  PROCESS_NAME_FIELD,
} from './aggs';
import {
  shapeAgentStatus,
  shapeCardinality,
  shapeDocCount,
  shapeScaBenchmarks,
  shapeScaTiles,
  shapeSeverityCounts,
  shapeTopBuckets,
  shapeTopBucketsByMetric,
} from './shapers';
import {
  fetchDecodersCount,
  fetchDetectorsCount,
  fetchIntegrationsCount,
  fetchRulesCount,
} from './security-analytics-client';
import {
  AgentStatus,
  DATA_SOURCE_NOT_FOUND,
  DataGroupResult,
  FimOverview,
  FindingsOverview,
  MalwareOverview,
  ScaOverview,
  TopItem,
  VulnerabilityOverview,
} from './types';

/**
 * The single Overview data-access module. Every OVERVIEW, Endpoint Security
 * and Threat Hunting widget consumes data only through these hooks — the
 * sole boundary (and the sole jest mock point). It wraps all three call
 * styles: SearchSource aggregations (findings + state indices), the Wazuh
 * server API (agent status), and the Security Analytics proxy (IOC feed).
 */

const LAST_24H = { from: 'now-24h', to: 'now' };
/** Every OVERVIEW search only reads aggregations or `hits.total` — never
 * the matching documents themselves — so none of them need actual hits. */
const NO_HITS: { pageSize: number } = { pageSize: 0 };

/**
 * Drives the loading → available/unavailable/error state machine for one group.
 * A missing index pattern or plugin (`data_source_not_found`) means the
 * capability isn't deployed → unavailable (hide); any other rejection →
 * error (contained box).
 */
function useDataGroup<T>(options: {
  isLoading: boolean;
  initError: unknown;
  enabled: boolean;
  ready: boolean;
  fetch: () => Promise<T>;
  deps: unknown[];
}): DataGroupResult<T> {
  const { isLoading, initError, enabled, ready, fetch, deps } = options;
  const [result, setResult] = useState<DataGroupResult<T>>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    if (isLoading) {
      setResult({ status: 'loading' });
      return;
    }
    if (initError) {
      const type = (initError as { type?: string })?.type;
      setResult({
        status: type === DATA_SOURCE_NOT_FOUND ? 'unavailable' : 'error',
      });
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
          const type = (error as { type?: string })?.type;
          setResult({
            status: type === DATA_SOURCE_NOT_FOUND ? 'unavailable' : 'error',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}

/** Findings batch — severity bands, top MITRE tactics, and (for Threat
 * Hunting) total findings, top rules, techniques observed and top
 * techniques, all in one search, on mount. */
export function useFindingsOverview(): DataGroupResult<FindingsOverview> & {
  indexPatternId?: string;
} {
  const { refreshToken } = useRefresh();
  const repository = useMemo(() => new FindingsDataSourceRepository(), []);
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: OverviewDataSource,
    repository,
  });

  const result = useDataGroup<FindingsOverview>({
    isLoading,
    initError: error,
    enabled: true,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: buildFindingsOverviewAggs(10, 5, 5),
        dateRange: LAST_24H,
        pagination: NO_HITS,
      });
      return {
        severity: shapeSeverityCounts(response?.aggregations),
        topTactics: shapeTopBuckets(response?.aggregations, 'tactics'),
        totalFindings: shapeDocCount(response),
        topRules: shapeTopBuckets(response?.aggregations, 'top_rules'),
        techniquesCount: shapeCardinality(
          response?.aggregations,
          'techniques_count',
        ),
        topTechniques: shapeTopBuckets(
          response?.aggregations,
          'top_techniques',
        ),
      };
    },
    deps: [isLoading, error, dataSource, refreshToken],
  });

  const indexPatternId = (
    dataSource as { indexPattern?: { id?: string } } | undefined
  )?.indexPattern?.id;

  return { ...result, indexPatternId };
}

/** Top operating systems (system inventory, current snapshot). Lazy. */
export function useTopOperatingSystems(
  enabled: boolean,
): DataGroupResult<TopItem[]> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(
    () => new SystemInventorySystemStatesDataSourceRepository(),
    [],
  );
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: SystemInventoryStatesDataSource,
    repository,
  });

  return useDataGroup<TopItem[]>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: buildTopTermsAgg('top_os', HOST_OS_NAME_FIELD, 5),
        pagination: NO_HITS,
      });
      return shapeTopBuckets(response?.aggregations, 'top_os');
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** Top network services — processes owning listening ports (ports inventory). Lazy. */
export function useTopNetworkServices(
  enabled: boolean,
): DataGroupResult<TopItem[]> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(
    () => new SystemInventoryTrafficStatesDataSourceRepository(),
    [],
  );
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: SystemInventoryStatesDataSource,
    repository,
  });

  return useDataGroup<TopItem[]>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: buildTopTermsAgg('top_services', PROCESS_NAME_FIELD, 5),
        pagination: NO_HITS,
      });
      return shapeTopBuckets(response?.aggregations, 'top_services');
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** Agent connection summary via the Wazuh server API. Fires on mount. */
export function useAgentStatus(): DataGroupResult<AgentStatus> {
  const { refreshToken } = useRefresh();
  const [result, setResult] = useState<DataGroupResult<AgentStatus>>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    setResult({ status: 'loading' });
    WzRequest.apiReq('GET', '/agents/summary/status', {})
      .then(response => {
        if (!cancelled) {
          setResult({
            status: 'available',
            data: shapeAgentStatus(response?.data?.data?.connection),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return result;
}

/** Configuration Assessment tiles + top benchmarks (SCA state index). Lazy. */
export function useSCAOverview(enabled: boolean): DataGroupResult<ScaOverview> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(() => new SCAStatesDataSourceRepository(), []);
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: SCAStatesDataSource,
    repository,
  });

  return useDataGroup<ScaOverview>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: { ...buildSCATilesAgg(), ...buildSCATopBenchmarksAgg(5) },
        pagination: NO_HITS,
      });
      return {
        tiles: shapeScaTiles(response?.aggregations),
        benchmarks: shapeScaBenchmarks(response?.aggregations),
      };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** Fleet-wide baselined objects hero + top platforms (FIM state index). Lazy. */
export function useFIMOverview(enabled: boolean): DataGroupResult<FimOverview> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(() => new FIMDataSourceRepository(), []);
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: FIMFilesStatesDataSource,
    repository,
  });

  return useDataGroup<FimOverview>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: buildFIMTopPlatformsAgg(5),
        pagination: NO_HITS,
      });
      return {
        total: shapeDocCount(response),
        platforms: shapeTopBuckets(response?.aggregations, 'fim_platforms'),
      };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** IOC Match hero + IOC feed by type — findings filtered on threat
 * enrichments, last 24h, one search. Lazy, and independent of Security
 * Analytics (the findings index always has it; the type breakdown is the
 * same field the Malware Detection module's own dashboard aggregates). */
export function useMalwareOverview(
  enabled: boolean,
): DataGroupResult<MalwareOverview> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(() => new FindingsDataSourceRepository(), []);
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: MalwareDetectionDataSource,
    repository,
  });

  return useDataGroup<MalwareOverview>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: { ...buildIocMatchesAgg(), ...buildIocFeedByTypeAgg(5) },
        dateRange: LAST_24H,
        pagination: NO_HITS,
      });
      return {
        iocMatches: shapeCardinality(response?.aggregations, 'ioc_matches'),
        iocFeedByType: shapeTopBucketsByMetric(
          response?.aggregations,
          'ioc_feed_by_type',
          'distinct_events',
        ),
      };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** Shared shape for a Security Analytics-backed widget: no index pattern to
 * wait on, just a `core.http` call gated by the section's viewport/refresh. */
function useSecurityAnalyticsFetch<T>(
  enabled: boolean,
  fetcher: () => Promise<T>,
): DataGroupResult<T> {
  const { refreshToken } = useRefresh();

  return useDataGroup<T>({
    isLoading: false,
    initError: null,
    enabled,
    ready: true,
    fetch: fetcher,
    deps: [enabled, refreshToken],
  });
}

/** Rules tile (pre-packaged only). Lazy. */
export function useRulesCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchRulesCount);
}

/** Decoders tile. Lazy. */
export function useDecodersCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchDecodersCount);
}

/** Integrations tile. Lazy. */
export function useIntegrationsCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchIntegrationsCount);
}

/** Detectors tile. Lazy. */
export function useDetectorsCount(enabled: boolean): DataGroupResult<number> {
  return useSecurityAnalyticsFetch(enabled, fetchDetectorsCount);
}

/** Vulnerability Severity tiles + top OS (vulnerabilities state index). Lazy. */
export function useVulnerabilityOverview(
  enabled: boolean,
): DataGroupResult<VulnerabilityOverview> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(
    () => new VulnerabilitiesDataSourceRepository(),
    [],
  );
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: VulnerabilitiesDataSource,
    repository,
  });

  return useDataGroup<VulnerabilityOverview>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: {
          ...buildVulnerabilitySeverityFiltersAgg(),
          ...buildVulnerabilityTopOsAgg(5),
        },
        pagination: NO_HITS,
      });
      return {
        severity: shapeSeverityCounts(
          response?.aggregations,
          'vulnerability_severity',
        ),
        byOs: shapeTopBuckets(response?.aggregations, 'vulnerabilities_by_os'),
      };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** Shared shape for a single-index doc-count widget (IT Hygiene tiles, Active
 * Response): one search, no aggregations, just `hits.total`. */
function useIndexDocCount(
  DataSourceClass: IDataSourceFactoryConstructor<PatternDataSource>,
  createRepository: () => tDataSourceRepository<tParsedIndexPattern>,
  enabled: boolean,
  dateRange?: { from: string; to: string },
): DataGroupResult<number> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(createRepository, []);
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: DataSourceClass,
    repository,
  });

  return useDataGroup<number>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () =>
      shapeDocCount(await fetchData({ dateRange, pagination: NO_HITS })),
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** IT Hygiene summary tiles — one independent doc-count search per inventory
 * index, so a single missing index hides only its own tile. Lazy. */
export function useItHygieneOperatingSystemsCount(
  enabled: boolean,
): DataGroupResult<number> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventorySystemStatesDataSourceRepository(),
    enabled,
  );
}

export function useItHygienePackagesCount(
  enabled: boolean,
): DataGroupResult<number> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryPackagesStatesDataSourceRepository(),
    enabled,
  );
}

export function useItHygieneUsersCount(
  enabled: boolean,
): DataGroupResult<number> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryUsersStatesDataSourceRepository(),
    enabled,
  );
}

export function useItHygieneServicesCount(
  enabled: boolean,
): DataGroupResult<number> {
  return useIndexDocCount(
    SystemInventoryStatesDataSource,
    () => new SystemInventoryServicesStatesDataSourceRepository(),
    enabled,
  );
}

/** Active Response actions triggered, last 24h. Lazy. */
export function useActiveResponseOverview(
  enabled: boolean,
): DataGroupResult<number> {
  return useIndexDocCount(
    ActiveResponsesDataSource,
    () => new ActiveResponsesDataSourceRepository(),
    enabled,
    LAST_24H,
  );
}

/** CVEs matched — distinct CVE count (cardinality), not the total
 * vulnerability match-document count. Lazy. */
export function useCvesMatchedCount(enabled: boolean): DataGroupResult<number> {
  const { refreshToken } = useRefresh();
  const repository = useMemo(
    () => new VulnerabilitiesDataSourceRepository(),
    [],
  );
  const { isLoading, dataSource, error, fetchData } = useDataSource({
    DataSource: VulnerabilitiesDataSource,
    repository,
  });

  return useDataGroup<number>({
    isLoading,
    initError: error,
    enabled,
    ready: Boolean(dataSource && fetchData),
    fetch: async () => {
      const response = await fetchData({
        aggs: buildCvesMatchedAgg(),
        pagination: NO_HITS,
      });
      return shapeCardinality(response?.aggregations, 'cves_matched');
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}
