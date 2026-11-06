import { useEffect, useMemo, useState } from 'react';
import {
  DockerDataSource,
  FindingsDataSourceRepository,
  tFilter,
  useDataSource,
} from '../../../../common/data-source';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';

export type DockerDataStatus =
  | 'loading'
  | 'received'
  | 'never-received'
  | 'error';

/** Fetches no documents: only the total is needed. */
const NO_HITS = { pageSize: 0 };

const withoutPinnedAgent = (filters: tFilter[] = []) =>
  filters.filter(
    filter =>
      filter.meta?.controlledBy !==
      PinnedAgentManager.FILTER_CONTROLLED_PINNED_AGENT_KEY,
  );

const getTotal = (response?: {
  hits?: { total?: number | { value?: number } };
}): number => {
  const total = response?.hits?.total;
  return typeof total === 'number' ? total : total?.value ?? 0;
};

/**
 * Tells whether any Docker finding has ever reached the indexer, regardless of the time range, the
 * search and the pinned agent. It is what separates a page that is not set up from one whose
 * current search has no results.
 */
export const useDockerDataEverReceived = (): DockerDataStatus => {
  const repository = useMemo(() => new FindingsDataSourceRepository(), []);
  const { isLoading, dataSource, error, fetchData, fixedFilters } =
    useDataSource({ DataSource: DockerDataSource, repository });
  const [status, setStatus] = useState<DockerDataStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    if (isLoading) {
      setStatus('loading');
      return;
    }
    if (error || !dataSource || !fetchData) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    /* No date range and only the fixed filters of the data source: the search bar and the
    pinned agent do not narrow the question. */
    fetchData({
      filters: withoutPinnedAgent(fixedFilters),
      pagination: NO_HITS,
    } as Parameters<typeof fetchData>[0])
      .then(response => {
        if (!cancelled) {
          setStatus(getTotal(response) > 0 ? 'received' : 'never-received');
        }
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, dataSource]);

  return status;
};
