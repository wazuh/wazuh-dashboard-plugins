import { useEffect, useMemo, useState } from 'react';
import { useDataSource } from '../../../data-source/hooks/use-data-source';
import {
  OverviewDataSource,
  FindingsDataSourceRepository,
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
  SystemInventoryTrafficStatesDataSourceRepository,
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
  FIMFilesStatesDataSource,
  FIMDataSourceRepository,
  MalwareDetectionDataSource,
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
} from '../../../data-source';
import { WzRequest } from '../../../../../react-services';
import { useRefresh } from '../context/refresh-context';
import {
  buildFindingsOverviewAggs,
  buildFIMTopPlatformsAgg,
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
} from './shapers';
import { fetchIocFeedByType } from './security-analytics-client';
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
      const response = await fetchData({ aggs: buildFIMTopPlatformsAgg(5) });
      return {
        total: shapeDocCount(response),
        platforms: shapeTopBuckets(response?.aggregations, 'fim_platforms'),
      };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** IOC Match hero — findings filtered on threat enrichments, last 24h. Lazy,
 * and independent of Security Analytics (the findings index always has it). */
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
      const response = await fetchData({ dateRange: LAST_24H });
      return { iocMatches: shapeDocCount(response) };
    },
    deps: [isLoading, error, dataSource, enabled, refreshToken],
  });
}

/** IOC feed by type (top 5) via the Security Analytics count client. Lazy;
 * hides (rather than errors) when Security Analytics isn't installed. */
export function useIocFeedByType(enabled: boolean): DataGroupResult<TopItem[]> {
  const { refreshToken } = useRefresh();

  return useDataGroup<TopItem[]>({
    isLoading: false,
    initError: null,
    enabled,
    ready: true,
    fetch: () => fetchIocFeedByType(5),
    deps: [enabled, refreshToken],
  });
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
