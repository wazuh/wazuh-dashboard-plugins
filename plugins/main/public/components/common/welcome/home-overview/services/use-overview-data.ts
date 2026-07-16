import { useEffect, useMemo, useState } from 'react';
import { useDataSource } from '../../../data-source/hooks/use-data-source';
import {
  OverviewDataSource,
  FindingsDataSourceRepository,
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
  SystemInventoryTrafficStatesDataSourceRepository,
} from '../../../data-source';
import { WzRequest } from '../../../../../react-services';
import { useRefresh } from '../context/refresh-context';
import {
  buildFindingsOverviewAggs,
  buildTopTermsAgg,
  HOST_OS_NAME_FIELD,
  PROCESS_NAME_FIELD,
} from './aggs';
import {
  shapeSeverityCounts,
  shapeTopBuckets,
  shapeAgentStatus,
} from './shapers';
import {
  AgentStatus,
  DataGroupResult,
  FindingsOverview,
  TopItem,
} from './types';

/**
 * The single Overview data-access module. Every OVERVIEW widget consumes data
 * only through these hooks — the sole boundary (and the sole jest mock point).
 * It wraps all three call styles: SearchSource aggregations (findings + state
 * indices) and the Wazuh server API (agent status).
 */

const DATA_SOURCE_NOT_FOUND = 'data_source_not_found';
const LAST_24H = { from: 'now-24h', to: 'now' };

/**
 * Drives the loading → available/unavailable/error state machine for one group.
 * A missing index pattern (`data_source_not_found`) means the capability isn't
 * deployed → unavailable (hide); a fetch rejection → error (contained box).
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
      .catch(() => {
        if (!cancelled) {
          setResult({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}

/** Findings batch — severity bands + top MITRE tactics in one search, on mount. */
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
        aggs: buildFindingsOverviewAggs(10),
        dateRange: LAST_24H,
      });
      return {
        severity: shapeSeverityCounts(response?.aggregations),
        topTactics: shapeTopBuckets(response?.aggregations, 'tactics'),
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
