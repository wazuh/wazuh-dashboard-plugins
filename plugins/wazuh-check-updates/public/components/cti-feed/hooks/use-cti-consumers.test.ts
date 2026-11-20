/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CtiConsumer } from '../../../../common/cti-consumers';
import { fetchCtiConsumers } from '../../../services/cti-feed';
import {
  CTI_CHECK_RETRIES,
  CTI_CHECK_RETRY_MS,
  CTI_RUNNING_UPDATE_GRACE_MS,
  CTI_SYNC_FAST_POLLS,
  CTI_SYNC_POLL_MAX_MS,
  CTI_SYNC_POLL_MS,
  getSyncPollDelay,
  useCtiConsumers,
} from './use-cti-consumers';

jest.mock('../../../services/cti-feed', () => ({
  fetchCtiConsumers: jest.fn(),
}));

const mockFetch = fetchCtiConsumers as jest.Mock;

const consumer = (overrides: Partial<CtiConsumer> = {}): CtiConsumer => ({
  name: 'public-ruleset-5',
  context: 'ctx',
  type: 'cti:catalog:consumer:ruleset',
  resource: '',
  is_public: true,
  status: 'ready',
  local_offset: 10,
  remote_offset: 10,
  ...overrides,
});

describe('useCtiConsumers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('loads the consumers, the last check time and the sync summary', async () => {
    mockFetch.mockResolvedValue({
      data: [consumer()],
      last_checked_at: '2026-05-21T12:26:16.581939Z',
    });

    const { result } = renderHook(() => useCtiConsumers());

    expect(result.current.loading).toBe(true);
    expect(result.current.refreshing).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.refreshing).toBe(false);
    expect(result.current.consumers).toHaveLength(1);
    expect(result.current.lastCheckedAt).toBe('2026-05-21T12:26:16.581939Z');
    expect(result.current.summary).toBe('upToDate');
    expect(result.current.error).toBeNull();
  });

  test('does not poll by default, even while a feed is syncing', async () => {
    jest.useFakeTimers();
    try {
      mockFetch.mockResolvedValue({ data: [consumer({ status: 'running' })] });

      const { result } = renderHook(() => useCtiConsumers());
      await waitFor(() => expect(result.current.summary).toBe('syncing'));

      await act(async () => {
        jest.advanceTimersByTime(5 * 60000);
        await Promise.resolve();
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  describe('followSync', () => {
    const advance = async (ms: number) => {
      await act(async () => {
        jest.advanceTimersByTime(ms);
        await Promise.resolve();
      });
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('reads again while a feed syncs and stops once it finishes', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
        .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
        .mockResolvedValue({ data: [consumer()] });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.summary).toBe('syncing'));

      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
      expect(result.current.summary).toBe('syncing');

      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.summary).toBe('upToDate'));
      expect(mockFetch).toHaveBeenCalledTimes(3);

      await advance(5 * 60000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('does not read while nothing syncs', async () => {
      mockFetch.mockResolvedValue({ data: [consumer()] });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await advance(5 * 60000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('treats an update known to be running as in progress until a feed shows it', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [consumer()] })
        .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
        .mockResolvedValue({ data: [consumer()] });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.updateInProgress).toBe(false);

      act(() => result.current.followRunningUpdate());
      expect(result.current.updateInProgress).toBe(true);
      expect(result.current.summary).toBe('upToDate');

      // The feeds start syncing: they lead from now on.
      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.summary).toBe('syncing'));
      expect(result.current.updateInProgress).toBe(true);

      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.summary).toBe('upToDate'));
      expect(result.current.updateInProgress).toBe(false);
    });

    test('ends an update with nothing new one read after the indexer records the check', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [consumer()], last_checked_at: 'T1' })
        .mockResolvedValue({ data: [consumer()], last_checked_at: 'T2' });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.followRunningUpdate());
      // This read sees the new check: a feed may still start syncing.
      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.lastCheckedAt).toBe('T2'));
      expect(result.current.updateInProgress).toBe(true);

      // The next one still finds nothing syncing: the update had nothing new.
      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.updateInProgress).toBe(false));
    });

    test('ends an update no feed ever shows after the grace period', async () => {
      mockFetch.mockResolvedValue({ data: [consumer()] });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.followRunningUpdate());
      await advance(CTI_RUNNING_UPDATE_GRACE_MS - CTI_SYNC_POLL_MS);
      expect(result.current.updateInProgress).toBe(true);
      expect(mockFetch.mock.calls.length).toBeGreaterThan(1);

      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(result.current.updateInProgress).toBe(false));
      const reads = mockFetch.mock.calls.length;
      await advance(5 * 60000);
      expect(mockFetch).toHaveBeenCalledTimes(reads);
    });

    test('reads a feed that stays syncing less often', async () => {
      mockFetch.mockResolvedValue({ data: [consumer({ status: 'running' })] });

      const { result } = renderHook(() =>
        useCtiConsumers({ followSync: true }),
      );
      await waitFor(() => expect(result.current.summary).toBe('syncing'));

      /* eslint-disable no-await-in-loop -- each read schedules the next one */
      for (let read = 0; read < CTI_SYNC_FAST_POLLS; read++) {
        await advance(CTI_SYNC_POLL_MS);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(read + 2));
      }
      /* eslint-enable no-await-in-loop */

      // Past the fast reads, the next one waits twice as long.
      const reads = mockFetch.mock.calls.length;
      await advance(CTI_SYNC_POLL_MS);
      expect(mockFetch).toHaveBeenCalledTimes(reads);
      await advance(CTI_SYNC_POLL_MS);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(reads + 1));
    });

    test('skips the reads while the tab is hidden and resumes after', async () => {
      mockFetch
        .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
        .mockResolvedValue({ data: [consumer()] });
      const hidden = jest
        .spyOn(document, 'hidden', 'get')
        .mockReturnValue(true);
      try {
        const { result } = renderHook(() =>
          useCtiConsumers({ followSync: true }),
        );
        await waitFor(() => expect(result.current.summary).toBe('syncing'));

        await advance(3 * CTI_SYNC_POLL_MS);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        hidden.mockReturnValue(false);
        await advance(CTI_SYNC_POLL_MS);
        await waitFor(() => expect(result.current.summary).toBe('upToDate'));
      } finally {
        hidden.mockRestore();
      }
    });
  });

  describe('getSyncPollDelay', () => {
    test('reads at the base pace first', () => {
      expect(getSyncPollDelay(0)).toBe(CTI_SYNC_POLL_MS);
      expect(getSyncPollDelay(CTI_SYNC_FAST_POLLS - 1)).toBe(CTI_SYNC_POLL_MS);
    });

    test('then doubles the pause up to the longest one', () => {
      expect(getSyncPollDelay(CTI_SYNC_FAST_POLLS)).toBe(2 * CTI_SYNC_POLL_MS);
      expect(getSyncPollDelay(CTI_SYNC_FAST_POLLS + 1)).toBe(
        4 * CTI_SYNC_POLL_MS,
      );
      expect(getSyncPollDelay(CTI_SYNC_FAST_POLLS + 10)).toBe(
        CTI_SYNC_POLL_MAX_MS,
      );
    });
  });

  test('reads the state again on refetch, keeping it on screen meanwhile', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
      .mockResolvedValue({
        data: [consumer()],
        last_checked_at: '2026-05-21T12:30:00Z',
      });

    const { result } = renderHook(() => useCtiConsumers());
    await waitFor(() => expect(result.current.summary).toBe('syncing'));
    expect(result.current.lastCheckedAt).toBeUndefined();

    let refetching: Promise<void> = Promise.resolve();
    act(() => {
      refetching = result.current.refetch();
    });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toBe('syncing');

    await act(() => refetching);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.summary).toBe('upToDate');
    expect(result.current.lastCheckedAt).toBe('2026-05-21T12:30:00Z');
  });

  test('reports a failed read and recovers on refetch', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Forbidden'))
      .mockResolvedValue({ data: [consumer()] });

    const { result } = renderHook(() => useCtiConsumers());
    await waitFor(() => expect(result.current.error).toBe('Forbidden'));

    await act(() => result.current.refetch());
    expect(result.current.error).toBeNull();
    expect(result.current.summary).toBe('upToDate');
  });

  test('reports the server message of a failed read', async () => {
    mockFetch.mockRejectedValue(
      Object.assign(new Error('Forbidden'), {
        body: { message: 'No permissions to read the consumers' },
      }),
    );

    const { result } = renderHook(() => useCtiConsumers());

    await waitFor(() =>
      expect(result.current.error).toBe('No permissions to read the consumers'),
    );
  });

  describe('after an update check', () => {
    const checked = (lastCheckedAt?: string) => ({
      data: [consumer()],
      last_checked_at: lastCheckedAt,
    });

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /** Lets the given number of retry pauses pass, one at a time. */
    const passRetryPauses = async (count: number): Promise<void> => {
      if (count === 0) {
        return;
      }
      await act(async () => {
        await Promise.resolve();
        jest.advanceTimersByTime(CTI_CHECK_RETRY_MS);
        await Promise.resolve();
      });
      await passRetryPauses(count - 1);
    };

    /** Runs the follow-up reads to completion. */
    const runAfterCheck = async (
      refetchAfterCheck: () => Promise<void>,
    ): Promise<void> => {
      let settled: Promise<void> = Promise.resolve();
      act(() => {
        settled = refetchAfterCheck();
      });
      await passRetryPauses(CTI_CHECK_RETRIES + 1);
      await act(() => settled);
    };

    test('stops reading as soon as the new check time lands', async () => {
      mockFetch
        .mockResolvedValueOnce(checked('2026-05-21T12:00:00Z'))
        .mockResolvedValueOnce(checked('2026-05-21T12:00:00Z'))
        .mockResolvedValue(checked('2026-05-21T12:30:00Z'));

      const { result } = renderHook(() => useCtiConsumers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await runAfterCheck(result.current.refetchAfterCheck);

      expect(result.current.lastCheckedAt).toBe('2026-05-21T12:30:00Z');
      // The first load, one read with the old time, one with the new.
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('gives up after a few retries if the check time never moves', async () => {
      mockFetch.mockResolvedValue(checked('2026-05-21T12:00:00Z'));

      const { result } = renderHook(() => useCtiConsumers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await runAfterCheck(result.current.refetchAfterCheck);

      expect(mockFetch).toHaveBeenCalledTimes(1 + 1 + CTI_CHECK_RETRIES);
      expect(result.current.lastCheckedAt).toBe('2026-05-21T12:00:00Z');
    });

    test('does not retry a read that failed', async () => {
      mockFetch
        .mockResolvedValueOnce(checked('2026-05-21T12:00:00Z'))
        .mockRejectedValue(new Error('Forbidden'));

      const { result } = renderHook(() => useCtiConsumers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await runAfterCheck(result.current.refetchAfterCheck);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBe('Forbidden');
    });
  });
});
