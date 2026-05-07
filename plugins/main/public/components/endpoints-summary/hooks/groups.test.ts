import { renderHook, waitFor } from '@testing-library/react';
import { useGetGroups } from './groups';
import { getGroupsService } from '../services';

jest.mock('../services', () => ({
  getGroupsService: jest.fn(),
}));

describe('useGetGroups hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch initial data without any error', async () => {
    (getGroupsService as jest.Mock).mockReturnValue({
      affected_items: [
        { name: 'group1' },
        { name: 'group2' },
        { name: 'group3' },
      ],
      total_affected_items: 3,
    });

    const mockGroups = ['group1', 'group2', 'group3'];
    const { result } = renderHook(() => useGetGroups());

    expect(result.current.isLoading).toBeTruthy();
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    expect(result.current.groups).toEqual(mockGroups);
    expect(result.current.isLoading).toBeFalsy();
  });

  it('should handle error while fetching data', async () => {
    const mockErrorMessage = 'Some error occurred';
    (getGroupsService as jest.Mock).mockRejectedValue(mockErrorMessage);

    const { result } = renderHook(() => useGetGroups());

    expect(result.current.isLoading).toBeTruthy();
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();
  });
});
