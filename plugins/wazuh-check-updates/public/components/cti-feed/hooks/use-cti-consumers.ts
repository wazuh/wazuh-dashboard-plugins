import { useCallback, useEffect, useRef, useState } from 'react';
import type { CtiConsumer } from '../../../../common/cti-consumers';
import { fetchCtiConsumers } from '../../../services/cti-feed';
import {
  FeedSyncSummary,
  getFeedSyncSummary,
  isFeedSyncInProgress,
} from '../../../services/cti-consumer-sync-state';

/** Re-poll cadence while a sync is moving. */
export const CTI_FEED_SYNC_POLL_MS = 5000;
/**
 * How long to keep polling after an update request: the indexer may take a
 * moment to flip a feed to `running`, and the first poll can still see `ready`.
 */
export const CTI_FEED_SYNC_WATCH_MS = 60000;

export interface CtiConsumersState {
  consumers: CtiConsumer[];
  summary: FeedSyncSummary;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Polls for a while, so a sync requested now shows up as it starts. */
  watch: () => void;
}

export const useCtiConsumers = (): CtiConsumersState => {
  const [consumers, setConsumers] = useState<CtiConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchUntil, setWatchUntil] = useState(0);
  // Bumped after every fetch so the polling effect schedules the next one.
  const [fetchCount, setFetchCount] = useState(0);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const refetch = useCallback(async () => {
    try {
      const response = await fetchCtiConsumers();
      if (!mounted.current) {
        return;
      }
      setConsumers(response.data ?? []);
      setError(null);
    } catch (fetchError: unknown) {
      if (!mounted.current) {
        return;
      }
      setError(
        fetchError instanceof Error && fetchError.message
          ? fetchError.message
          : String(fetchError),
      );
    } finally {
      if (mounted.current) {
        setLoading(false);
        setFetchCount(count => count + 1);
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const summary = getFeedSyncSummary(consumers);
  const shouldPoll =
    !error && (isFeedSyncInProgress(summary) || Date.now() < watchUntil);

  useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }
    const timeoutId = setTimeout(() => void refetch(), CTI_FEED_SYNC_POLL_MS);
    return () => clearTimeout(timeoutId);
  }, [shouldPoll, fetchCount, refetch]);

  const watch = useCallback(() => {
    setWatchUntil(Date.now() + CTI_FEED_SYNC_WATCH_MS);
    void refetch();
  }, [refetch]);

  return { consumers, summary, loading, error, refetch, watch };
};
