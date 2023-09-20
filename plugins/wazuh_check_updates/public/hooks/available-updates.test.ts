import { renderHook, act } from '@testing-library/react-hooks';
import { useAvailableUpdates } from './available-updates';
import { AvailableUpdates } from '../../common/types';
import { getCore } from '../plugin-services';

jest.mock('../plugin-services', () => ({
  getCore: jest.fn().mockReturnValue({
    http: {
      get: jest.fn().mockResolvedValue({
        last_check: '2021-09-30T14:00:00.000Z',
        mayor: [
          {
            title: 'Wazuh 4.2.6',
            description:
              'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
            published_date: '2021-09-30T14:00:00.000Z',
            semver: {
              mayor: 4,
              minor: 2,
              patch: 6,
            },
            tag: '4.2.6',
          },
        ],
        minor: [],
        patch: [],
      }),
    },
  }),
}));

describe('useAvailableUpdates hook', () => {
  test('should fetch initial data without any error', async () => {
    const mockAvailableUpdates: AvailableUpdates = {
      last_check: '2021-09-30T14:00:00.000Z',
      mayor: [
        {
          title: 'Wazuh 4.2.6',
          description:
            'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
          published_date: '2021-09-30T14:00:00.000Z',
          semver: {
            mayor: 4,
            minor: 2,
            patch: 6,
          },
          tag: '4.2.6',
        },
      ],
      minor: [],
      patch: [],
    };

    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.availableUpdates).toEqual(mockAvailableUpdates);
    expect(result.current.isLoading).toBeFalsy();
  });

  test('should update availableUpdates', async () => {
    const mockAvailableUpdates: AvailableUpdates = {
      last_check: '2021-09-30T14:00:00.000Z',
      mayor: [
        {
          title: 'Wazuh 4.2.6',
          description:
            'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
          published_date: '2021-09-30T14:00:00.000Z',
          semver: {
            mayor: 4,
            minor: 2,
            patch: 6,
          },
          tag: '4.2.6',
        },
      ],
      minor: [],
      patch: [],
    };
    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    await waitForNextUpdate();
    expect(result.current.isLoading).toBeFalsy();

    act(() => {
      result.current.refreshAvailableUpdates(true);
    });

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.availableUpdates).toEqual(mockAvailableUpdates);
    expect(result.current.isLoading).toBeFalsy();
  });

  test('should handle error while fetching data', async () => {
    jest.setTimeout(30000);
    const mockErrorMessage = 'Some error occurred';
    const core = getCore();
    core.http.get = jest.fn().mockRejectedValue(mockErrorMessage);

    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();
  });
});
