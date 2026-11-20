import { useCallback, useEffect, useRef, useState } from 'react';
import type { CtiConsumer } from '../../../../common/cti-consumers';
import { getHttpErrorMessage } from '../../../../common/http-error';
import { fetchCtiConsumers } from '../../../services/cti-feed';
import {
  FeedSyncSummary,
  getFeedSyncSummary,
} from '../../../services/cti-consumer-sync-state';

/** Re-reads after an update check, while `last_checked_at` has not moved yet. */
export const CTI_CHECK_RETRIES = 3;
/** Pause before each of those re-reads: the indexer records the check asynchronously. */
export const CTI_CHECK_RETRY_MS = 2000;
/** How often the sync state is read again while a feed is syncing (`followSync`). */
export const CTI_SYNC_POLL_MS = 5000;
/** Reads at {@link CTI_SYNC_POLL_MS} before the pause starts doubling. */
export const CTI_SYNC_FAST_POLLS = 12;
/** Longest pause between reads, for a feed that stays syncing. */
export const CTI_SYNC_POLL_MAX_MS = 60000;
/**
 * Longest time an update known to be running (see `followRunningUpdate`) is assumed
 * to last while no feed shows it syncing and the indexer records no new check.
 */
export const CTI_RUNNING_UPDATE_GRACE_MS = 30000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pause before the next follow-up read, after `readsSoFar` of them in a row: a sync
 * usually ends within a minute, so a feed reported syncing for longer is read less
 * often, down to once per {@link CTI_SYNC_POLL_MAX_MS}.
 */
export const getSyncPollDelay = (readsSoFar: number): number =>
  readsSoFar < CTI_SYNC_FAST_POLLS
    ? CTI_SYNC_POLL_MS
    : Math.min(
        CTI_SYNC_POLL_MS * 2 ** (readsSoFar - CTI_SYNC_FAST_POLLS + 1),
        CTI_SYNC_POLL_MAX_MS,
      );

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
  /**
   * Reads the sync state again. Nothing polls it, except while a feed is syncing
   * when `followSync` is on.
   */
  refetch: () => Promise<void>;
  /**
   * Reads the sync state after an update check, retrying a few times until the
   * indexer records the check (`last_checked_at` changes).
   */
  refetchAfterCheck: () => Promise<void>;
  /**
   * A content update is running although no feed may show it yet: the indexer
   * answered that one is already in progress, or a registration or plan change
   * started one. Counts as in progress until a feed shows it syncing (then until the
   * sync ends); until a read after the indexer recorded a new check still finds nothing
   * syncing, as the check is recorded before a feed starts syncing; or until
   * {@link CTI_RUNNING_UPDATE_GRACE_MS} pass. With `followSync`, the state is read
   * meanwhile.
   */
  followRunningUpdate: () => void;
  /** A feed is syncing, or an update is known to be running. */
  updateInProgress: boolean;
}

export interface UseCtiConsumersOptions {
  /**
   * Reads the sync state while a feed is syncing, so the page shows when the update
   * finishes: every {@link CTI_SYNC_POLL_MS} at first, then less often (see
   * {@link getSyncPollDelay}). Reads are skipped while the tab is hidden.
   */
  followSync?: boolean;
}

export const useCtiConsumers = ({
  followSync = false,
}: UseCtiConsumersOptions = {}): CtiConsumersState => {
  const [consumers, setConsumers] = useState<CtiConsumer[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped after each follow-up read, to schedule the next one.
  const [followTick, setFollowTick] = useState(0);
  // An update known to be running, not yet visible in the feeds.
  const [runningUpdate, setRunningUpdate] = useState<{
    since: number;
    /** The last check time when the update was known to start. */
    lastCheckedAt?: string;
    /** The follow-up read that first saw a newer check. */
    checkSeenAtTick?: number;
  } | null>(null);
  const mounted = useRef(true);
  // Follow-up reads since the update started being followed, to space them out.
  const followReads = useRef(0);
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
      setError(getHttpErrorMessage(fetchError) ?? String(fetchError));
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

  const summary = getFeedSyncSummary(consumers);
  const syncing = summary === 'syncing';

  const followRunningUpdate = useCallback(() => {
    setRunningUpdate({
      since: Date.now(),
      lastCheckedAt: lastCheckedAtRef.current,
    });
  }, []);

  // Once the feeds can tell, they alone say whether an update is in progress.
  useEffect(() => {
    if (!runningUpdate) {
      return;
    }
    if (syncing) {
      setRunningUpdate(null);
      return;
    }
    if (runningUpdate.checkSeenAtTick !== undefined) {
      // A read after the new check still finds nothing syncing: nothing new.
      if (followTick > runningUpdate.checkSeenAtTick) {
        setRunningUpdate(null);
      }
      return;
    }
    if (lastCheckedAt !== runningUpdate.lastCheckedAt) {
      setRunningUpdate({ ...runningUpdate, checkSeenAtTick: followTick });
    }
  }, [runningUpdate, syncing, lastCheckedAt, followTick]);

  const runningUpdateSince = runningUpdate?.since ?? null;
  useEffect(() => {
    if (runningUpdateSince === null) {
      return undefined;
    }
    const timeoutId = setTimeout(
      () => setRunningUpdate(null),
      Math.max(
        0,
        runningUpdateSince + CTI_RUNNING_UPDATE_GRACE_MS - Date.now(),
      ),
    );
    return () => clearTimeout(timeoutId);
  }, [runningUpdateSince]);

  const following = syncing || runningUpdate !== null;

  useEffect(() => {
    if (!followSync || !following) {
      followReads.current = 0;
      return undefined;
    }
    const timeoutId = setTimeout(async () => {
      if (typeof document === 'undefined' || !document.hidden) {
        await read();
      }
      followReads.current += 1;
      if (mounted.current) {
        setFollowTick(tick => tick + 1);
      }
    }, getSyncPollDelay(followReads.current));
    return () => clearTimeout(timeoutId);
  }, [followSync, following, followTick, read]);

  return {
    consumers,
    lastCheckedAt,
    summary,
    loading,
    refreshing,
    error,
    refetch,
    refetchAfterCheck,
    followRunningUpdate,
    updateInProgress: following,
  };
};
