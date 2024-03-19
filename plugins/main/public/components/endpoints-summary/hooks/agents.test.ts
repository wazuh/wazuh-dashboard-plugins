import { renderHook } from '@testing-library/react-hooks';
import { useGetTotalAgents } from './agents';
import { getAgentsService } from '../services';

jest.mock('../services', () => ({
  getAgentsService: jest.fn(),
}));

describe('useGetTotalAgents hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch initial data without any error', async () => {
    (getAgentsService as jest.Mock).mockReturnValue({
      total_affected_items: 3,
    });

    const { result, waitForNextUpdate } = renderHook(() => useGetTotalAgents());

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.totalAgents).toEqual(3);
    expect(result.current.isLoading).toBeFalsy();
  });

  it('should handle error while fetching data', async () => {
    const mockErrorMessage = 'Some error occurred';
    (getAgentsService as jest.Mock).mockRejectedValue(mockErrorMessage);

    const { result, waitForNextUpdate } = renderHook(() => useGetTotalAgents());

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();
  });
});
