import { useCallback, useEffect, useRef, useState } from 'react';
import type { CtiConsumer } from '../../../../common/cti-consumers';
import { fetchCtiConsumers } from '../../../services/cti-feed';
import {
  FeedSyncSummary,
  getFeedSyncSummary,
} from '../../../services/cti-consumer-sync-state';

/** Re-reads after an update check, while `last_checked_at` has not moved yet. */
export const CTI_CHECK_RETRIES = 3;
/** Pause before each of those re-reads: the indexer records the check asynchronously. */
export const CTI_CHECK_RETRY_MS = 2000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface CtiConsumersState {
  consumers: CtiConsumer[];
  /** When the indexer last checked Wazuh CTI for new content, if reported. */
  lastCheckedAt?: string;
  summary: FeedSyncSummary;
  /** Only the first load; later reads keep showing the current state. */
  loading: boolean;
  /** Any read in flight, including the first one. */
  refreshing: boolean;
  error: string | null;
  /** Reads the sync state again. Nothing polls it: it changes on demand. */
  refetch: () => Promise<void>;
  /**
   * Reads the sync state after an update check, retrying a few times until the
   * indexer records the check (`last_checked_at` changes).
   */
  refetchAfterCheck: () => Promise<void>;
}

export const useCtiConsumers = (): CtiConsumersState => {
  const [consumers, setConsumers] = useState<CtiConsumer[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  // The last check time already read, to tell when a new check lands.
  const lastCheckedAtRef = useRef<string | undefined>();

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  /** Resolves to whether the read succeeded; never rejects. */
  const read = useCallback(async (): Promise<boolean> => {
    setRefreshing(true);
    try {
      const response = await fetchCtiConsumers();
      if (!mounted.current) {
        return false;
      }
      setConsumers(response.data ?? []);
      setLastCheckedAt(response.last_checked_at);
      lastCheckedAtRef.current = response.last_checked_at;
      setError(null);
      return true;
    } catch (fetchError: unknown) {
      if (!mounted.current) {
        return false;
      }
      setError(
        fetchError instanceof Error && fetchError.message
          ? fetchError.message
          : String(fetchError),
      );
      return false;
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    await read();
  }, [read]);

  const refetchAfterCheck = useCallback(async () => {
    const previous = lastCheckedAtRef.current;
    const attempt = async (retriesLeft: number): Promise<void> => {
      // A failed read shows its error; retrying it would only repeat it.
      const ok = await read();
      if (!ok || lastCheckedAtRef.current !== previous || retriesLeft === 0) {
        return;
      }
      await wait(CTI_CHECK_RETRY_MS);
      if (mounted.current) {
        await attempt(retriesLeft - 1);
      }
    };
    await attempt(CTI_CHECK_RETRIES);
  }, [read]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    consumers,
    lastCheckedAt,
    summary: getFeedSyncSummary(consumers),
    loading,
    refreshing,
    error,
    refetch,
    refetchAfterCheck,
  };
};
