import { act, renderHook, waitFor } from '@testing-library/react';
import { fetchFeedContentCounts } from '../../../services/cti-feed';
import { useFeedContentCounts } from './use-feed-content-counts';

jest.mock('../../../services/cti-feed', () => ({
  fetchFeedContentCounts: jest.fn(),
}));

const mockFetch = fetchFeedContentCounts as jest.Mock;

const COUNTS = {
  rules: 1,
  decoders: 2,
  integrations: 3,
  kvdbs: 4,
  iocs: 5,
  vulnerabilities: null,
};

describe('useFeedContentCounts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('loads the counts on mount', async () => {
    mockFetch.mockResolvedValue(COUNTS);

    const { result } = renderHook(() => useFeedContentCounts());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual(COUNTS);
  });

  test('reloads the counts on refetch', async () => {
    mockFetch
      .mockResolvedValueOnce(COUNTS)
      .mockResolvedValue({ ...COUNTS, rules: 10 });

    const { result } = renderHook(() => useFeedContentCounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refetch());
    expect(result.current.counts?.rules).toBe(10);
  });
});
