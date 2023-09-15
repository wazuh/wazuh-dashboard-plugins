import { renderHook, act } from '@testing-library/react-hooks';
import { useUserPreferences } from './useUserPreferences';
import { UserPreferences } from '../../common/types';
import { getCore } from '../plugin-services';

jest.mock('../plugin-services', () => ({
  getCore: jest.fn().mockReturnValue({
    http: {
      get: jest
        .fn()
        .mockResolvedValue({ last_dismissed_update: 'v4.3.1', hide_update_notifications: false }),
      patch: jest
        .fn()
        .mockResolvedValue({ last_dismissed_update: 'v4.3.1', hide_update_notifications: false }),
    },
  }),
}));

describe('useUserPreferences hook', () => {
  it('should fetch initial data without any error', async () => {
    const mockUserPreferences: UserPreferences = {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    };
    const { result, waitForNextUpdate } = renderHook(() => useUserPreferences('admin'));

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.userPreferences).toEqual(mockUserPreferences);
    expect(result.current.isLoading).toBeFalsy();
  });

  it('should update user preferences', async () => {
    const mockUserPreferences: UserPreferences = {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    };
    const { result, waitForNextUpdate } = renderHook(() => useUserPreferences('admin'));

    await waitForNextUpdate();
    expect(result.current.isLoading).toBeFalsy();

    act(() => {
      result.current.updateUserPreferences(mockUserPreferences);
    });

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.userPreferences).toEqual(mockUserPreferences);
    expect(result.current.isLoading).toBeFalsy();
  });

  it('should handle error while fetching data', async () => {
    jest.setTimeout(30000);
    const mockErrorMessage = 'Some error occurred';
    const core = getCore();
    core.http.get = jest.fn().mockRejectedValue(mockErrorMessage);

    const { result, waitForNextUpdate } = renderHook(() => useUserPreferences('admin'));

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();
  });

  it('should handle error while updating user preferences', async () => {
    const mockUserPreferences: UserPreferences = {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    };
    const mockErrorMessage = 'Some error occurred';
    const mockPatch = jest
      .spyOn(getCore().http, 'patch')
      .mockImplementation(() => Promise.reject(mockErrorMessage));

    const { result, waitForNextUpdate } = renderHook(() => useUserPreferences('admin'));

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.isLoading).toBeFalsy();

    act(() => {
      result.current.updateUserPreferences(mockUserPreferences);
    });

    expect(result.current.isLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();

    mockPatch.mockRestore();
  });
});
