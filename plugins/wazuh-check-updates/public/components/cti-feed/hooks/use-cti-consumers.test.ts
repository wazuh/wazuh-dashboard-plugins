/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CtiConsumer } from '../../../../common/cti-consumers';
import { fetchCtiConsumers } from '../../../services/cti-feed';
import {
  CTI_FEED_SYNC_POLL_MS,
  CTI_FEED_SYNC_WATCH_MS,
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

/** Lets the timer fire and the fetch it starts settle. */
const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

describe('useCtiConsumers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('loads the consumers and summarizes their sync state', async () => {
    mockFetch.mockResolvedValue({ data: [consumer()] });

    const { result } = renderHook(() => useCtiConsumers());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.consumers).toHaveLength(1);
    expect(result.current.summary).toBe('upToDate');
    expect(result.current.error).toBeNull();
  });

  test('does not poll once every feed is up to date', async () => {
    mockFetch.mockResolvedValue({ data: [consumer()] });

    const { result } = renderHook(() => useCtiConsumers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await advance(CTI_FEED_SYNC_POLL_MS * 3);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('polls while a feed is syncing and stops when it finishes', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [consumer({ status: 'running' })] })
      .mockResolvedValue({ data: [consumer()] });

    const { result } = renderHook(() => useCtiConsumers());
    await waitFor(() => expect(result.current.summary).toBe('syncing'));

    await advance(CTI_FEED_SYNC_POLL_MS);
    await waitFor(() => expect(result.current.summary).toBe('upToDate'));
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await advance(CTI_FEED_SYNC_POLL_MS * 3);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('keeps polling for a while after an update request', async () => {
    mockFetch.mockResolvedValue({ data: [consumer()] });

    const { result } = renderHook(() => useCtiConsumers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.watch();
      await Promise.resolve();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await advance(CTI_FEED_SYNC_POLL_MS);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    await advance(CTI_FEED_SYNC_WATCH_MS);
    const callsAfterWindow = mockFetch.mock.calls.length;
    await advance(CTI_FEED_SYNC_POLL_MS * 3);
    expect(mockFetch).toHaveBeenCalledTimes(callsAfterWindow);
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
});
