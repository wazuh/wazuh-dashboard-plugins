import { renderHook, waitFor } from '@testing-library/react';
import { useDataSource } from '../../../../common/data-source';
import { useDockerDataEverReceived } from './use-docker-data-ever-received';

jest.mock('../../../../common/data-source', () => ({
  DockerDataSource: class {},
  FindingsDataSourceRepository: class {},
  useDataSource: jest.fn(),
}));
jest.mock('../../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: { FILTER_CONTROLLED_PINNED_AGENT_KEY: 'pinned-agent' },
}));

const mockDataSource = (overrides: Record<string, unknown>) =>
  (useDataSource as jest.Mock).mockReturnValue({
    isLoading: false,
    error: undefined,
    dataSource: {},
    fixedFilters: [],
    fetchData: jest.fn(),
    ...overrides,
  });

describe('useDockerDataEverReceived', () => {
  it('is loading while the data source is created', () => {
    mockDataSource({ isLoading: true });

    const { result } = renderHook(() => useDockerDataEverReceived());

    expect(result.current).toBe('loading');
  });

  it.each([
    [{ hits: { total: 3 } }, 'received'],
    [{ hits: { total: { value: 1 } } }, 'received'],
    [{ hits: { total: 0 } }, 'never-received'],
    [undefined, 'never-received'],
  ])('maps %j to %s', async (response, expected) => {
    const fetchData = jest.fn().mockResolvedValue(response);
    mockDataSource({ fetchData });

    const { result } = renderHook(() => useDockerDataEverReceived());

    await waitFor(() => expect(result.current).toBe(expected));
  });

  it('counts without a time range and without the pinned agent filter', async () => {
    const fixed = { meta: { controlledBy: 'docker-rule-group' } };
    const pinned = { meta: { controlledBy: 'pinned-agent' } };
    const fetchData = jest.fn().mockResolvedValue({ hits: { total: 0 } });
    mockDataSource({ fetchData, fixedFilters: [fixed, pinned] });

    const { result } = renderHook(() => useDockerDataEverReceived());

    await waitFor(() => expect(result.current).toBe('never-received'));
    expect(fetchData).toHaveBeenCalledWith({
      filters: [fixed],
      pagination: { pageSize: 0 },
    });
  });

  it('is an error when the search fails', async () => {
    mockDataSource({ fetchData: jest.fn().mockRejectedValue(new Error('x')) });

    const { result } = renderHook(() => useDockerDataEverReceived());

    await waitFor(() => expect(result.current).toBe('error'));
  });
});
